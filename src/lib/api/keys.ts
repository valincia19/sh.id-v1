import apiClient from "./client";

// ============================================
// Types
// ============================================

export interface LicenseKey {
    id: string;
    key_value: string;
    script_id: string;
    owner_id: string;
    type: "lifetime" | "timed" | "device_locked";
    status: "active" | "expired" | "revoked" | "unused";
    max_devices: number;
    expires_at: string | null;
    expires_in_days: number | null;
    note: string | null;
    last_activity_at: string | null;
    created_at: string;
    updated_at: string;
    script_name: string;
    devices_used: number;
    last_executor?: string | null;
    last_roblox_username?: string | null;
}

export interface KeyDevice {
    id: string;
    key_id: string;
    hwid: string;
    ip_address: string;
    first_seen_at: string;
    last_seen_at: string;
    last_executor?: string | null;
    last_roblox_username?: string | null;
}

export interface KeyWithDevices extends LicenseKey {
    devices: KeyDevice[];
}

export interface KeyStats {
    total_active: number;
    total_expired: number;
    total_revoked: number;
    total_unused: number;
    total_devices: number;
}

export interface KeySettings {
    id: string;
    user_id: string;
    // Security settings
    device_lock_enabled: boolean;
    max_devices_per_key: number;
    rate_limiting_enabled: boolean;
    auto_expire_enabled: boolean;
    hwid_blacklist_enabled: boolean;
    // GetKey settings
    getkey_enabled: boolean;
    checkpoint_count: number;
    ad_links: string[];
    checkpoint_timer_seconds: number;
    captcha_enabled: boolean;
    key_duration_hours: number;
    max_keys_per_ip: number;
    cooldown_hours: number;
}

export interface KeysListResponse {
    keys: LicenseKey[];
    total: number;
    page: number;
    totalPages: number;
}

export interface ScriptOption {
    id: string;
    title: string;
}

// ============================================
// API Functions
// ============================================

export const keysApi = {
    /**
     * Get user's keys (paginated)
     */
    getMyKeys: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        scriptId?: string;
        search?: string;
    }): Promise<KeysListResponse> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.status) searchParams.set("status", params.status);
        if (params?.scriptId) searchParams.set("scriptId", params.scriptId);
        if (params?.search) searchParams.set("search", params.search);

        const query = searchParams.toString();
        const res = await apiClient.get(`/keys/me${query ? `?${query}` : ""}`);
        return res.data.data;
    },

    /**
     * Get key analytics
     */
    getStats: async (): Promise<KeyStats> => {
        const res = await apiClient.get("/keys/stats");
        return res.data.data;
    },

    /**
     * Get a single key with devices
     */
    getKeyById: async (id: string): Promise<KeyWithDevices> => {
        const res = await apiClient.get(`/keys/${id}`);
        return res.data.data;
    },

    /**
     * Generate new keys
     */
    generateKeys: async (data: {
        scriptId: string;
        type: string;
        maxDevices: number;
        quantity: number;
        expiresInDays?: number;
        note?: string;
    }): Promise<LicenseKey[]> => {
        const res = await apiClient.post("/keys/generate", data);
        return res.data.data;
    },

    /**
     * Revoke a key
     */
    revokeKey: async (id: string): Promise<LicenseKey> => {
        const res = await apiClient.patch(`/keys/${id}/revoke`);
        return res.data.data;
    },

    /**
     * Bulk revoke keys
     */
    revokeKeys: async (keyIds: string[]): Promise<void> => {
        await apiClient.patch("/keys/bulk-revoke", { keyIds });
    },

    /**
     * Delete a key
     */
    deleteKey: async (id: string): Promise<void> => {
        await apiClient.delete(`/keys/${id}`);
    },

    /**
     * Bulk delete keys
     */
    deleteKeys: async (keyIds: string[]): Promise<void> => {
        await apiClient.delete("/keys/bulk-delete", { data: { keyIds } });
    },

    /**
     * Revoke a device from a key
     */
    revokeDevice: async (keyId: string, deviceId: string): Promise<void> => {
        await apiClient.delete(`/keys/${keyId}/devices/${deviceId}`);
    },

    /**
     * Reset HWID (remove all devices)
     */
    resetHwid: async (keyId: string): Promise<void> => {
        await apiClient.post(`/keys/${keyId}/reset-hwid`);
    },

    /**
     * Get security settings
     */
    getSettings: async (): Promise<KeySettings> => {
        const res = await apiClient.get("/keys/settings");
        return res.data.data;
    },

    /**
     * Update security settings
     */
    updateSettings: async (settings: {
        // Security settings
        deviceLockEnabled?: boolean;
        maxDevicesPerKey?: number;
        rateLimitingEnabled?: boolean;
        autoExpireEnabled?: boolean;
        hwidBlacklistEnabled?: boolean;
        // GetKey settings
        getkeyEnabled?: boolean;
        checkpointCount?: number;
        adLinks?: string[];
        checkpointTimerSeconds?: number;
        captchaEnabled?: boolean;
        keyDurationHours?: number;
        maxKeysPerIp?: number;
        cooldownHours?: number;
    }): Promise<KeySettings> => {
        const res = await apiClient.put("/keys/settings", settings);
        return res.data.data;
    },

    /**
     * Get user's scripts for the generate modal dropdown
     */
    getScripts: async (): Promise<ScriptOption[]> => {
        const res = await apiClient.get("/keys/scripts");
        return res.data.data;
    },

    /**
     * Generate or regenerate API key
     */
    generateApiKey: async (): Promise<KeySettings> => {
        const res = await apiClient.post("/keys/api-key/generate");
        return res.data.data;
    },
};
