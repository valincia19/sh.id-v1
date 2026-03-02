-- ============================================
-- ScriptHub Protected Loader Stub v2
-- ============================================
-- Uses _G globals injected by the server before this code runs.
-- This allows the server to prepend dynamic values without
-- modifying the obfuscated bytecode.
--
-- Server prepends:
--   _G.__SH_API = "https://api.scripthub.id"
--   _G.__SH_KEY = "deploy_key.lua"
--
-- Then this obfuscated code runs and reads those globals.
-- ============================================

local HttpService = game:GetService("HttpService")
local RbxAnalyticsService = game:GetService("RbxAnalyticsService")

-- Read injected globals
local API_BASE = _G.__SH_API
local DEPLOY_KEY = _G.__SH_KEY

-- Clean up globals immediately (don't leak them)
_G.__SH_API = nil
_G.__SH_KEY = nil

if not API_BASE or not DEPLOY_KEY then
    return
end

-- Collect HWID
local hwid = RbxAnalyticsService:GetClientId()

-- Step 1: Request a challenge token from the API
local challengeUrl = API_BASE .. "/v1/challenge?key=" .. DEPLOY_KEY .. "&hwid=" .. hwid
local challengeSuccess, challengeRes = pcall(function()
    return game:HttpGet(challengeUrl)
end)

if not challengeSuccess or not challengeRes then
    return
end

local challengeData = HttpService:JSONDecode(challengeRes)
if not challengeData or not challengeData.token then
    return
end

-- Step 2: Verify with the token to get the signed script URL
local verifyUrl = API_BASE .. "/v1/verify?key=" .. DEPLOY_KEY .. "&hwid=" .. hwid .. "&ts=" .. challengeData.ts .. "&token=" .. challengeData.token
local verifySuccess, verifyRes = pcall(function()
    return game:HttpGet(verifyUrl)
end)

if not verifySuccess or not verifyRes then
    return
end

local verifyData = HttpService:JSONDecode(verifyRes)
if not verifyData or not verifyData.url then
    return
end

-- Step 3: Fetch and execute the real script from the signed CDN URL
local scriptSuccess, scriptContent = pcall(function()
    return game:HttpGet(verifyData.url)
end)

if scriptSuccess and scriptContent then
    local fn, err = loadstring(scriptContent)
    if fn then
        fn()
    end
end
