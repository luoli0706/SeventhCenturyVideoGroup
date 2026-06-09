import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Save,
  History,
  Eye,
  RotateCcw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_default: number;
  word_count?: number;
}

interface WordPair {
  id: number;
  category_id: number;
  word_a: string;
  word_b: string;
}

interface CategoryBackup {
  id: number;
  category_id: number;
  backup_date: string;
  name: string;
  description: string | null;
  words_json: string; // JSON string of [word_a, word_b][]
}

interface ContributeProps {
  onBack: () => void;
}

export function Contribute({ onBack }: ContributeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection states
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [words, setWords] = useState<WordPair[]>([]);
  const [backups, setBackups] = useState<CategoryBackup[]>([]);
  
  // Creation states
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Editing states (for selected category)
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  
  // Add word states
  const [wordA, setWordA] = useState('');
  const [wordB, setWordB] = useState('');

  // Preview states
  const [previewBackup, setPreviewBackup] = useState<CategoryBackup | null>(null);

  // Status alerts
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load all categories from backend
  const loadCategories = (selectId?: number) => {
    fetch(API_BASE + '/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (selectId) {
          const found = data.find((c: Category) => c.id === selectId);
          if (found) {
            setSelectedCat(found);
            setEditName(found.name);
            setEditDesc(found.description || '');
            loadWords(found.id);
            loadBackups(found.id);
          }
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  };

  // Load word pairs for a category
  const loadWords = (catId: number) => {
    fetch(`${API_BASE}/categories/${catId}/words`)
      .then(res => res.json())
      .then(data => setWords(data))
      .catch(err => console.error('Error fetching words:', err));
  };

  // Load backups for a category
  const loadBackups = (catId: number) => {
    fetch(`${API_BASE}/categories/${catId}/backups`)
      .then(res => res.json())
      .then(data => setBackups(data))
      .catch(err => console.error('Error fetching backups:', err));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  // Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch(API_BASE + '/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, description: newCatDesc })
      });
      const data = await res.json();
      
      if (res.ok) {
        showStatus('success', `新词库【${data.name}】创建成功！`);
        setNewCatName('');
        setNewCatDesc('');
        setIsCreating(false);
        // Automatically select the newly created category
        loadCategories(data.id);
      } else {
        showStatus('error', data.error || '创建分类失败');
      }
    } catch (err) {
      showStatus('error', '网络请求失败，请稍后重试');
    }
  };

  // Handle Category Metadata Update
  const handleUpdateCategory = async () => {
    if (!selectedCat || !editName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/categories/${selectedCat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        showStatus('success', `词库基本信息已成功修改！`);
        loadCategories(selectedCat.id);
      } else {
        showStatus('error', data.error || '保存修改失败');
      }
    } catch (err) {
      showStatus('error', '网络请求失败，请稍后重试');
    }
  };

  // Handle Category Deletion
  const handleDeleteCategory = async () => {
    if (!selectedCat) return;
    if (!window.confirm(`确定要彻底删除词库【${selectedCat.name}】吗？这将删除该词库下的所有词组对和备份记录！`)) return;

    try {
      const res = await fetch(`${API_BASE}/categories/${selectedCat.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showStatus('success', `词库【${selectedCat.name}】已成功删除`);
        setSelectedCat(null);
        setWords([]);
        setBackups([]);
        loadCategories();
      } else {
        const data = await res.json();
        showStatus('error', data.error || '删除词库失败');
      }
    } catch (err) {
      showStatus('error', '网络请求失败，请稍后重试');
    }
  };

  // Handle Adding Word Pair
  const handleAddWordPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !wordA.trim() || !wordB.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/categories/${selectedCat.id}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_a: wordA.trim(), word_b: wordB.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        showStatus('success', `成功添加：${wordA} vs ${wordB}`);
        setWordA('');
        setWordB('');
        loadWords(selectedCat.id);
        // Reload categories to update word count in left panel
        loadCategories(selectedCat.id);
      } else {
        showStatus('error', data.error || '添加词汇对失败');
      }
    } catch (err) {
      showStatus('error', '网络请求失败，请稍后重试');
    }
  };

  // Handle Deleting Word Pair
  const handleDeleteWordPair = async (wordId: number) => {
    if (!selectedCat) return;

    try {
      const res = await fetch(`${API_BASE}/categories/${selectedCat.id}/words/${wordId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showStatus('success', '词组对已删除');
        loadWords(selectedCat.id);
        loadCategories(selectedCat.id);
      } else {
        const data = await res.json();
        showStatus('error', data.error || '删除词组对失败');
      }
    } catch (err) {
      showStatus('error', '网络请求失败，请稍后重试');
    }
  };

  // Handle Rollback
  const handleRollback = async (backupId: number, backupDate: string) => {
    if (!selectedCat) return;
    if (!window.confirm(`确定要将词库【${selectedCat.name}】回退至 ${new Date(backupDate).toLocaleString()} 的备份版本吗？这会覆盖当前的词汇对列表！`)) return;

    try {
      const res = await fetch(`${API_BASE}/categories/${selectedCat.id}/backups/${backupId}/rollback`, {
        method: 'POST'
      });
      if (res.ok) {
        showStatus('success', '已成功回退到指定备份版本！');
        setPreviewBackup(null);
        // Refresh everything
        loadCategories(selectedCat.id);
      } else {
        const data = await res.json();
        showStatus('error', data.error || '回退备份失败');
      }
    } catch (err) {
      showStatus('error', '网络请求失败，请稍后重试');
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#050811] text-gray-200 p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6 mt-2 border-b border-slate-900 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-400 transition font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回大厅
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          词汇库预览与编辑管理
        </h2>
        <div className="w-16"></div>
      </div>

      {/* Main Double Panel */}
      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-6 flex-grow items-start">
        {/* LEFT PANEL: Category List & Search (4 cols) */}
        <div className="md:col-span-4 glass-card rounded-2xl p-4 border border-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">词库分类</h3>
            <button
              onClick={() => {
                setSelectedCat(null);
                setIsCreating(true);
              }}
              className="text-2xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded-lg transition flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              新建词库
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索词库名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-2xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Categories scrollable list */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredCategories.length === 0 ? (
              <div className="text-center text-3xs text-gray-600 py-10">未找到匹配的词库</div>
            ) : (
              filteredCategories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedCat(cat);
                    setEditName(cat.name);
                    setEditDesc(cat.description || '');
                    loadWords(cat.id);
                    loadBackups(cat.id);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition text-left relative overflow-hidden ${
                    selectedCat?.id === cat.id
                      ? 'bg-indigo-950/20 border-indigo-500 neo-glow'
                      : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white max-w-[70%] truncate">{cat.name}</span>
                    <span className="text-4xs px-1 py-0.2 bg-slate-900 border border-slate-800 text-gray-400 rounded">
                      {cat.word_count || 0}对
                    </span>
                  </div>
                  <p className="text-3xs text-gray-500 line-clamp-1 pr-6">{cat.description || '暂无描述'}</p>
                  
                  {/* Category role tag */}
                  <span className={`absolute right-1 bottom-1 text-5xs px-1 rounded-sm uppercase tracking-widest font-black ${
                    cat.is_default ? 'text-indigo-400/60' : 'text-emerald-400/60'
                  }`}>
                    {cat.is_default ? '内置' : '自定义'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Editor & Backups (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Status Alert Overlay */}
          {status && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border w-full ${
              status.type === 'success' ? 'bg-emerald-950/45 border-emerald-800/30 text-emerald-400' : 'bg-red-950/45 border-red-800/30 text-red-400'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{status.msg}</span>
            </div>
          )}

          {isCreating ? (
            /* CREATE CATEGORY SCREEN */
            <div className="glass-card rounded-2xl p-6 border border-slate-900 text-left">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">新建词库分类</h3>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">词库分类名称</label>
                  <input
                    type="text"
                    placeholder="例如: 舌尖美食、金庸武侠..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value.slice(0, 15))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">词库分类描述 (可选)</label>
                  <textarea
                    placeholder="简单介绍一下这个词库适合哪些人群或主题..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value.slice(0, 50))}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-grow bg-slate-900 border border-slate-800 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-grow bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    创建词库
                  </button>
                </div>
              </form>
            </div>
          ) : selectedCat ? (
            /* SELECTED CATEGORY DETAILED VIEW & EDITOR */
            <div className="space-y-6">
              {/* Box A: Category details editor */}
              <div className="glass-card rounded-2xl p-6 border border-slate-900 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">词库基本信息</h3>
                  </div>
                  <span className={`text-4xs px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                    selectedCat.is_default ? 'bg-indigo-950 border border-indigo-500/20 text-indigo-400' : 'bg-emerald-950 border border-emerald-500/20 text-emerald-400'
                  }`}>
                    {selectedCat.is_default ? '内置系统词库' : '用户自定义词库'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">词库名称</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value.slice(0, 15))}
                      placeholder="词库名称"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">词库描述</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value.slice(0, 50))}
                      placeholder="词库描述描述..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-950">
                  <button
                    onClick={handleDeleteCategory}
                    className="bg-red-955/20 border border-red-900/30 hover:bg-red-950/60 text-red-400 font-bold px-3 py-1.5 rounded-xl text-2xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除词库
                  </button>
                  <button
                    onClick={handleUpdateCategory}
                    disabled={!editName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-xl text-2xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    保存修改
                  </button>
                </div>
              </div>

              {/* Box B: Word Pairs list & Add form */}
              <div className="glass-card rounded-2xl p-6 border border-slate-900 text-left space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    词组对维护 ({words.length}组)
                  </h3>
                </div>

                {/* Inline Add Word form */}
                <form onSubmit={handleAddWordPair} className="grid md:grid-cols-12 gap-3 items-end bg-slate-950/40 border border-slate-900 p-3 rounded-xl">
                  <div className="md:col-span-5">
                    <label className="block text-3xs font-bold text-gray-400 mb-1">词汇 A</label>
                    <input
                      type="text"
                      placeholder="例: 牛奶"
                      value={wordA}
                      onChange={(e) => setWordA(e.target.value.slice(0, 10))}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-3xs font-bold text-gray-400 mb-1">词汇 B (相似词)</label>
                    <input
                      type="text"
                      placeholder="例: 豆浆"
                      value={wordB}
                      onChange={(e) => setWordB(e.target.value.slice(0, 10))}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.8 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>
                </form>

                {/* Scrollable list of current words */}
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {words.length === 0 ? (
                    <div className="text-center text-3xs text-gray-600 py-6">词库为空，请在上方添加词对</div>
                  ) : (
                    words.map(w => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-900 rounded-lg hover:border-slate-800 transition"
                      >
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-gray-300">{w.word_a}</span>
                          <span className="text-gray-600 font-bold text-3xs">VS</span>
                          <span className="font-semibold text-gray-300">{w.word_b}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteWordPair(w.id)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Box C: Backups history */}
              <div className="glass-card rounded-2xl p-6 border border-slate-900 text-left space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <History className="w-5 h-5 text-amber-500 animate-pulse-glow" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">历史备份快照 (最近3次)</h3>
                </div>

                <p className="text-3xs text-gray-500 leading-relaxed">
                  💡 提示: 系统在每天凌晨 00:00 自动进行快照备份。备份数据不可被直接编辑，仅供预览和随时一键恢复回滚。
                </p>

                <div className="space-y-2">
                  {backups.length === 0 ? (
                    <div className="text-center text-3xs text-gray-600 py-4">暂无历史备份快照数据</div>
                  ) : (
                    backups.map((b) => {
                      let wordCount = 0;
                      try {
                        const parsed = JSON.parse(b.words_json);
                        wordCount = parsed.length;
                      } catch (e) {}

                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-900 rounded-xl"
                        >
                          <div>
                            <div className="text-xs font-bold text-gray-300">
                              备份节点 #{b.id} ({wordCount}组词对)
                            </div>
                            <div className="text-4xs text-gray-500 mt-1">
                              备份时间: {new Date(b.backup_date).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setPreviewBackup(b)}
                              className="bg-slate-900 hover:bg-slate-850 text-gray-300 text-3xs font-bold px-2 py-1.5 rounded-lg border border-slate-850 flex items-center gap-0.5 transition cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              预览
                            </button>
                            <button
                              onClick={() => handleRollback(b.id, b.backup_date)}
                              className="bg-amber-955/20 border border-amber-900/30 hover:bg-amber-950/80 text-amber-400 text-3xs font-bold px-2 py-1.5 rounded-lg flex items-center gap-0.5 transition cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              回退
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* EMPTY STATE GUIDE */
            <div className="glass-card rounded-2xl p-16 border border-slate-900 flex flex-col items-center justify-center text-center max-w-xl mx-auto flex-grow min-h-[400px]">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">选择词汇库开始管理</h3>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                请在左侧列表选择您想要编辑、预览的词汇库，或点击“新建词库”创建一个全新的词库。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BACKUP PREVIEW MODAL */}
      {previewBackup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-800 text-left space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-white">备份内容预览 (不可编辑)</h3>
                <span className="text-4xs text-gray-500 block mt-0.5">
                  备份时间: {new Date(previewBackup.backup_date).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xs font-bold text-gray-400">词库名称</div>
              <div className="text-xs text-white bg-slate-950 p-2 rounded-lg border border-slate-900">{previewBackup.name}</div>
            </div>

            <div className="space-y-1">
              <div className="text-2xs font-bold text-gray-400">词库描述</div>
              <div className="text-xs text-white bg-slate-950 p-2 rounded-lg border border-slate-900">
                {previewBackup.description || '无描述'}
              </div>
            </div>

            {/* Scrollable words json parsed */}
            <div className="space-y-1">
              <div className="text-2xs font-bold text-gray-400">包含词对列表</div>
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 text-xs">
                {(() => {
                  try {
                    const parsed: [string, string][] = JSON.parse(previewBackup.words_json);
                    if (parsed.length === 0) return <span className="text-3xs text-gray-600 block text-center">备份中无词组对</span>;
                    return parsed.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-900/60 last:border-b-0">
                        <span className="text-gray-300">{p[0]}</span>
                        <span className="text-5xs text-gray-600 font-black">VS</span>
                        <span className="text-gray-300">{p[1]}</span>
                      </div>
                    ));
                  } catch (e) {
                    return <span className="text-3xs text-red-500">解析词汇失败</span>;
                  }
                })()}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPreviewBackup(null)}
                className="flex-1 bg-slate-900 border border-slate-800 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer text-center"
              >
                关闭预览
              </button>
              <button
                onClick={() => handleRollback(previewBackup.id, previewBackup.backup_date)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold py-2 rounded-xl transition shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                恢复至此备份
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
