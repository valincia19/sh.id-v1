"use client";

import { useState, useEffect } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { StreamLanguage } from '@codemirror/language';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { Save, AlertCircle, CheckCircle2, FileCode, RefreshCcw } from "lucide-react";
import apiClient from "@/lib/api/client";

export default function AdminStubEditorPage() {
    const [activeTab, setActiveTab] = useState<'obfuscated' | 'raw'>('obfuscated');
    const [content, setContent] = useState("");
    const [originalContent, setOriginalContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const loadStub = async (type: 'obfuscated' | 'raw' = activeTab) => {
        setIsLoading(true);
        setMessage(null);
        try {
            const endpoint = type === 'obfuscated' ? "/admin/settings/stub" : "/admin/settings/stub/raw";
            const res = await apiClient.get(endpoint);
            const loadedContent = res.data.data || "";
            setContent(loadedContent);
            setOriginalContent(loadedContent);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || "Failed to load stub" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStub(activeTab);
    }, [activeTab]);

    const handleSave = async () => {
        if (!content.trim()) {
            setMessage({ type: 'error', text: "Stub content cannot be empty" });
            return;
        }

        setIsSaving(true);
        setMessage(null);
        try {
            const endpoint = activeTab === 'obfuscated' ? "/admin/settings/stub" : "/admin/settings/stub/raw";
            await apiClient.put(endpoint, { content });
            setOriginalContent(content);
            setMessage({
                type: 'success',
                text: `${activeTab === 'obfuscated' ? 'Obfuscated' : 'Raw'} stub updated successfully. Cache cleared!`
            });

            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || "Failed to save stub" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setContent(originalContent);
        setMessage(null);
    };

    const hasChanges = content !== originalContent;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-serif text-white flex items-center gap-2">
                        <FileCode className="text-rose-400" size={24} />
                        Stub Editor
                    </h1>
                    <p className="text-sm font-mono text-offgray-500 mt-1">
                        Modify <code className="text-rose-400 bg-rose-500/10 px-1 rounded">stub.lua</code> files directly.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <button
                            onClick={handleDiscard}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <RefreshCcw size={16} />
                            Discard
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges || isLoading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isSaving || !hasChanges || isLoading
                            ? 'bg-rose-500/50 text-white/50 cursor-not-allowed'
                            : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                            }`}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/[0.08] mt-2">
                <button
                    onClick={() => {
                        if (hasChanges) {
                            if (!window.confirm("You have unsaved changes. Are you sure you want to switch tabs?")) return;
                        }
                        setActiveTab('obfuscated');
                    }}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'obfuscated'
                        ? 'border-rose-400 text-rose-300 bg-rose-500/5'
                        : 'border-transparent text-offgray-500 hover:text-white hover:bg-white/[0.02]'
                        }`}
                >
                    Protected Stub
                    <span className="ml-2 text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-offgray-400">stub-obfuscated.lua</span>
                </button>
                <button
                    onClick={() => {
                        if (hasChanges) {
                            if (!window.confirm("You have unsaved changes. Are you sure you want to switch tabs?")) return;
                        }
                        setActiveTab('raw');
                    }}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'raw'
                        ? 'border-rose-400 text-rose-300 bg-rose-500/5'
                        : 'border-transparent text-offgray-500 hover:text-white hover:bg-white/[0.02]'
                        }`}
                >
                    Original Stub
                    <span className="ml-2 text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-offgray-400">stub.lua</span>
                </button>
            </div>

            {/* Notification */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm shrink-0 border ${message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            {/* Editor Container */}
            <div className="w-full min-h-[600px] h-[calc(100vh-320px)] relative rounded-xl border border-white/[0.08] bg-[#282c34] overflow-hidden focus-within:border-rose-500/30 transition-colors shadow-2xl">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0c0f]/80 backdrop-blur-sm z-10 text-offgray-400">
                        <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4" />
                        <span className="text-sm font-medium">Loading stub from server...</span>
                    </div>
                ) : null}

                <CodeMirror
                    value={content}
                    height="100%"
                    theme={oneDark}
                    extensions={[StreamLanguage.define(lua)]}
                    onChange={(val) => setContent(val)}
                    placeholder="-- Enter your obfuscated Lua code here..."
                    className="absolute inset-0 w-full h-full text-[13px] sm:text-[14px] font-mono custom-codemirror"
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        dropCursor: true,
                        allowMultipleSelections: true,
                        indentOnInput: true,
                        syntaxHighlighting: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: true,
                        rectangularSelection: true,
                        crosshairCursor: true,
                        highlightActiveLine: true,
                        highlightSelectionMatches: true,
                        closeBracketsKeymap: true,
                        defaultKeymap: true,
                        searchKeymap: true,
                        historyKeymap: true,
                        foldKeymap: true,
                        completionKeymap: true,
                        lintKeymap: true,
                    }}
                />
            </div>

            {/* Custom CodeMirror Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-codemirror .cm-editor {
                    height: 100% !important;
                }
                .custom-codemirror .cm-scroller {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                    overflow: auto;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    border: 2px solid #282c34;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </div>
    );
}
