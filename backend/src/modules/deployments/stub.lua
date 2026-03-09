-- ============================================
-- ScriptHub Protected Loader Stub v4
-- ============================================
-- 3-Layer Architecture:
--   Layer 1 (this file): Auth + fetch loader
--   Layer 2 (loader.lua): RC4 decrypt engine
--   Layer 3: Encrypted raw script on CDN
--
-- Server prepends:
--   _G.__SH_API = "https://api.scripthub.id"
--   _G.__SH_KEY = "deploy_key.lua"
-- ============================================

-- ========== Universal HTTP Request ==========
local function http_get(url)
    -- Try game:HttpGet first (most common)
    local ok, res = pcall(function()
        return game:HttpGet(url)
    end)
    if ok and res then return res end

    -- Try syn.request (Synapse X)
    if syn and syn.request then
        local s, r = pcall(function()
            return syn.request({ Url = url, Method = "GET" }).Body
        end)
        if s and r then return r end
    end

    -- Try http_request (Fluxus, etc.)
    if http_request then
        local s, r = pcall(function()
            return http_request({ Url = url, Method = "GET" }).Body
        end)
        if s and r then return r end
    end

    -- Try request (Script-Ware, etc.)
    if request then
        local s, r = pcall(function()
            return request({ Url = url, Method = "GET" }).Body
        end)
        if s and r then return r end
    end

    return nil
end

-- ========== Universal HWID ==========
local function get_hwid()
    -- Try RbxAnalyticsService (standard Roblox)
    local ok, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    if ok and hwid and hwid ~= "" then return hwid end

    -- Try gethwid (many executors)
    if gethwid then
        local s, r = pcall(gethwid)
        if s and r then return r end
    end

    -- Try getgenv().gethwid
    if getgenv and getgenv().gethwid then
        local s, r = pcall(getgenv().gethwid)
        if s and r then return r end
    end

    -- Last resort: use a hash of identifyexecutor or a constant
    if identifyexecutor then
        local s, name = pcall(identifyexecutor)
        if s and name then return name .. "_fallback" end
    end

    return "sh_universal"
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
local API_BASE = _G.__SH_API
local DEPLOY_KEY = _G.__SH_KEY

-- Clean up globals immediately
_G.__SH_API = nil
_G.__SH_KEY = nil

if not API_BASE or not DEPLOY_KEY then
    return
end

-- Collect HWID
local hwid = get_hwid()

-- Step 1: Request a challenge token from the API
local challengeUrl = API_BASE .. "/v1/challenge?key=" .. DEPLOY_KEY .. "&hwid=" .. hwid
local challengeRes = http_get(challengeUrl)

if not challengeRes then
    return
end

local HttpService = game:GetService("HttpService")

local ok, challengeData = pcall(function()
    return HttpService:JSONDecode(challengeRes)
end)

if not ok or not challengeData or not challengeData.token then
    return
end

-- Step 2: Verify with the token to get the loader URL
local verifyUrl = API_BASE .. "/v1/verify?key=" .. DEPLOY_KEY .. "&hwid=" .. hwid .. "&ts=" .. challengeData.ts .. "&token=" .. challengeData.token
local verifyRes = http_get(verifyUrl)

if not verifyRes then
    return
end

local vok, verifyData = pcall(function()
    return HttpService:JSONDecode(verifyRes)
end)

if not vok or not verifyData then
    return
end

-- Step 3: Handle both 3-layer (obfuscated) and regular deployments
if verifyData.loaderUrl then
    -- 3-Layer: Fetch and execute the loader (which will decrypt the real script)
    local loaderContent = http_get(verifyData.loaderUrl)

    if loaderContent then
        local fn, err = _loadstring(loaderContent)
        if fn then
            fn()
        end
    end
elseif verifyData.payload then
    -- Regular deployment: Decrypt RC4 payload directly
    local function rc4_decrypt(key, hex_data)
        local data = hex_data:gsub('..', function(cc)
            return string.char(tonumber(cc, 16))
        end)

        local s = {}
        for i = 0, 255 do s[i] = i end
        local j = 0
        for i = 0, 255 do
            local key_char = key:sub((i % #key) + 1, (i % #key) + 1):byte()
            j = (j + s[i] + key_char) % 256
            s[i], s[j] = s[j], s[i]
        end

        local i = 0
        j = 0
        local out = {}
        for y = 1, #data do
            i = (i + 1) % 256
            j = (j + s[i]) % 256
            s[i], s[j] = s[j], s[i]
            local K = s[(s[i] + s[j]) % 256]
            out[y] = string.char(bxor(data:sub(y, y):byte(), K))
        end

        return table.concat(out)
    end

    local success, decrypted = pcall(function()
        return rc4_decrypt(DEPLOY_KEY, verifyData.payload)
    end)

    if success and decrypted then
        local fn, err = _loadstring(decrypted)
        if fn then
            fn()
        end
    end
end
