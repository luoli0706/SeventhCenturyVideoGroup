import os
import shutil
import glob
from typing import List, Dict, Any, Optional
from datetime import datetime

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from sqlalchemy import create_engine, text
import requests

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables (prefer ai-backend/.env)
# Use override=True so local .env reliably takes effect.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=True)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"), override=False)

class RAGService:
    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.api_base = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
        self.model_name = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        
        # Paths
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        # Knowledge base lives under ai-backend/AI-DATA-RESOURCE
        self.data_source_path = os.path.abspath(os.path.join(self.base_dir, "AI-DATA-RESOURCE"))
        # Optional: reuse existing SQLite DB if present (for member sync)
        self.db_path = os.path.abspath(os.path.join(self.base_dir, "../backend/go-echo-sqlite/app.db"))
        self.chroma_path = os.path.join(self.base_dir, "chroma_db")
        
        print(f"Data Source: {self.data_source_path}")
        print(f"DB Path: {self.db_path}")

        # Hot-update bookkeeping
        self._last_file_state: dict[str, tuple[float, int]] = {}
        self._last_refresh_check: float = 0.0

        # In-memory retrieval index (TF-IDF)
        self._vectorizer: Optional[TfidfVectorizer] = None
        self._tfidf_matrix = None
        self._chunks: list[dict[str, Any]] = []
        
        # Initialize LLM (DeepSeek/OpenAI-compatible)
        if self.api_key:
            self.llm = ChatOpenAI(
                model=self.model_name,
                openai_api_key=self.api_key,
                openai_api_base=self.api_base,
                temperature=0.3
            )
        else:
            print("Warning: DEEPSEEK_API_KEY not found. Chat functionality will be limited.")
            self.llm = None

        # Build index lazily on first request; this keeps startup fast.

    def load_documents(self):
        """Load and index all markdown files from data source.

        Uses a lightweight TF-IDF + cosine similarity index to avoid
        chromadb/pydantic-v1 issues on Python 3.14.
        """
        print("Loading documents...")
        
        if not os.path.exists(self.data_source_path):
            os.makedirs(self.data_source_path, exist_ok=True)
            return {"status": "warning", "message": "Data source directory created but empty."}

        md_files = glob.glob(os.path.join(self.data_source_path, "**/*.md"), recursive=True)
        print(f"Found {len(md_files)} markdown files.")

        chunks: list[dict[str, Any]] = []

        def split_text(text_content: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
            text_content = text_content.replace("\r\n", "\n")
            text_content = text_content.strip()
            if not text_content:
                return []

            parts: list[str] = []
            start = 0
            while start < len(text_content):
                end = min(len(text_content), start + chunk_size)
                parts.append(text_content[start:end].strip())
                if end == len(text_content):
                    break
                start = max(0, end - overlap)
            return [p for p in parts if p]

        for file_path in md_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    raw = f.read()
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
                continue

            filename = os.path.basename(file_path)
            for part in split_text(raw):
                chunks.append(
                    {
                        "content": part,
                        "metadata": {"source": file_path, "filename": filename},
                    }
                )

        if not chunks:
            self._chunks = []
            self._vectorizer = None
            self._tfidf_matrix = None
            return {"status": "warning", "message": "No documents found."}

        texts = [c["content"] for c in chunks]
        vectorizer = TfidfVectorizer(
            max_features=50000,
            ngram_range=(1, 2),
            stop_words=None,
        )
        matrix = vectorizer.fit_transform(texts)

        self._chunks = chunks
        self._vectorizer = vectorizer
        self._tfidf_matrix = matrix

        print(f"Indexed {len(chunks)} chunks (TF-IDF).")
        return {"status": "success", "message": f"Indexed {len(chunks)} chunks from {len(md_files)} files."}

    def _compute_file_state(self) -> dict[str, tuple[float, int]]:
        state: dict[str, tuple[float, int]] = {}
        md_files = glob.glob(os.path.join(self.data_source_path, "**/*.md"), recursive=True)
        for file_path in md_files:
            try:
                st = os.stat(file_path)
                state[file_path] = (float(st.st_mtime), int(st.st_size))
            except OSError:
                continue
        return state

    def refresh_if_needed(self, min_interval_seconds: float = 2.0):
        """Lightweight hot update: if md files changed, rebuild the vector index.

        This avoids needing a separate watchdog process while still supporting
        "add a new .md file -> becomes searchable".
        """
        now = datetime.now().timestamp()
        if now - self._last_refresh_check < min_interval_seconds:
            return

        self._last_refresh_check = now

        # Ensure directory exists
        os.makedirs(self.data_source_path, exist_ok=True)

        current_state = self._compute_file_state()
        if not self._last_file_state:
            # First-time: record state but don't force a rebuild unless empty
            self._last_file_state = current_state
            try:
                if self.vector_store._collection.count() == 0 and current_state:
                    self.load_documents()
            except Exception:
                # If count fails, try to load
                if current_state:
                    self.load_documents()
            return

        if current_state != self._last_file_state:
            print("Knowledge base changed. Re-indexing...")
            self._last_file_state = current_state
            self.load_documents()

    def get_status(self):
        return {
            "status": "active",
            "backend": "python-tfidf",
            "chunk_count": len(self._chunks),
            "model": self.model_name,
        }

    def query(self, query: str, top_k: int = 3):
        if not query:
            return []

        # Hot update / lazy load
        self.refresh_if_needed()
        if not self._vectorizer or self._tfidf_matrix is None or not self._chunks:
            self.load_documents()
        if not self._vectorizer or self._tfidf_matrix is None or not self._chunks:
            return []

        q = self._vectorizer.transform([query])
        sims = cosine_similarity(q, self._tfidf_matrix).flatten()

        k = max(1, int(top_k or 3))
        top_indices = sims.argsort()[::-1][:k]

        results: list[dict[str, Any]] = []
        for idx in top_indices:
            chunk = self._chunks[int(idx)]
            results.append(
                {
                    "content": chunk["content"],
                    "metadata": chunk.get("metadata", {}),
                    "score": float(sims[int(idx)]),
                }
            )
        return results

    def chat(self, message: str, history: List[dict] = None):
        if not self.llm:
            return {"reply": "Error: LLM not configured (missing API Key).", "sources": []}

        # Retrieve context
        results = self.query(message, top_k=4)
        context_text = "\n\n".join(
            [
                f"Source: {(r.get('metadata') or {}).get('filename', 'unknown')}\nContent: {r.get('content', '')}"
                for r in results
            ]
        )
        
        # Construct Prompt
        system_template = """你是一个专业的视频社团AI助手（柒世纪视频组）。
请根据以下上下文信息回答用户的问题。
如果不确定或上下文中没有相关信息，请诚实说明。
回答要亲切、专业，使用简体中文。

上下文信息：
{context}
"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_template),
            ("user", "{question}")
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            response = chain.invoke({"context": context_text, "question": message})
            return {
                "reply": response,
                "sources": [(r.get("metadata") or {}).get("filename") for r in results]
            }
        except Exception as e:
            return {"error": str(e)}

    def sync_members(self):
        """Sync members from SQLite to Markdown."""
        if not os.path.exists(self.db_path):
            return {"status": "error", "message": f"Database not found at {self.db_path}"}
            
        try:
            # Connect to SQLite
            engine = create_engine(f"sqlite:///{self.db_path}")
            with engine.connect() as conn:
                result = conn.execute(text("SELECT * FROM club_members"))
                members = result.mappings().all()
                
            # Generate Markdown
            content = "---\n"
            content += "title: 柒世纪视频组成员信息\n"
            content += "role: 社团成员信息库\n"
            content += "club: 柒世纪视频组\n"
            content += "language: zh-CN\n"
            content += f"last_updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            content += "---\n\n"
            content += "# 柒世纪视频组成员信息库\n\n"
            content += "本文档记录了柒世纪视频组所有活跃成员的基本信息，用于AI助手快速了解成员背景。\n\n"
            content += f"- 总计: {len(members)} 名成员\n"
            content += f"- 更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            content += "## 成员详细信息\n\n"

            for i, member in enumerate(members):
                content += f"### {i+1}. {member['cn']}\n\n" # Assuming 'cn' is the column name, verify case
                # In GORM/SQLite default, columns might be lowercase or as defined. 
                # Let's handle generic dict access
                
                # Helper to get field safely
                def get_field(m, keys):
                    for k in keys:
                        if k in m: return m[k]
                    return "未知"

                cn = get_field(member, ['cn', 'CN'])
                sex = get_field(member, ['sex', 'Sex'])
                year = get_field(member, ['year', 'Year'])
                direction = get_field(member, ['direction', 'Direction'])
                position = get_field(member, ['position', 'Position'])
                status = get_field(member, ['status', 'Status'])
                remark = get_field(member, ['remark', 'Remark'])

                # If cn was not found above (loop logic fix) - re-assigning for consistency
                # Actually mapping keys might be lowercase 'cn', 'sex', etc.
                
                content += f"**性别**: {sex}\n\n"
                content += f"**年级**: {year}\n\n"
                content += f"**方向**: {direction}\n\n"
                content += f"**职位**: {position}\n\n"
                content += f"**状态**: {status}\n\n"
                if remark and remark != "未知":
                    content += f"**备注**: {remark}\n\n"
                content += "---\n"

            # Write to file
            target_file = os.path.join(self.data_source_path, "社团成员信息.md")
            with open(target_file, "w", encoding="utf-8") as f:
                f.write(content)
                
            # Trigger refresh to index new data
            self.load_documents()
            
            return {"status": "success", "message": f"Synced {len(members)} members and refreshed knowledge base."}
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": str(e)}
