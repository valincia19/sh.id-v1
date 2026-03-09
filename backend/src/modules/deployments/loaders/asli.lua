-- ============================================
-- ScriptHub Loader v2 — RC4 Decryption Engine
-- ============================================
-- Universal executor compatibility.
-- This file is designed to be obfuscated with Luraph
-- to create a polymorphic pool of loaders.
--
-- Server prepends before this code runs:
--   _G.__SH_DKEY   = "deploy_key.lua"       (RC4 decryption key)
--   _G.__SH_SCRIPT = "https://cdn/script/..."  (encrypted script URL)
--
-- Then this obfuscated code runs, fetches the encrypted script,
-- decrypts it with RC4, and executes it.
-- ============================================

-- ========== Universal HTTP Request ==========
local function http_get(url)
    local ok, res = pcall(function()
        return game:HttpGet(url)
    end)
    if ok and res then return res end

    if syn and syn.request then
        local s, r = pcall(function()
            return syn.request({ Url = url, Method = "GET" }).Body
        end)
        if s and r then return r end
    end

    if http_request then
        local s, r = pcall(function()
            return http_request({ Url = url, Method = "GET" }).Body
        end)
        if s and r then return r end
    end

    if request then
        local s, r = pcall(function()
            return request({ Url = url, Method = "GET" }).Body
        end)
        if s and r then return r end
    end

    return nil
end

-- ========== Universal loadstring ==========
local _loadstring = loadstring or (syn and syn.loadstring) or (getgenv and getgenv().loadstring)

-- ========== Pure Lua bxor fallback ==========
local function bxor_fallback(a, b)
    local r = 0
    for i = 0, 7 do
        local x, y = a % 2, b % 2
        if x ~= y then r = r + 2^i end
        a = math.floor(a / 2)
        b = math.floor(b / 2)
    end
    return r
end

local bxor = (bit32 and bit32.bxor) or (bit and bit.bxor) or bxor_fallback

-- ========== Read injected globals ==========
local DKEY = _G.__SH_DKEY
local SCRIPT_URL = _G.__SH_SCRIPT

-- Clean up globals immediately
_G.__SH_DKEY = nil
_G.__SH_SCRIPT = nil

if not DKEY or not SCRIPT_URL then
    return
end

-- ========== RC4 Decryption Engine ==========
local function rc4(key, hex_data)
    -- Decode Hex → binary
    local data = hex_data:gsub('..', function(cc)
        return string.char(tonumber(cc, 16))
    end)

    -- KSA (Key-Scheduling Algorithm)
    local s = {}
    for i = 0, 255 do s[i] = i end
    local j = 0
    for i = 0, 255 do
        j = (j + s[i] + key:sub((i % #key) + 1, (i % #key) + 1):byte()) % 256
        s[i], s[j] = s[j], s[i]
    end

    -- PRGA (Pseudo-Random Generation Algorithm)
    local i = 0
    j = 0
    local out = {}
    for y = 1, #data do
        i = (i + 1) % 256
        j = (j + s[i]) % 256
        s[i], s[j] = s[j], s[i]
        out[y] = string.char(bxor(data:sub(y, y):byte(), s[(s[i] + s[j]) % 256]))
    end

    return table.concat(out)
end

-- ========== Fetch, Decrypt, Execute ==========
local encryptedHex = http_get(SCRIPT_URL)

if not encryptedHex then
    return
end

local decryptOk, plainScript = pcall(function()
    return rc4(DKEY, encryptedHex)
end)

if decryptOk and plainScript then
    local fn, err = _loadstring(plainScript)
    if fn then
        fn()
    end
end
