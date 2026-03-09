"use client";

import { useState, useEffect } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { StreamLanguage } from '@codemirror/language';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { Save, AlertCircle, CheckCircle2, FileCode, Plus, Trash2, Edit3, X, ChevronRight, File } from "lucide-react";
import apiClient from "@/lib/api/client";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface LoaderFile {
    filename: string;
    size: number;
    mtime: string;
}

export default function AdminLoaderManagementPage() {
    const [loaders, setLoaders] = useState<LoaderFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Editor State
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [originalContent, setOriginalContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFilename, setNewFilename] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchLoaders = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/admin/loaders");
            setLoaders(res.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch loaders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLoaders();
    }, []);

    const handleEdit = async (filename: string) => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await apiClient.get(`/admin/loaders/${filename}`);
            const data = res.data.data;
            setEditingFile(filename);
            setContent(data.content);
            setOriginalContent(data.content);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || "Failed to load loader content" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingFile) return;
        if (!content.trim()) {
            setMessage({ type: 'error', text: "Content cannot be empty" });
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.put(`/admin/loaders/${editingFile}`, { content });
            setOriginalContent(content);
            setMessage({ type: 'success', text: `Loader ${editingFile} updated successfully.` });
            setTimeout(() => setMessage(null), 3000);
            fetchLoaders(); // Refresh list to update size/mtime
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || "Failed to save loader" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async () => {
        let name = newFilename.trim();
        if (!name) return;
        if (!name.endsWith(".lua")) name += ".lua";

        setIsSaving(true);
        try {
            await apiClient.put(`/admin/loaders/${name}`, { content: "-- New Loader File" });
            setIsCreateModalOpen(false);
            setNewFilename("");
            setMessage({ type: 'success', text: `Loader ${name} created successfully.` });
            fetchLoaders();
            handleEdit(name); // Open for editing
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to create loader");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isDeleting) return;
        try {
            await apiClient.delete(`/admin/loaders/${isDeleting}`);
            if (editingFile === isDeleting) {
                setEditingFile(null);
                setContent("");
            }
            setIsDeleting(null);
            setMessage({ type: 'success', text: "Loader deleted successfully" });
            fetchLoaders();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete loader");
        }
    };

    const hasChanges = content !== originalContent;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
                <div>
                    <h1 className="text-2xl font-serif text-white flex items-center gap-2">
                        <FileCode className="text-rose-400" size={24} />
                        Loader Management
                    </h1>
                    <p className="text-sm font-mono text-offgray-500 mt-1">
                        Manage layer-2 obfuscated proxy files stored in <code className="text-rose-400 bg-rose-500/10 px-1 rounded">loaders/</code>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                    >
                        <Plus size={16} />
                        Add New Loader
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* File List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-[#0a0c0f]/40 border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
                        <div className="bg-white/[0.03] px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                            <span className="text-xs font-bold text-offgray-400 uppercase tracking-wider">File Pool</span>
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-offgray-400">{loaders.length} files</span>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            {loaders.length === 0 && !isLoading ? (
                                <div className="p-10 text-center text-offgray-500 italic text-sm">
                                    No loader files found.
                                </div>
                            ) : (
                                loaders.map((file) => (
                                    <div
                                        key={file.filename}
                                        onClick={() => handleEdit(file.filename)}
                                        className={`group flex items-center justify-between p-3 border-b border-white/[0.03] cursor-pointer transition-colors ${editingFile === file.filename ? 'bg-rose-500/10 border-l-2 border-l-rose-500' : 'hover:bg-white/[0.02]'}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${editingFile === file.filename ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-offgray-400 group-hover:text-white group-hover:bg-white/10'}`}>
                                                <File size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-white truncate">{file.filename}</div>
                                                <div className="text-[10px] text-offgray-500 font-mono">{(file.size / 1024).toFixed(1)} KB • {new Date(file.mtime).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsDeleting(file.filename); }}
                                                className="p-1.5 text-offgray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <ChevronRight size={14} className="text-offgray-600" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {isLoading && !editingFile && (
                        <div className="flex justify-center p-4">
                            <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Editor Section */}
                <div className="lg:col-span-8 space-y-4">
                    {!editingFile ? (
                        <div className="flex flex-col items-center justify-center h-[500px] border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
                            <div className="p-4 bg-white/5 rounded-full mb-4 text-offgray-600">
                                <FileCode size={48} />
                            </div>
                            <h3 className="text-white font-medium">No Loader Selected</h3>
                            <p className="text-offgray-500 text-sm mt-1 max-w-[250px] text-center">Select a file from the list or create a new one to begin editing.</p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-2 duration-300">
                            {/* Editor Toolbar */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="text-sm font-mono text-white bg-white/10 px-2 py-1 rounded truncate">
                                        {editingFile}
                                    </div>
                                    {hasChanges && <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(editingFile)}
                                        className="p-2 text-offgray-500 hover:text-white transition-colors"
                                        title="Reload file"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || !hasChanges}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isSaving || !hasChanges
                                            ? 'bg-white/5 text-offgray-600 cursor-not-allowed'
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            }`}
                                    >
                                        {isSaving ? (
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={14} />
                                        )}
                                        {isSaving ? "Saving..." : "Save File"}
                                    </button>
                                </div>
                            </div>

                            {/* Message Alert */}
                            {message && (
                                <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-1 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    {message.text}
                                </div>
                            )}

                            {/* Editor Container */}
                            <div className="w-full min-h-[500px] h-[calc(100vh-280px)] relative rounded-xl border border-white/[0.08] bg-[#282c34] overflow-hidden focus-within:border-rose-500/30 transition-colors shadow-2xl">
                                <CodeMirror
                                    value={content}
                                    height="100%"
                                    theme={oneDark}
                                    extensions={[StreamLanguage.define(lua)]}
                                    onChange={(val) => setContent(val)}
                                    className="absolute inset-0 w-full h-full text-[13px] font-mono custom-codemirror"
                                    basicSetup={{
                                        lineNumbers: true,
                                        syntaxHighlighting: true,
                                        bracketMatching: true,
                                        closeBrackets: true,
                                        autocompletion: true,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0a0c0f] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-serif text-white flex items-center gap-2">
                                    <Plus className="text-rose-400" size={20} />
                                    Create New Loader
                                </h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-offgray-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-mono text-offgray-500 mb-1.5 uppercase tracking-wider">Filename</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newFilename}
                                            onChange={(e) => setNewFilename(e.target.value)}
                                            placeholder="loader-x"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-offgray-600 focus:outline-none focus:border-rose-500/50 transition-colors pr-12"
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-offgray-600 font-mono text-sm">.lua</span>
                                    </div>
                                    <p className="text-[10px] text-offgray-600 mt-2 italic">A new file will be initialized with a basic decryption stub.</p>
                                </div>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newFilename.trim() || isSaving}
                                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 disabled:bg-rose-500/30 disabled:text-white/30 text-white font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Loader"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!isDeleting}
                title="Delete Loader"
                message={`Are you sure you want to delete "${isDeleting}"? This action cannot be undone and may affect active bypass deployments using this loader.`}
                confirmLabel="Delete Forever"
                variant="danger"
                onConfirm={handleDelete}
                onClose={() => setIsDeleting(null)}
            />

            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-codemirror .cm-editor {
                    height: 100% !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}} />
        </div>
    );
}
