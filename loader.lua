--// SERVICES
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")

local Player = Players.LocalPlayer
local placeId = game.PlaceId


--// NOTIFICATION FUNCTION
local function Notify(title,text,duration)
    pcall(function()
        StarterGui:SetCore("SendNotification",{
            Title = title,
            Text = text,
            Duration = duration or 5
        })
    end)
end


--// GAME DATABASE
local Scripts = {

    -- Beanstalk a Brainrot
    [71827913900569] = {
        scriptId = "7dd4a185-1d33-4e38-a349-4b2cefdcdf5e",
        url = "https://raw.githubusercontent.com/amabar49-boop/vinzhub/main/beanstalk.lua"
    },

    -- Jump for Lucky Block
    [82031770257269] = {
        scriptId = "2f0dd732-bdd0-4d55-9fb0-76f7221770e2",
        url = "https://raw.githubusercontent.com/amabar49-boop/jumbrenrott/main/lompatbrenrot.lua"
    },

    -- Catch and Tame
    [77073005043385] = {
        scriptId = "bceae5e9-2a7d-4c14-b922-f2dfa9eedfc1",
        url = "https://raw.githubusercontent.com/amabar49-boop/alamak/main/main.lua"
    },

    -- Fish a Brainrot
    [96645548064314] = {
        scriptId = "fd7dfd14-4c63-491c-a751-b380c9098283",
        url = "https://raw.githubusercontent.com/amabar49-boop/vinzhub/main/main.lua"
    },

    -- Escape Tsunami (Testing Expired)
    [16707611096] = {
        scriptId = "38ac1823-a886-4898-9942-a2dc4869ba6e",
        url = "https://raw.githubusercontent.com/amabar49-boop/vinzhub/main/main.lua"
    }

}


--// CHECK GAME
local gameData = Scripts[placeId]

if not gameData then
    Notify("VinzHub", "Game is not supported by this script!", 5)
    warn("[ScriptHub] Game not supported: "..placeId)
    return
end


--// GET KEY
local key = script_key or _G.script_key or _G.ScriptHubKey

if not key or key == "" then
    Notify("VinzHub", "Insert your key in _G.script_key first!", 5)
    warn("[ScriptHub] No key provided")
    return
end


--// GET EXECUTOR
local executor = "Unknown"

pcall(function()
    if identifyexecutor then
        executor = identifyexecutor()
    end
end)


--// HWID
local hwid = "Unknown"

pcall(function()
    if gethwid then
        hwid = gethwid()
    elseif syn and syn.gethwid then
        hwid = syn.gethwid()
    end
end)


--// VERIFY KEY
local function VerifyKey()

    local success,response = pcall(function()

        return request({
            Url = "https://api.scripthub.id/api/v2/keys/validate",
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = HttpService:JSONEncode({
                key = key,
                scriptId = gameData.scriptId,
                hwid = hwid,
                executor = executor,
                robloxUsername = Player.Name,
                robloxUserId = Player.UserId,
                placeId = placeId
            })
        })

    end)

    if not success or not response then
        Notify("VinzHub", "Server validation failed (API Down?)", 5)
        warn("[ScriptHub] API Request Failed")
        return false
    end


    local data

    pcall(function()
        data = HttpService:JSONDecode(response.Body)
    end)

    if not data then
        warn("[ScriptHub] Invalid API Response")
        return false, "Invalid server response!"
    end

    return data.valid == true, data.message or (data.valid and "Key verified!" or "Invalid Key!"), data.data
end


--// VALIDATE KEY
Notify("VinzHub", "Checking environment and security...", 2)
print("[ScriptHub] HWID: "..hwid)
print("[ScriptHub] Executor: "..executor)

Notify("VinzHub", "Verifying key: ".. (key:sub(1,10)) .."...", 3)
local valid, message, apiData = VerifyKey()

if not valid then
    Notify("VinzHub", "Failed: " .. (message or "Unknown Error"), 10)
    warn("[ScriptHub] Validation Failed: " .. tostring(message))
    return
end


--// SUCCESS NOTIFICATION
local scriptName = (apiData and apiData.script_title) or "Script"
local expiryInfo = "Lifetime"

if apiData and apiData.expires_at then
    -- Simple ISO 8601 to readable date (YYYY-MM-DD)
    local year, month, day = apiData.expires_at:match("(%d+)-(%d+)-(%d+)")
    if year and month and day then
        expiryInfo = day.."/"..month.."/"..year
    end
end

Notify("VinzHub", "Welcome! Loaded " .. scriptName .. " (Expires: " .. expiryInfo .. ")", 5)


--// LOAD SCRIPT
local success,err = pcall(function()
    loadstring(game:HttpGet(gameData.url))()
end)

if not success then
    Notify("VinzHub", "Execution Error: " .. scriptName, 5)
    warn("[ScriptHub] Failed to execute script:",err)
end
