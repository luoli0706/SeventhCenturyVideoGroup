import os
import shutil
import glob
from typing import List, Dict, Any, Optional
from datetime import datetime

from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, TextLoader, UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from sqlalchemy import create_engine, text
import requests

# Load environment variables (prefer ai-backend/.env)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

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
        
        # Initialize Embeddings (Local)
        # Using a small, fast model for CPU
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Initialize Vector Store
        self.vector_store = Chroma(
            persist_directory=self.chroma_path,
            embedding_function=self.embeddings,
            collection_name="scvg_knowledge_base"
        )
        
        # Initialize LLM
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

    def load_documents(self):
        """Load and process all markdown files from data source."""
        print("Loading documents...")
        
        if not os.path.exists(self.data_source_path):
            os.makedirs(self.data_source_path, exist_ok=True)
            return {"status": "warning", "message": "Data source directory created but empty."}

        # Find all MD files
        md_files = glob.glob(os.path.join(self.data_source_path, "**/*.md"), recursive=True)
        print(f"Found {len(md_files)} markdown files.")
        
        documents = []
        for file_path in md_files:
            try:
                # Using TextLoader as it's more robust for simple MD
                loader = TextLoader(file_path, encoding='utf-8')
                docs = loader.load()
                # Add metadata
                for doc in docs:
                    doc.metadata["source"] = file_path
                    doc.metadata["filename"] = os.path.basename(file_path)
                documents.extend(docs)
            except Exception as e:
                print(f"Error loading {file_path}: {e}")

        if not documents:
            return {"status": "warning", "message": "No documents found."}

        # Text Splitting
        # 1. Split by headers (Markdown specific)
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
        
        md_header_splits = []
        for doc in documents:
            splits = markdown_splitter.split_text(doc.page_content)
            for split in splits:
                split.metadata.update(doc.metadata)
                md_header_splits.append(split)

        # 2. Recursive Character Split
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.split_documents(md_header_splits)
        
        print(f"Generated {len(splits)} chunks.")
        
        # Re-initialize vector store (clear old data)
        # Note: Chroma reset is a bit tricky, often better to delete directory or use reset()
        # For simplicity here, we add and allow duplicates or we could delete the collection
        try:
            self.vector_store.delete_collection() # Clear existing
            self.vector_store = Chroma(
                persist_directory=self.chroma_path,
                embedding_function=self.embeddings,
                collection_name="scvg_knowledge_base"
            )
        except Exception as e:
            print(f"Error clearing collection: {e}")

        # Batch add documents
        batch_size = 100
        for i in range(0, len(splits), batch_size):
            batch = splits[i:i+batch_size]
            self.vector_store.add_documents(batch)
            print(f"Indexed batch {i//batch_size + 1}/{(len(splits)-1)//batch_size + 1}")

        return {"status": "success", "message": f"Indexed {len(splits)} chunks from {len(documents)} files."}

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
        # Count documents in vector store
        try:
            count = self.vector_store._collection.count()
            return {
                "status": "active",
                "backend": "python-langchain",
                "chunk_count": count,
                "model": self.model_name
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def query(self, query: str, top_k: int = 3):
        results = self.vector_store.similarity_search_with_score(query, k=top_k)
        processed_results = []
        for doc, score in results:
            processed_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score) # Chroma returns distance usually, check metric
            })
        return processed_results

    def chat(self, message: str, history: List[dict] = None):
        if not self.llm:
            return {"reply": "Error: LLM not configured (missing API Key).", "sources": []}

        # Retrieve context
        docs = self.vector_store.similarity_search(message, k=4)
        context_text = "\n\n".join([f"Source: {doc.metadata.get('filename', 'unknown')}\nContent: {doc.page_content}" for doc in docs])
        
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
                "sources": [doc.metadata.get('filename') for doc in docs]
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
            content = "---
"
            content += "title: 柒世纪视频组成员信息\n"
            content += "role: 社团成员信息库\n"
            content += "club: 柒世纪视频组\n"
            content += "language: zh-CN\n"
            content += f"last_updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            content += "---

"
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
                content += "---

"

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
