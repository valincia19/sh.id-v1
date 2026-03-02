"use client";

import { useState, useEffect, useRef } from "react";
import { keysApi, type KeySettings } from "@/lib/api/keys";
import { plansApi, type PlanWithMaximums } from "@/lib/api/plans";
import { ShieldAlert, Check, RefreshCw } from "lucide-react";

export default function KeySettingsPage() {
    const [settings, setSettings] = useState<KeySettings | null>(null);
    const [planData, setPlanData] = useState<PlanWithMaximums | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [settingsData, plan] = await Promise.all([
                keysApi.getSettings(),
                plansApi.getMyPlan()
            ]);
            setSettings(settingsData);
            setPlanData(plan);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (key: keyof KeySettings, value: boolean | number | string[]) => {
        if (!settings) return;

        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        // Clear any existing timeout to prevent race conditions
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        try {
            setSaveStatus('saving');
            await keysApi.updateSettings({
                // Security settings
                deviceLockEnabled: newSettings.device_lock_enabled,
                maxDevicesPerKey: newSettings.max_devices_per_key,
                rateLimitingEnabled: newSettings.rate_limiting_enabled,
                autoExpireEnabled: newSettings.auto_expire_enabled,
                hwidBlacklistEnabled: newSettings.hwid_blacklist_enabled,
                // GetKey settings
                getkeyEnabled: newSettings.getkey_enabled,
                checkpointCount: newSettings.checkpoint_count,
                adLinks: newSettings.ad_links,
                checkpointTimerSeconds: newSettings.checkpoint_timer_seconds,
                captchaEnabled: newSettings.captcha_enabled,
                keyDurationHours: newSettings.key_duration_hours,
                maxKeysPerIp: 1,
                cooldownHours: newSettings.cooldown_hours,
            });
            setSaveStatus('saved');
            saveTimeoutRef.current = setTimeout(() => {
                setSaveStatus('idle');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save settings");
            setSaveStatus('idle');
            // Revert on error
            setSettings(settings);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="space-y-1.5">
                    <div className="h-8 w-48 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-4 w-64 bg-white/[0.04] rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-white/[0.02] rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-64 bg-white/[0.02] rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                        Key System Settings
                    </h1>
                    <p className="text-sm font-mono text-offgray-500 max-w-lg">
                        Configure global key system behavior and security options.
                    </p>
                </div>
            </section>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[14px] text-red-400 leading-relaxed">{error}</p>
                </div>
            )}

            {/* Quota Info */}
            {planData && (
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#0a0c10] border border-white/[0.04] rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 mb-1">Maximum Keys</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-serif text-white">{planData.maximums.maximum_keys.toLocaleString()}</span>
                            <span className="text-[10px] font-mono text-offgray-600">limit</span>
                        </div>
                    </div>
                    <div className="bg-[#0a0c10] border border-white/[0.04] rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 mb-1">Max Devices/Key</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-serif text-white">{planData.maximums.maximum_devices_per_key}</span>
                            <span className="text-[10px] font-mono text-offgray-600">devices</span>
                        </div>
                    </div>
                    <div className="bg-[#0a0c10] border border-white/[0.04] rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 mb-1">Key System API</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-emerald-400">Active</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                    </div>
                </section>
            )}

            {/* Security Settings */}
            <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />

                <div className="px-4 py-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <h2 className="text-[13px] font-semibold text-offgray-100">Security Options</h2>
                    </div>
                </div>

                <div className="divide-y divide-white/[0.03]">
                    {/* Device Lock */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Device Lock (HWID)</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Bind keys to specific device hardware IDs.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={settings?.device_lock_enabled ?? false}
                                    onChange={(e) => handleUpdateSettings('device_lock_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/30 border border-white/[0.08]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Max Devices */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Max Devices Per Key</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Maximum devices that can be bound to a single key.
                                </p>
                            </div>
                            <span className="text-[13px] font-mono text-offgray-400">1 <span className="text-offgray-600">(fixed)</span></span>
                        </div>
                    </div>

                    {/* Rate Limiting */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Rate Limiting</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Prevent brute-force attacks on key validation.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={settings?.rate_limiting_enabled ?? false}
                                    onChange={(e) => handleUpdateSettings('rate_limiting_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/30 border border-white/[0.08]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Auto Expire */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Auto Expire Unused Keys</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Auto-expire keys after a period of inactivity.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={settings?.auto_expire_enabled ?? false}
                                    onChange={(e) => handleUpdateSettings('auto_expire_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/30 border border-white/[0.08]"></div>
                            </label>
                        </div>
                    </div>

                    {/* HWID Blacklist */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">HWID Blacklist</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Ban devices from using any keys.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={settings?.hwid_blacklist_enabled ?? false}
                                    onChange={(e) => handleUpdateSettings('hwid_blacklist_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/30 border border-white/[0.08]"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            {/* GetKey Settings */}
            <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />

                <div className="px-4 py-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <h2 className="text-[13px] font-semibold text-offgray-100">GetKey System</h2>
                        <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">Monetization</span>
                    </div>
                </div>

                <div className="divide-y divide-white/[0.03]">
                    {/* GetKey Enabled */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Enable GetKey System</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Allow users to get free keys via ads/checkpoints.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={settings?.getkey_enabled ?? false}
                                    onChange={(e) => handleUpdateSettings('getkey_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500/30 border border-white/[0.08]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Ad Links (Checkpoints) */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-0.5">
                                    <p className="text-[13px] font-medium text-offgray-100">Ad Checkpoints</p>
                                    <p className="text-[11px] font-mono text-offgray-500">
                                        Your ad links. Platform ad is always included as the first checkpoint.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const currentLinks = settings?.ad_links ?? [];
                                        if (currentLinks.length >= 5) return;
                                        const newLinks = [...currentLinks, ''];
                                        handleUpdateSettings('ad_links', newLinks);
                                    }}
                                    disabled={(settings?.ad_links ?? []).length >= 5}
                                    className="shrink-0 h-7 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:bg-white/[0.08] transition-colors flex items-center gap-1.5 text-[11px] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Add Link
                                </button>
                            </div>

                            {/* Platform ad (always first, not editable) */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-emerald-500 w-5">#1</span>
                                <div className="flex-1 h-8 px-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-md flex items-center">
                                    <span className="text-[11px] font-mono text-emerald-400/70">Platform Ad (auto-included)</span>
                                </div>
                            </div>

                            {/* Owner's ad links */}
                            <div className="space-y-1.5">
                                {(settings?.ad_links ?? []).map((link: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-offgray-500 w-5">#{i + 2}</span>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/ad"
                                            value={link || ''}
                                            onChange={(e) => {
                                                const currentLinks = settings?.ad_links ?? [];
                                                const newLinks = [...currentLinks];
                                                newLinks[i] = e.target.value;
                                                handleUpdateSettings('ad_links', newLinks);
                                            }}
                                            className="flex-1 h-8 px-2.5 bg-[#12151a] border border-white/[0.06] rounded-md text-[12px] font-mono text-white placeholder:text-offgray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
                                        />
                                        <button
                                            onClick={() => {
                                                const currentLinks = settings?.ad_links ?? [];
                                                const newLinks = currentLinks.filter((_: string, idx: number) => idx !== i);
                                                handleUpdateSettings('ad_links', newLinks);
                                            }}
                                            className="shrink-0 w-7 h-7 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {(settings?.ad_links ?? []).length === 0 && (
                                <p className="text-[10px] font-mono text-offgray-600 text-center py-2">
                                    No custom ad links added. Only the platform ad will be shown.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Checkpoint Timer */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Checkpoint Timer (seconds)</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Wait time on each checkpoint page.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleUpdateSettings('checkpoint_timer_seconds', Math.max(5, (settings?.checkpoint_timer_seconds ?? 10) - 5))}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm"
                                >
                                    −
                                </button>
                                <span className="w-10 text-center text-[13px] font-mono text-white">{settings?.checkpoint_timer_seconds ?? 10}s</span>
                                <button
                                    onClick={() => handleUpdateSettings('checkpoint_timer_seconds', Math.min(60, (settings?.checkpoint_timer_seconds ?? 10) + 5))}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={(settings?.checkpoint_timer_seconds ?? 10) >= 60}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Captcha Enabled */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Captcha Verification</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Require captcha before issuing keys.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={settings?.captcha_enabled ?? true}
                                    onChange={(e) => handleUpdateSettings('captcha_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500/30 border border-white/[0.08]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Key Duration */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Key Duration (hours)</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    How long generated keys remain valid.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleUpdateSettings('key_duration_hours', Math.max(1, (settings?.key_duration_hours ?? 6) - 1))}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm"
                                >
                                    −
                                </button>
                                <span className="w-10 text-center text-[13px] font-mono text-white">{settings?.key_duration_hours ?? 6}h</span>
                                <button
                                    onClick={() => handleUpdateSettings('key_duration_hours', Math.min(6, (settings?.key_duration_hours ?? 6) + 1))}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={(settings?.key_duration_hours ?? 6) >= 6}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Max Keys Per IP */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Max Keys Per IP</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Max keys claimable from a single IP.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-8 text-center text-[13px] font-mono text-white">1</span>
                                <span className="text-[10px] font-mono text-offgray-600">(fixed)</span>
                            </div>
                        </div>
                    </div>

                    {/* Cooldown Hours */}
                    <div className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 max-w-md">
                                <p className="text-[13px] font-medium text-offgray-100">Cooldown (hours)</p>
                                <p className="text-[11px] font-mono text-offgray-500">
                                    Wait time before claiming another key.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleUpdateSettings('cooldown_hours', Math.max(1, (settings?.cooldown_hours ?? 24) - 1))}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm"
                                >
                                    −
                                </button>
                                <span className="w-10 text-center text-[13px] font-mono text-white">{settings?.cooldown_hours ?? 24}h</span>
                                <button
                                    onClick={() => handleUpdateSettings('cooldown_hours', (settings?.cooldown_hours ?? 24) + 1)}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Unified save status indicator */}
            {
                saveStatus !== 'idle' && (
                    <div className="fixed bottom-4 right-4 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-2 animate-in slide-in-from-right duration-200">
                        {saveStatus === 'saving' ? (
                            <>
                                <RefreshCw size={14} className="animate-spin text-emerald-400" />
                                <span className="text-sm text-emerald-400">Saving...</span>
                            </>
                        ) : (
                            <>
                                <Check size={14} className="text-emerald-400" />
                                <span className="text-sm text-emerald-400">Settings saved</span>
                            </>
                        )}
                    </div>
                )
            }
        </div >
    );
}
