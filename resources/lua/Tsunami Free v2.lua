-- Loader Token Verification (Runtime Authentication)
if not _G.VinzHub_LoaderToken or type(_G.VinzHub_LoaderToken) ~= "string" or not _G.VinzHub_LoaderToken:match("^VH") then
    game:GetService("StarterGui"):SetCore("SendNotification", {Title = "VinzHub", Text = "Access Denied! Use the official loader.", Duration = 10})
    return
end
_G.VinzHub_LoaderToken = nil

-- HWID Detection & Executor Info
local function GetSystemInfo()
    local hwid = nil
    local executor = nil
    pcall(function()
        if gethwid then hwid = gethwid()
        elseif getexecutorname and game:GetService("RbxAnalyticsService") then hwid = game:GetService("RbxAnalyticsService"):GetClientId() end
    end)
    pcall(function()
        if identify then executor = identify()
        elseif getexecutorname then executor = getexecutorname()
        else executor = "Unknown Executor" end
    end)
    return hwid, executor
end

-- HTTP Request
local function DoRequest(url, method, headers, body)
    if request then return request({ Url = url, Method = method, Headers = headers, Body = body })
    elseif http_request then return http_request({ Url = url, Method = method, Headers = headers, Body = body })
    elseif syn and syn.request then return syn.request({ Url = url, Method = method, Headers = headers, Body = body })
    elseif fluxus and fluxus.request then return fluxus.request({ Url = url, Method = method, Headers = headers, Body = body })
    end
    return nil
end

-- Key Validation
local function VerifyKey()
    local key = script_key or _G.script_key or _G.ScriptHubKey
    if not key or typeof(key) ~= "string" or key == "" then return false end

    local hwid, executor = GetSystemInfo()
    local Player = game:GetService("Players").LocalPlayer

    local payload = {
        key            = key,
        scriptId       = "7057201d-b062-421e-9a52-30af4c39e825",
        hwid           = hwid or "Unknown",
        executor       = executor or "Unknown",
        robloxUsername = Player.Name,
        robloxUserId   = Player.UserId
    }

    local ok, response = pcall(function()
        return DoRequest(
            "https://api.scripthub.id/api/v2/keys/validate",
            "POST",
            { ["Content-Type"] = "application/json" },
            game:GetService("HttpService"):JSONEncode(payload)
        )
    end)

    if not ok or not response then return false end
    local parseOk, data = pcall(function() return game:GetService("HttpService"):JSONDecode(response.Body) end)
    if not parseOk or not data then return false end
    return data.valid == true
end

if not VerifyKey() then
    game:GetService("StarterGui"):SetCore("SendNotification", {Title = "VinzHub", Text = "Invalid or Missing Key!", Duration = 10})
    return
end

-- Background Cleanup
pcall(function()
    if workspace:FindFirstChild("___") then
        workspace.___:Destroy()
    end
end)

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local LocalPlayer = Players.LocalPlayer
local VirtualInputManager = game:GetService("VirtualInputManager")
local TeleportService = game:GetService("TeleportService")
local VirtualUser = game:GetService("VirtualUser")
local ProximityPromptService = game:GetService("ProximityPromptService")

task.spawn(function()
    local clickInterval = 300
    while task.wait(clickInterval) do
        local Camera = workspace.CurrentCamera
        if Camera then
            VirtualUser:Button2Down(Vector2.new(0, 0), Camera.CFrame)
            task.wait(0.1)
            VirtualUser:Button2Up(Vector2.new(0, 0), Camera.CFrame)
        end
    end
end)

local UI = loadstring(game:HttpGet("https://script.vinzhub.com/newlib"))()
local Window = UI:New({
    Title = "VinzHub | FREE VERSION",
    Footer = "Escape Tsunami For Brainrot",
    Logo = "rbxassetid://93128969335561"
})

local InfoTab = Window:NewTab("Info")
local LocalPlayerTab = Window:NewTab("Local Player")
local MainTab = Window:NewTab("Main")
local AutomaticTab = Window:NewTab("Automatic")
local TeleportTab = Window:NewTab("Teleport")
local EventTab = Window:NewTab("Event")
local MiscTab = Window:NewTab("Misc")
local SettingsTab = Window:NewTab("Settings")

local Flags = {
    AutoFarmEnabled = false,
    AutoSpeed = false,
    AutoCarry = false,
    AutoRebirth = false,
    AutoSell = false,
    AutoUpgradeBase = false,
    AutoLockInventory = false,
    AutoValentine = false,
    AutoCandy = false,
    AutoUFOCoins = false,
    AutoDoomCoins = false,
    AutoDoomButtons = false,
    AutoRadioactiveCoins = false,
    AutoArcade = false,
    AutoPhantomOrb = false,
    AutoPhantomShard = false,
    AutoPhantomCoin = false,
    AutoFireIce = false,
    FireIceThread = nil,
    FireIceTeam = nil,
    FireIceTeamMode = "Auto",
    AutoTowerEnabled = false,
    AutoUnequip = false,
    Moving = false,
    TowerBusy = false,
    HeightLockActive = false,
    UnlimitedJumpEnabled = false,
    AutoAdjustTweenSpeed = true,
    FPSBoost = false,
    RemoveMapsEnabled = false,
    RemoveMapsThread = nil,
    CurrentIndex = 1,
    FarmMode = "Both",
    FarmThread = nil,
    SpeedAmount = 10,
    SellDelay = 1.2,
    LockType = "Both",
    SelectedLockBrainrots = {},
    SelectedLockMutations = {},
    SelectedLockBrainrotRarities = {},
    SelectedLockLuckyBlockRarities = {},
    BrainrotRarityMap = {},
    FixedY = -3,
    WaveDetectRadius = 100,
    TweenSpeed = 100,
    HeightBodyVelocity = nil,
    RunServiceConnection = nil,
    ActiveTween = nil,
    ActiveAntiPhysicsConnection = nil,
    SavedWalkSpeed = 16,
    SavedJumpPower = 50,
    HeightLockValue = -3,
    NoclipConnection = nil,
    NoclipConnection2 = nil,
    ProgressThreshold = 6,
    LastCompletionState = { rarity = nil, count = 0 },
    AutoUnequipThread = nil,
    ManualCarryCapacity = 6,
    UseManualCarry = true,
    BrainrotsCollected = 0,
    SelectedBrainrotRarities = {},
    SelectedLuckyBlockRarities = {},
    SelectedLuckyBlockMutations = {},
    SelectedBrainrotNames = {},
    RarityPriority = {
        "Infinity",
        "Divine",
        "Celestial",
        "Secret",
        "Cosmic",
        "Mythical",
        "Legendary",
        "Epic",
        "Rare",
        "Uncommon",
        "Common",
    },
}

local Positions = {
    Vector3.new(433.3, -9.7, -336.5),
    Vector3.new(1132.5, 2.2, 521.9),
    Vector3.new(2566.7, -5.5, -337.9),
}

local Zones = {
    ["Base"]    = Vector3.new(137.6, 3.2, 24.1),
    ["Zone 1"]  = Vector3.new(200.0, -2.8, 0.0),
    ["Zone 2"]  = Vector3.new(284.9, -2.8, 0.0),
    ["Zone 3"]  = Vector3.new(398.9, -2.8, 0.0),
    ["Zone 4"]  = Vector3.new(541.5, -2.8, 0.0),
    ["Zone 5"]  = Vector3.new(757.9, -2.8, 0.0),
    ["Zone 6"]  = Vector3.new(1073.7, -2.8, 0.0),
    ["Zone 7"]  = Vector3.new(1553.7, -2.8, 0.0),
    ["Zone 8"]  = Vector3.new(2253.7, -2.8, 0.0),
    ["Zone 9"]  = Vector3.new(2955.6, -2.8, -25.4),
    ["Zone 10"] = Vector3.new(3306.5, -2.8, -12.7),
    ["Zone 11"] = Vector3.new(3666.7, -2.8, -7.4),
    ["Zone 12"] = Vector3.new(4021.7, -2.8, 4.5),
}

local ZoneOrder = { "Base","Zone 1","Zone 2","Zone 3","Zone 4","Zone 5","Zone 6","Zone 7","Zone 8","Zone 9","Zone 10","Zone 11","Zone 12" }

local BrainrotRoot = nil
local LuckyBlocksRoot = nil

local function getBrainrotRarity(variant)
    return Flags.BrainrotRarityMap[variant.Name] or "Common"
end

local function getBrainrotRoot()
    if not BrainrotRoot or not BrainrotRoot.Parent then
        BrainrotRoot = workspace:FindFirstChild("ActiveBrainrots")
    end
    return BrainrotRoot
end

local function getLuckyBlocksRoot()
    if not LuckyBlocksRoot or not LuckyBlocksRoot.Parent then
        LuckyBlocksRoot = workspace:FindFirstChild("ActiveLuckyBlocks")
    end
    return LuckyBlocksRoot
end

local UpgradeSpeed = ReplicatedStorage.RemoteFunctions:WaitForChild("UpgradeSpeed")
local UpgradeCarry = ReplicatedStorage.RemoteFunctions:WaitForChild("UpgradeCarry")
local RebirthRemote = ReplicatedStorage.RemoteFunctions:WaitForChild("Rebirth")
local SellRemote = ReplicatedStorage:WaitForChild("RemoteFunctions"):WaitForChild("SellAll")
local NetworkingRemotes = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Remotes"):WaitForChild("Networking")
local UpgradeBaseRemote = NetworkingRemotes:WaitForChild("RE/Plots/PlotUpgradeBase")
local LockItemRemote = NetworkingRemotes:WaitForChild("RE/Inventory/LockItem")
local TowerClaimRemote = NetworkingRemotes:WaitForChild("RE/Tower/TowerClaimConfirmed")
local DropBrainrotRemote = ReplicatedStorage:WaitForChild("RemoteEvents"):WaitForChild("DropBrainrot")

local function checkAndDropBrainrot()
    local char = LocalPlayer.Character
    if char and char:FindFirstChild("RenderedBrainrot") then
        DropBrainrotRemote:FireServer()
        task.wait(0.5)
    end
end

local function getChar()
    return LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
end

local function getHRP()
    return getChar():WaitForChild("HumanoidRootPart")
end

local function getHumanoid()
    return getChar():FindFirstChildOfClass("Humanoid")
end

local function getRarityPriority(rarityName)
    for priority, rarity in ipairs(Flags.RarityPriority) do
        if rarity == rarityName then
            return priority
        end
    end
    return 999
end

local function getCarryCapacity()
    if Flags.UseManualCarry then
        return Flags.ManualCarryCapacity
    end
    local leaderstats = LocalPlayer:FindFirstChild("leaderstats")
    if leaderstats then
        local statNames = {"Carry", "Capacity", "MaxCarry", "MaxCapacity", "CarryCapacity", "Slots", "MaxSlots", "Backpack"}
        for _, statName in ipairs(statNames) do
            local stat = leaderstats:FindFirstChild(statName)
            if stat then
                local val = tonumber(stat.Value)
                if val and val > 0 then
                    return val
                end
            end
        end
    end
    return Flags.ManualCarryCapacity
end

local function getCurrentCarry()
    return Flags.BrainrotsCollected
end

local function resetCarryCount()
    Flags.BrainrotsCollected = 0
end

local function addCarryCount()
    Flags.BrainrotsCollected = Flags.BrainrotsCollected + 1
end

local function resetPhysics(hrp)
    if not hrp then return end
    hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
    hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
end

local function toggleNoclip(state)
    if Flags.NoclipConnection then Flags.NoclipConnection:Disconnect() end
    if Flags.NoclipConnection2 then Flags.NoclipConnection2:Disconnect() end
    Flags.NoclipConnection = nil
    Flags.NoclipConnection2 = nil
    if state then
        local function applyNoclip()
            local char = LocalPlayer.Character
            if char then
                for _, part in pairs(char:GetDescendants()) do
                    if part:IsA("BasePart") then
                        part.CanCollide = false
                    end
                end
            end
        end
        Flags.NoclipConnection = RunService.Stepped:Connect(applyNoclip)
        Flags.NoclipConnection2 = RunService.Heartbeat:Connect(applyNoclip)
    end
end

function enableHeightLock(height)
    local hrp = getHRP()
    if not hrp then return end
    Flags.HeightLockValue = height or Flags.FixedY
    Flags.HeightLockActive = true
    if Flags.HeightBodyVelocity then Flags.HeightBodyVelocity:Destroy() end
    Flags.HeightBodyVelocity = Instance.new("BodyVelocity")
    Flags.HeightBodyVelocity.Name = "FarmHeightLock"
    Flags.HeightBodyVelocity.Velocity = Vector3.new(0, 0, 0)
    Flags.HeightBodyVelocity.MaxForce = Vector3.new(0, math.huge, 0)
    Flags.HeightBodyVelocity.Parent = hrp
    if Flags.RunServiceConnection then Flags.RunServiceConnection:Disconnect() end
    Flags.RunServiceConnection = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent and Flags.HeightLockActive then
            local currentPos = hrp.Position
            if math.abs(currentPos.Y - Flags.HeightLockValue) > 0.1 then
                hrp.CFrame = CFrame.new(currentPos.X, Flags.HeightLockValue, currentPos.Z)
            end
            hrp.AssemblyLinearVelocity = Vector3.new(hrp.AssemblyLinearVelocity.X, 0, hrp.AssemblyLinearVelocity.Z)
        end
    end)
end

function disableHeightLock(forceSurface)
    Flags.HeightLockActive = false
    if Flags.HeightBodyVelocity then
        Flags.HeightBodyVelocity:Destroy()
        Flags.HeightBodyVelocity = nil
    end
    if Flags.RunServiceConnection then
        Flags.RunServiceConnection:Disconnect()
        Flags.RunServiceConnection = nil
    end
    if forceSurface then
        local hrp = getHRP()
        if hrp then
            resetPhysics(hrp)
            hrp.CFrame = CFrame.new(hrp.Position.X, 5, hrp.Position.Z)
            task.wait(0.1)
            resetPhysics(hrp)
        end
    end
end

local function updateEventFarmState()
    local anyActive = Flags.AutoValentine or Flags.AutoCandy or Flags.AutoArcade or Flags.AutoUFOCoins or Flags.AutoDoomCoins or Flags.AutoDoomButtons or Flags.AutoRadioactiveCoins or Flags.AutoPhantomOrb or Flags.AutoPhantomShard or Flags.AutoPhantomCoin
    toggleNoclip(anyActive)
    if anyActive then
        enableHeightLock(-1)
    else
        disableHeightLock(true)
    end
end

local function isEventPriorityActive()
    if Flags.AutoValentine then
        local f = workspace:FindFirstChild("ValentinesCoinParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if Flags.AutoCandy then
        local f = workspace:FindFirstChild("CandyLandCoinParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if Flags.AutoArcade then
        local f = workspace:FindFirstChild("ArcadeParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if Flags.AutoUFOCoins then
        local f = workspace:FindFirstChild("UFOParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if Flags.AutoDoomCoins or Flags.AutoDoomButtons then
        local f = workspace:FindFirstChild("DoomEventParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if Flags.AutoRadioactiveCoins then
        local f = workspace:FindFirstChild("EventParts")
        if f then
            local radioactive = f:FindFirstChild("RadioactiveCoinsFolder")
            if radioactive and #radioactive:GetChildren() > 0 then return true end
        end
    end
    if Flags.AutoPhantomOrb then
        local f = workspace:FindFirstChild("PhantomOrbParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if Flags.AutoPhantomShard then
        local f = workspace:FindFirstChild("PhantomShardParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if Flags.AutoPhantomCoin then
        local f = workspace:FindFirstChild("PhantomCoinParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    return false
end

local function getTowerMainPart()
    local s, result = pcall(function()
        return workspace.GameObjects.PlaceSpecific.root.Tower.Main
    end)
    if s and result and result:IsA("BasePart") then return result end
    return nil
end

local function getTowerPrompt()
    local main = getTowerMainPart()
    if not main then return nil end
    local s, result = pcall(function()
        return main.Prompt.ProximityPrompt
    end)
    if s and result then return result end
    for _, v in pairs(main:GetDescendants()) do
        if v:IsA("ProximityPrompt") then
            return v
        end
    end
    return nil
end

local function getTowerPromptPosition()
    local main = getTowerMainPart()
    if main then return main.Position end
    return nil
end

local function getTowerBillboardText()
    local s, result = pcall(function()
        return workspace.GameObjects.PlaceSpecific.root.Tower.Main.Billboard.BillboardGui.Frame.Info.InfoText.Text
    end)
    if s and result then return result end
    return nil
end

local function isTowerWorthy()
    local billText = getTowerBillboardText()
    if not billText then return true end
    if billText:lower():find("not yet worthy") then return false end
    return true
end

local function getTowerTrialInfo()
    local s, result = pcall(function()
        local hud = LocalPlayer.PlayerGui:FindFirstChild("TowerTrialHUD")
        if not hud then return nil end
        local trialBar = hud:FindFirstChild("TrialBar")
        if not trialBar then return nil end
        local requirementLabel = trialBar:FindFirstChild("Requirement")
        local rarity = nil
        if requirementLabel then
            rarity = requirementLabel.Text:match(">(%a+)<")
                  or requirementLabel.Text:match("Tower Trial:%s*(%a+)")
        end
        local depositsLabel = trialBar:FindFirstChild("Deposits")
        local current, max = nil, nil
        if depositsLabel then
            current, max = depositsLabel.Text:match("(%d+)/(%d+)")
            current = tonumber(current)
            max = tonumber(max)
        end
        return {
            rarity = rarity,
            current = current,
            max = max,
            isFull = current and max and current >= Flags.ProgressThreshold,
            isReady = (rarity == "Ready")
        }
    end)
    if s and result then return result end
    return nil
end

local function isBrainrotRarityAllowed(rarity)
    return Flags.SelectedBrainrotRarities[rarity] == true
end

local function isLuckyBlockRarityAllowed(rarity)
    return Flags.SelectedLuckyBlockRarities[rarity] == true
end

local function isLuckyBlockMutationAllowed(box)
    local hasMutationFilter = false
    for _, enabled in pairs(Flags.SelectedLuckyBlockMutations) do
        if enabled then hasMutationFilter = true break end
    end
    if not hasMutationFilter then return false end
    local mutAttr = box:GetAttribute("Mutation")
    if mutAttr and Flags.SelectedLuckyBlockMutations[mutAttr] then return true end
    for mutName, enabled in pairs(Flags.SelectedLuckyBlockMutations) do
        if enabled then
            local lowerName = box.Name:lower()
            local lowerMut = mutName:lower()
            if lowerMut == "lucky" then
                local cleanName = lowerName:gsub("luckyblock", "")
                if cleanName:find("lucky") then return true end
            elseif lowerName:find(lowerMut) then
                return true
            end
        end
    end
    for mutName, enabled in pairs(Flags.SelectedLuckyBlockMutations) do
        if enabled then
            if box:FindFirstChild(mutName, true) then return true end
        end
    end
    return false
end

local function parseLuckyBoxRarity(boxName)
    local rarity = boxName:match("LuckyBlock[_%s]([%w]+)")
    if rarity then return rarity end
    rarity = boxName:match("^([%w]+)LuckyBlock")
    if rarity then return rarity end
    rarity = boxName:match("LuckyBlock[_%s]([%w]+)$")
    if rarity then return rarity end
    for _, r in ipairs(Flags.RarityPriority) do
        if boxName:find(r) then return r end
    end
    local lastPart = boxName:match("_([%w]+)$")
    if lastPart then return lastPart end
    return "Unknown"
end

local function getBrainrotName(obj)
    for _, value in pairs(obj:GetAttributes()) do
        if typeof(value) == "string" and #value > 2 then
            return value
        end
    end
    for _, v in pairs(obj:GetDescendants()) do
        if v:IsA("StringValue") and #v.Value > 2 and v.Name ~= "Rarity" then
            return v.Value
        end
    end
    return obj.Name
end

local FIREICE_RARITIES = {
    Secret = true, Cosmic = true, Mythical = true
}

local function isBrainrotAllowed(variant, rarityName, isEvent)
    local hasRarityFilter = false
    for _, v in pairs(Flags.SelectedBrainrotRarities) do if v then hasRarityFilter = true break end end
    local hasNameFilter = false
    for _, v in pairs(Flags.SelectedBrainrotNames) do if v then hasNameFilter = true break end end

    local bName = getBrainrotName(variant)
    
    -- Event Logic: If this is an event item, always allow it (filtering is handled by FIREICE_RARITIES in the loop)
    if isEvent then
        return true
    end

    -- Strict Filtering for Main Farm: If no filters are selected, ALLOW NOTHING
    if not hasRarityFilter and not hasNameFilter then 
        return false 
    end
    
    local rarityMatch = Flags.SelectedBrainrotRarities[rarityName] == true
    local nameMatch = bName and Flags.SelectedBrainrotNames[bName] == true
    
    local allowed = false
    if hasRarityFilter and hasNameFilter then
        allowed = rarityMatch or nameMatch
    elseif hasRarityFilter then
        allowed = rarityMatch
    elseif hasNameFilter then
        allowed = nameMatch
    end

    if Flags.AutoFarmEnabled and (rarityName == "Cosmic" or rarityName == "Secret" or rarityName == "Common") then
        print(("[AUTOFARM DEBUG] Item: %s | Rarity: %s | Allowed: %s | Event: %s"):format(tostring(bName), tostring(rarityName), tostring(allowed), tostring(isEvent)))
        print(("[AUTOFARM DEBUG] Filters - RarityMatch: %s | NameMatch: %s"):format(tostring(rarityMatch), tostring(nameMatch)))
    end

    return allowed
end

local function updateBrainrotRarityMap()
    local root = ReplicatedStorage:FindFirstChild("Assets") and ReplicatedStorage.Assets:FindFirstChild("Brainrots")
    if not root then return end
    table.clear(Flags.BrainrotRarityMap)
    for _, rarityFolder in pairs(root:GetChildren()) do
        for _, variant in pairs(rarityFolder:GetChildren()) do
            Flags.BrainrotRarityMap[variant.Name] = rarityFolder.Name
        end
    end
end

local function GetBrainrotNameList()
    local names = {}
    local success, assets = pcall(function() return ReplicatedStorage:WaitForChild("Assets"):WaitForChild("Brainrots") end)
    if success and assets then
        for _, rarityFolder in pairs(assets:GetChildren()) do
            for _, item in pairs(rarityFolder:GetChildren()) do
                if not table.find(names, item.Name) then
                    table.insert(names, item.Name)
                end
            end
        end
    end
    table.sort(names)
    return names
end

local function GetLuckyBlockRarityList()
    local names = {}
    local success, assets = pcall(function() return ReplicatedStorage:WaitForChild("Assets"):WaitForChild("LuckyBlocks") end)
    if success and assets then
        for _, rarityFolder in pairs(assets:GetChildren()) do
            table.insert(names, rarityFolder.Name)
        end
    end
    return names
end

local function GetLuckyBlockMutationList()
    local names = {}
    local success, assets = pcall(function() return ReplicatedStorage:WaitForChild("Assets"):WaitForChild("Mutations") end)
    if success and assets then
        for _, mut in pairs(assets:GetChildren()) do
            table.insert(names, mut.Name)
        end
    end
    return names
end

local function GetMutationList()
    local list = {}
    local root = ReplicatedStorage:FindFirstChild("Shared") and ReplicatedStorage.Shared:FindFirstChild("Mutations")
    if not root then return list end
    for _, item in pairs(root:GetChildren()) do
        table.insert(list, item.Name)
    end
    table.sort(list)
    return list
end

updateBrainrotRarityMap()

local DetectCirclePart = nil
local CircleConnection = nil

local function createInvisibleCircle()
    if DetectCirclePart then
        DetectCirclePart:Destroy()
        DetectCirclePart = nil
    end
    local part = Instance.new("Part")
    part.Name = "VinzHub_WaveCircle"
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Size = Vector3.new(Flags.WaveDetectRadius * 2, Flags.WaveDetectRadius * 2, Flags.WaveDetectRadius * 2)
    part.Shape = Enum.PartType.Ball
    part.Parent = Workspace
    DetectCirclePart = part
    return part
end

local function startCircleTracking()
    if CircleConnection then CircleConnection:Disconnect() end
    CircleConnection = RunService.Heartbeat:Connect(function()
        local char = LocalPlayer.Character
        if not char then return end
        local hrp = char:FindFirstChild("HumanoidRootPart")
        if not hrp then return end
        if DetectCirclePart then
            DetectCirclePart.CFrame = CFrame.new(hrp.Position)
        end
    end)
end

local function initDetectionCircle()
    createInvisibleCircle()
    startCircleTracking()
end

local function getAllBaseParts(obj)
    local t = {}
    for _, c in pairs(obj:GetChildren()) do
        if c:IsA("BasePart") then
            table.insert(t, c)
        else
            for _, p in pairs(getAllBaseParts(c)) do
                table.insert(t, p)
            end
        end
    end
    return t
end

local function getActiveWaves()
    local waves = {}
    local f = Workspace:FindFirstChild("ActiveTsunamis")
    if not f then return waves end
    for _, folder in pairs(f:GetChildren()) do
        for _, p in pairs(getAllBaseParts(folder)) do
            if p.Name:find("TsunamiWave") or p.Name:find("Wave") or p.Name:find("Tsunami") then
                table.insert(waves, p)
            end
        end
    end
    return waves
end

local function isWaveInRadius()
    if not Flags.WaveDetectEnabled then return false, nil end
    local hrp = getHRP()
    local waves = getActiveWaves()
    local nearestWave = nil
    local nearestDist = math.huge
    for _, wave in ipairs(waves) do
        local dist = (hrp.Position - wave.Position).Magnitude
        if dist < nearestDist then
            nearestDist = dist
            nearestWave = { part = wave, position = wave.Position, distance = dist }
        end
    end
    if nearestWave and nearestWave.distance <= Flags.WaveDetectRadius then
        return true, nearestWave
    end
    return false, nil
end

local function waitForWaveToPass()
    local waitCount = 0
    local maxWait = 200
    while waitCount < maxWait do
        local waveInRadius, _ = isWaveInRadius()
        if not waveInRadius then return true end
        task.wait(0.1)
        waitCount = waitCount + 1
    end
    return false
end

local AutoAdjustTweenSpeed = true
local ManualTweenSpeed = 50

local function getActualTweenSpeed()
    if not Flags.AutoAdjustTweenSpeed then
        return ManualTweenSpeed
    end
    local success, result = pcall(function()
        local label = game:GetService("Players").LocalPlayer.PlayerGui.HUD.BottomLeft.PlayerJumpSpeedFrame.PlayerSpeed.Speed
        local val = tonumber(label.Text)
        if val then return val + 62 end
        return nil
    end)
    if success and result then return result end
    local char = game.Players.LocalPlayer.Character
    if char then
        local hum = char:FindFirstChild("Humanoid")
        if hum then
            local walkSpeed = hum.WalkSpeed
            if walkSpeed and walkSpeed > 0 then
                return walkSpeed + 62
            end
        end
    end
    return Flags.TweenSpeed
end

local function tweenToDive(position)
    local hrp = getHRP()
    local char = getChar()
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local originalWalkSpeed = (humanoid and humanoid.WalkSpeed or 16)
    local originalJumpPower = (humanoid and humanoid.JumpPower or 50)
    local tweenSpeed = getActualTweenSpeed()
    local startPos = hrp.Position
    local targetPos = Vector3.new(position.X, Flags.FixedY, position.Z)
    local distance = (Vector3.new(startPos.X, 0, startPos.Z) - Vector3.new(targetPos.X, 0, targetPos.Z)).Magnitude
    local tweenDuration = distance / tweenSpeed
    if tweenDuration < 0.05 then tweenDuration = 0.05 end
    if humanoid then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
        humanoid.AutoRotate = false
    end
    resetPhysics(hrp)
    local moveInfo = TweenInfo.new(tweenDuration, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, 0, false, 0)
    local moveGoal = { CFrame = CFrame.new(targetPos) }
    local moveTween = TweenService:Create(hrp, moveInfo, moveGoal)
    local antiPhysicsConnection = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent then
            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
        end
    end)
    Flags.ActiveAntiPhysicsConnection = antiPhysicsConnection
    Flags.ActiveTween = moveTween
    moveTween:Play()
    moveTween.Completed:Wait()
    Flags.ActiveTween = nil
    antiPhysicsConnection:Disconnect()
    Flags.ActiveAntiPhysicsConnection = nil
    if humanoid then
        humanoid.WalkSpeed = originalWalkSpeed
        humanoid.JumpPower = originalJumpPower
        humanoid.AutoRotate = true
    end
end

local function getNearestTargetHelper(folder)
    if not folder then return nil end
    local hrp = getHRP()
    if not hrp then return nil end
    local bestTarget = nil
    local bestDist = math.huge
    for _, child in pairs(folder:GetChildren()) do
        local targetPart = child
        if child:IsA("Model") then
            targetPart = child.PrimaryPart or child:FindFirstChild("Part") or child:FindFirstChild("Coin") or child:FindFirstChild("Candy") or child:FindFirstChildWhichIsA("BasePart")
        end
        if targetPart and targetPart:IsA("BasePart") then
            local dist = (hrp.Position - targetPart.Position).Magnitude
            if dist < bestDist then
                bestDist = dist
                bestTarget = targetPart
            end
        end
    end
    return bestTarget
end

local function tweenToFixedY(position, fixedY, targetPart)
    local hrp = getHRP()
    local char = getChar()
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local originalWalkSpeed = (humanoid and humanoid.WalkSpeed or 16)
    local originalJumpPower = (humanoid and humanoid.JumpPower or 50)
    local tweenSpeed = getActualTweenSpeed()
    local startPos = hrp.Position
    local finalPos = Vector3.new(position.X, fixedY, position.Z)
    local distance = (startPos - finalPos).Magnitude
    
    local oldHeightLockActive = Flags.HeightLockActive
    Flags.HeightLockActive = false
    
    local tweenDuration = distance / tweenSpeed
    if tweenDuration < 0.05 then tweenDuration = 0.05 end
    if humanoid then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
        humanoid.AutoRotate = false
    end
    resetPhysics(hrp)
    
    local moveInfo = TweenInfo.new(tweenDuration, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, 0, false, 0)
    local moveGoal = { CFrame = CFrame.new(finalPos) }
    local moveTween = TweenService:Create(hrp, moveInfo, moveGoal)
    local antiPhysicsConnection = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent then
            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
        end
        if targetPart and (not targetPart.Parent) then
            if moveTween.PlaybackState == Enum.PlaybackState.Playing then
                moveTween:Cancel()
            end
        end
    end)
    Flags.ActiveAntiPhysicsConnection = antiPhysicsConnection
    Flags.ActiveTween = moveTween
    moveTween:Play()
    moveTween.Completed:Wait()
    Flags.ActiveTween = nil
    antiPhysicsConnection:Disconnect()
    Flags.ActiveAntiPhysicsConnection = nil
    if not (targetPart and not targetPart.Parent) then
        hrp.CFrame = CFrame.new(finalPos)
    end
    
    Flags.HeightLockActive = oldHeightLockActive
    if Flags.HeightLockActive then
        Flags.HeightLockValue = fixedY
    end
    
    if humanoid then
        humanoid.WalkSpeed = originalWalkSpeed
        humanoid.JumpPower = originalJumpPower
        humanoid.AutoRotate = true
    end
end

local function goDownAfterCollect()
    local hrp = getHRP()
    local char = getChar()
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local currentPos = hrp.Position
    local targetPos = Vector3.new(currentPos.X, Flags.FixedY, currentPos.Z)
    local originalWalkSpeed = humanoid and humanoid.WalkSpeed or 16
    local originalJumpPower = humanoid and humanoid.JumpPower or 50
    if humanoid then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
    end
    resetPhysics(hrp)
    hrp.CFrame = CFrame.new(targetPos)
    if humanoid then
        humanoid.WalkSpeed = originalWalkSpeed
        humanoid.JumpPower = originalJumpPower
    end
end

local function diveDown()
    local hrp = getHRP()
    local char = getChar()
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local originalWalkSpeed = humanoid and humanoid.WalkSpeed or 16
    local originalJumpPower = humanoid and humanoid.JumpPower or 50
    local currentPos = hrp.Position
    local targetPos = Vector3.new(currentPos.X, Flags.FixedY, currentPos.Z)
    if humanoid then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
    end
    resetPhysics(hrp)
    hrp.CFrame = CFrame.new(targetPos)
    if humanoid then
        humanoid.WalkSpeed = originalWalkSpeed
        humanoid.JumpPower = originalJumpPower
    end
end

local function tweenTo(targetPosition)
    local hrp = getHRP()
    local char = getChar()
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local startPos = hrp.Position
    local targetPos = Vector3.new(targetPosition.X, targetPosition.Y, targetPosition.Z)
    local distance = (startPos - targetPos).Magnitude
    local tweenSpeed = getActualTweenSpeed()
    local tweenDuration = distance / tweenSpeed
    if tweenDuration < 0.05 then tweenDuration = 0.05 end
    local originalWalkSpeed = humanoid and humanoid.WalkSpeed or 16
    local originalJumpPower = humanoid and humanoid.JumpPower or 50
    if humanoid then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
        humanoid.AutoRotate = false
    end
    resetPhysics(hrp)
    local moveInfo = TweenInfo.new(tweenDuration, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, 0, false, 0)
    local moveGoal = { CFrame = CFrame.new(targetPos) }
    local moveTween = TweenService:Create(hrp, moveInfo, moveGoal)
    local antiPhysicsConnection = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent then
            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
        end
    end)
    moveTween:Play()
    moveTween.Completed:Wait()
    antiPhysicsConnection:Disconnect()
    hrp.CFrame = CFrame.new(targetPos)
    if humanoid then
        humanoid.WalkSpeed = originalWalkSpeed
        humanoid.JumpPower = originalJumpPower
        humanoid.AutoRotate = true
    end
end


local function findBestBrainrotByRarity(targetRarity)
    local hrp = getHRP()
    local bestBrainrot = nil
    local bestDist = math.huge
    local brainrotRoot = getBrainrotRoot()
    if not brainrotRoot then return nil end
    local rarityFolder = brainrotRoot:FindFirstChild(targetRarity)
    if not rarityFolder then return nil end
    for _, container in pairs(rarityFolder:GetChildren()) do
        local rootPart = container:FindFirstChild("Root")
        if rootPart and rootPart:IsA("BasePart") then
            local dist = (hrp.Position - rootPart.Position).Magnitude
            if dist < bestDist then
                bestDist = dist
                bestBrainrot = {
                    position = rootPart.Position,
                    rarity = targetRarity,
                    priority = getRarityPriority(targetRarity),
                    rootPart = rootPart,
                }
            end
        end
    end
    return bestBrainrot
end

local function findBestBrainrot()
    local brainrotRoot = getBrainrotRoot()
    if not brainrotRoot then return nil end
    local hrp = getHRP()
    if not hrp then return nil end

    local best = nil
    local bestPriority = math.huge
    local bestDist = math.huge

    for i, rarityName in ipairs(Flags.RarityPriority) do
        local rarityFolder = brainrotRoot:FindFirstChild(rarityName)
        if rarityFolder then
            for _, container in pairs(rarityFolder:GetChildren()) do
                if isBrainrotAllowed(container, rarityName) then
                    local rootPart = container:FindFirstChild("Root")
                    if rootPart and rootPart:IsA("BasePart") then
                        local priority = i
                        local dist = (hrp.Position - rootPart.Position).Magnitude
                        
                        if priority < bestPriority then
                            bestPriority = priority
                            bestDist = dist
                            best = {
                                position = rootPart.Position,
                                rarity = rarityName,
                                priority = priority,
                                rootPart = rootPart,
                                container = container,
                            }
                        elseif priority == bestPriority and dist < bestDist then
                            bestDist = dist
                            best = {
                                position = rootPart.Position,
                                rarity = rarityName,
                                priority = priority,
                                rootPart = rootPart,
                                container = container,
                            }
                        end
                    end
                end
            end
        end
        if best and bestPriority <= i then break end
    end
    return best
end

local function findBestLuckyBox()
    local hrp = getHRP()
    local luckyBlocksRoot = getLuckyBlocksRoot()
    if not luckyBlocksRoot then return nil end
    local allBoxes = {}
    
    for _, box in pairs(luckyBlocksRoot:GetChildren()) do
        local rarity = parseLuckyBoxRarity(box.Name)
        local priority = getRarityPriority(rarity)
        local rarityMatch = isLuckyBlockRarityAllowed(rarity)
        local mutationMatch = isLuckyBlockMutationAllowed(box)
        
        local hasRarityFilter = false
        for _, v in pairs(Flags.SelectedLuckyBlockRarities) do if v then hasRarityFilter = true break end end
        local hasMutationFilter = false
        for _, v in pairs(Flags.SelectedLuckyBlockMutations) do if v then hasMutationFilter = true break end end
        
        local allowed = false
        if not hasRarityFilter and not hasMutationFilter then
            -- Strict Filtering: If no filters are selected, ALLOW NOTHING
            allowed = false
        elseif hasRarityFilter and hasMutationFilter then
            allowed = rarityMatch or mutationMatch
        elseif hasRarityFilter then
            allowed = rarityMatch
        elseif hasMutationFilter then
            allowed = mutationMatch
        end

        if Flags.AutoFarmEnabled and (rarity == "Cosmic" or rarity == "Secret" or rarity == "Common") then
            print(("[LUCKYBLOCK DEBUG] Box: %s | Rarity: %s | Allowed: %s"):format(box.Name, tostring(rarity), tostring(allowed)))
            print(("[LUCKYBLOCK DEBUG] Filters - RarityMatch: %s | MutationMatch: %s"):format(tostring(rarityMatch), tostring(isLuckyBlockMutationAllowed(box))))
        end

        if allowed then
            local rootPart = box:FindFirstChild("RootPart")
            if rootPart and rootPart:IsA("BasePart") then
                local dist = (hrp.Position - rootPart.Position).Magnitude
                table.insert(allBoxes, {
                    position = rootPart.Position,
                    name = box.Name,
                    rarity = rarity,
                    priority = priority,
                    distance = dist,
                    rootPart = rootPart,
                    box = box,
                    prompt = rootPart:FindFirstChild("ProximityPrompt")
                })
            end
        end
    end
    
    table.sort(allBoxes, function(a, b)
        if a.priority ~= b.priority then return a.priority < b.priority end
        return a.distance < b.distance
    end)
    
    if #allBoxes > 0 then 
        print(("[LUCKYBLOCK DEBUG] Selection made: %s (Priority %d)"):format(allBoxes[1].name, allBoxes[1].priority))
        return allBoxes[1] 
    end
    return nil
end

local function detectCurrentZone()
    local hrp = getHRP()
    local closest, idx = math.huge, 1
    for i, name in ipairs(ZoneOrder) do
        local d = (hrp.Position - Zones[name]).Magnitude
        if d < closest then closest, idx = d, i end
    end
    Flags.CurrentIndex = idx
end

local function stepForward()
    if Flags.Moving then return end
    Flags.Moving = true
    detectCurrentZone()
    if Flags.CurrentIndex < #ZoneOrder then
        Flags.CurrentIndex = Flags.CurrentIndex + 1
        tweenTo(Zones[ZoneOrder[Flags.CurrentIndex]])
    end
    Flags.Moving = false
end

local function stepBackward()
    if Flags.Moving then return end
    Flags.Moving = true
    detectCurrentZone()
    if Flags.CurrentIndex > 1 then
        Flags.CurrentIndex = Flags.CurrentIndex - 1
        tweenTo(Zones[ZoneOrder[Flags.CurrentIndex]])
    end
    Flags.Moving = false
end

local function collectBrainrotItem(brainrot)
    local waveInRadius, _ = isWaveInRadius()
    if waveInRadius then
        waitForWaveToPass()
        task.wait(0.3)
    end
    local prompt = brainrot.rootPart:FindFirstChild("TakePrompt")
    if not prompt then
        for _, child in pairs(brainrot.rootPart:GetDescendants()) do
            if child:IsA("ProximityPrompt") then prompt = child break end
        end
    end
    if prompt then
        fireproximityprompt(prompt)
        local startTime = os.clock()
        local collectedSuccessfully = false
        local brainrotRoot = getBrainrotRoot()
        local char = getChar()
        while os.clock() - startTime < 1.5 do
            if not brainrot.rootPart or not brainrot.rootPart.Parent or
               not brainrot.rootPart:IsDescendantOf(brainrotRoot) or
               brainrot.rootPart:IsDescendantOf(char) then
                collectedSuccessfully = true
                break
            end
            task.wait(0.1)
        end
        if collectedSuccessfully then
            addCarryCount()
            local bName = (brainrot.variant and getBrainrotName(brainrot.variant)) or "Unknown"
            local bRarity = brainrot.rarity or "Common"
            task.wait(0.1)
            return true
        else
            return false
        end
    end
    return false
end

local function collectLuckyBoxItem(luckyBox)
    local waveInRadius, _ = isWaveInRadius()
    if waveInRadius then
        waitForWaveToPass()
        task.wait(0.3)
    end
    local prompt = luckyBox.prompt
    local targetObj = luckyBox.box
    if prompt and prompt:IsA("ProximityPrompt") then
        fireproximityprompt(prompt)
    else
        for _, child in pairs(luckyBox.rootPart:GetDescendants()) do
            if child:IsA("ProximityPrompt") then
                fireproximityprompt(child)
                break
            end
        end
    end
    local startTime = os.clock()
    local collectedSuccessfully = false
    local luckyRoot = getLuckyBlocksRoot()
    local char = getChar()
    while os.clock() - startTime < 1.5 do
        if not targetObj or not targetObj.Parent or
           not targetObj:IsDescendantOf(luckyRoot) or
           targetObj:IsDescendantOf(char) then
            collectedSuccessfully = true
            break
        end
        task.wait(0.1)
    end
    goDownAfterCollect()
    if collectedSuccessfully then
        addCarryCount()
        local lbName = luckyBox.name or "LuckyBlock"
        local lbRarity = luckyBox.rarity or "Unknown"
        task.wait(0.1)
        return true
    else
        return false
    end
end

local function towerTweenTo(targetPosition)
    local hrp = getHRP()
    local char = getChar()
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local startPos = hrp.Position
    local finalPos = Vector3.new(targetPosition.X, Flags.FixedY, targetPosition.Z)
    local dist = (startPos - finalPos).Magnitude
    local speed = getActualTweenSpeed()
    local tweenDuration = dist / speed
    if tweenDuration < 0.05 then tweenDuration = 0.05 end
    local originalWalkSpeed = humanoid and humanoid.WalkSpeed or 16
    local originalJumpPower = humanoid and humanoid.JumpPower or 50
    if humanoid then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
        humanoid.AutoRotate = false
    end
    resetPhysics(hrp)
    hrp.CFrame = CFrame.new(startPos.X, Flags.FixedY, startPos.Z)
    local moveInfo = TweenInfo.new(tweenDuration, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, 0, false, 0)
    local moveTween = TweenService:Create(hrp, moveInfo, { CFrame = CFrame.new(finalPos) })
    local antiConn = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent then
            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
            if math.abs(hrp.Position.Y - Flags.FixedY) > 0.5 then
                hrp.CFrame = CFrame.new(hrp.Position.X, Flags.FixedY, hrp.Position.Z)
            end
        end
    end)
    Flags.ActiveTween = moveTween
    moveTween:Play()
    moveTween.Completed:Wait()
    Flags.ActiveTween = nil
    antiConn:Disconnect()
    resetPhysics(hrp)
    hrp.CFrame = CFrame.new(targetPosition.X, Flags.FixedY, targetPosition.Z)
    task.wait(0.05)
    resetPhysics(hrp)
    if humanoid then
        humanoid.WalkSpeed = originalWalkSpeed
        humanoid.JumpPower = originalJumpPower
        humanoid.AutoRotate = true
    end
end

local function collectOneBrainrotForTower(targetRarity)
    local maxAttempts = 30
    local attempt = 0
    while attempt < maxAttempts and Flags.AutoTowerEnabled do
        attempt = attempt + 1
        local brainrot = findBestBrainrotByRarity(targetRarity)
        if brainrot then
            toggleNoclip(true)
            enableHeightLock()
            diveDown()
            task.wait(0.2)
            tweenToDive(brainrot.position)
            task.wait(1)
            local waveIn = isWaveInRadius()
            if waveIn then
                waitForWaveToPass()
                task.wait(0.3)
            end
            if not brainrot.rootPart or not brainrot.rootPart.Parent then
                task.wait(0.5)
            else
                local hrp = getHRP()
                local bPos = brainrot.rootPart.Position
                local dist = (Vector3.new(hrp.Position.X, 0, hrp.Position.Z) - Vector3.new(bPos.X, 0, bPos.Z)).Magnitude
                if dist > 8 then
                    hrp.CFrame = CFrame.new(bPos.X, Flags.FixedY, bPos.Z)
                    task.wait(0.3)
                end
                if not brainrot.rootPart.Parent then
                    task.wait(0.3)
                else
                    local bPrompt = brainrot.rootPart:FindFirstChild("TakePrompt")
                    if not bPrompt then
                        for _, child in pairs(brainrot.rootPart:GetDescendants()) do
                            if child:IsA("ProximityPrompt") then bPrompt = child break end
                        end
                    end
                    if bPrompt and brainrot.rootPart.Parent then
                        fireproximityprompt(bPrompt)
                        task.wait(0.5)
                        return true
                    end
                end
            end
        else
            task.wait(1)
        end
    end
    return false
end

local function isCharacterAlive()
    local char = LocalPlayer.Character
    if not char then return false end
    local hum = char:FindFirstChildOfClass("Humanoid")
    if not hum then return false end
    return hum.Health > 0
end

local function cleanupTowerState()
    Flags.TowerBusy = false
    if Flags.ActiveTween then
        pcall(function() Flags.ActiveTween:Cancel() end)
        Flags.ActiveTween = nil
    end
    if Flags.ActiveAntiPhysicsConnection then
        Flags.ActiveAntiPhysicsConnection:Disconnect()
        Flags.ActiveAntiPhysicsConnection = nil
    end
    disableHeightLock(true)
    toggleNoclip(false)
    local char = LocalPlayer.Character
    if char then
        local hum = char:FindFirstChildOfClass("Humanoid")
        if hum then
            hum.WalkSpeed = 16
            hum.JumpPower = 50
            hum.AutoRotate = true
        end
    end
end

local function waitForCharacterAlive()
    while true do
        local char = LocalPlayer.Character
        if char then
            local hum = char:FindFirstChildOfClass("Humanoid")
            if hum and hum.Health > 0 then break end
        end
        task.wait(0.5)
    end
    task.wait(2)
end

local function doTowerQuestLoop()
    local questDone = false
    local towerPos = nil
    local nilCounter = 0
    while Flags.AutoTowerEnabled and not questDone do
        if not isCharacterAlive() then
            cleanupTowerState()
            waitForCharacterAlive()
            enableHeightLock()
        end
        local currentPrompt = getTowerPrompt()
        if currentPrompt and (currentPrompt.ActionText or ""):lower():find("start trial") then break end
        local info = getTowerTrialInfo()
        if not info or info.isReady or not info.rarity then
            nilCounter = nilCounter + 1
            if nilCounter >= 5 then break end
            task.wait(1)
            continue
        end
        nilCounter = 0
        if info.isFull then
            if Flags.LastCompletionState.rarity == info.rarity and Flags.LastCompletionState.count >= 1 then
                task.wait(5)
                continue
            end
            if not isTowerWorthy() then
                task.wait(3)
                continue
            end
            towerPos = getTowerPromptPosition()
            if towerPos then
                local hrp = getHRP()
                local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, Flags.FixedY, towerPos.Z)).Magnitude or 999
                if dist > 15 then
                    towerTweenTo(towerPos)
                    task.wait(1)
                end
            end
            local prompt = getTowerPrompt()
            local submitAction = (prompt and prompt.ActionText or ""):lower()
            if prompt and (submitAction:find("complete") or submitAction:find("finish")) then
                if Flags.LastCompletionState.rarity ~= info.rarity then
                    Flags.LastCompletionState.rarity = info.rarity
                    Flags.LastCompletionState.count = 0
                end
                Flags.LastCompletionState.count = Flags.LastCompletionState.count + 1
                fireproximityprompt(prompt)
                task.wait(1.5)
                pcall(function() TowerClaimRemote:FireServer() end)
                task.wait(3)
                questDone = true
            else
                task.wait(2)
            end
        else
            local ok = collectOneBrainrotForTower(info.rarity)
            if ok then
                towerPos = getTowerPromptPosition()
                if towerPos then
                    local hrp = getHRP()
                    local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, Flags.FixedY, towerPos.Z)).Magnitude or 999
                    if dist > 15 then
                        towerTweenTo(towerPos)
                        task.wait(1)
                    end
                end
                local prompt = getTowerPrompt()
                if prompt then
                    local depositStart = os.clock()
                    local depositTimeout = 6
                    while os.clock() - depositStart < depositTimeout do
                        local currentChar = LocalPlayer.Character
                        if not currentChar or not currentChar:FindFirstChild("RenderedBrainrot") then break end
                        fireproximityprompt(prompt)
                        task.wait(0.1)
                    end
                end
                task.wait(3.5)
            else
                task.wait(2)
            end
        end
    end
    return questDone
end

local function towerLoop()
    while Flags.AutoTowerEnabled do
        if not isCharacterAlive() then
            cleanupTowerState()
            waitForCharacterAlive()
        end
        local info = getTowerTrialInfo()
        local prompt = getTowerPrompt()
        local actionText = prompt and prompt.ActionText or ""
        local isStartTrial = actionText:lower():find("start trial") ~= nil
        local trialActive = info ~= nil and info.rarity ~= nil and not info.isReady and not isStartTrial
        if trialActive then
            if not isTowerWorthy() then
                task.wait(3)
            else
                Flags.TowerBusy = true
                toggleNoclip(true)
                enableHeightLock()
                if Flags.ActiveTween then
                    pcall(function() Flags.ActiveTween:Cancel() end)
                    Flags.ActiveTween = nil
                end
                if Flags.ActiveAntiPhysicsConnection then
                    Flags.ActiveAntiPhysicsConnection:Disconnect()
                    Flags.ActiveAntiPhysicsConnection = nil
                end
                doTowerQuestLoop()
                Flags.TowerBusy = false
                if Flags.AutoFarmEnabled then
                    toggleNoclip(true)
                    enableHeightLock()
                    diveDown()
                end
            end
        else
            local prompt = getTowerPrompt()
            if not prompt then
                task.wait(2)
            else
                local actionText = prompt.ActionText or ""
                local lowerAction = actionText:lower()
                local isStartTrial = lowerAction:find("start trial") ~= nil
                local isCompleteTrial = lowerAction:find("complete trial") ~= nil
                local isTrialOngoing = not isStartTrial and not isCompleteTrial and actionText ~= ""
                if isStartTrial then
                    Flags.LastCompletionState.rarity = nil
                    Flags.LastCompletionState.count = 0
                    if not isTowerWorthy() then
                        task.wait(3)
                    else
                        Flags.TowerBusy = true
                        toggleNoclip(true)
                        enableHeightLock()
                        local towerPos = getTowerPromptPosition()
                        if towerPos then
                            local hrp = getHRP()
                            local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, Flags.FixedY, towerPos.Z)).Magnitude or 999
                            if dist > 15 then
                                towerTweenTo(towerPos)
                                task.wait(1)
                            end
                            prompt = getTowerPrompt()
                            if prompt then
                                checkAndDropBrainrot()
                                fireproximityprompt(prompt)
                            end
                            task.wait(1)
                        else
                            Flags.TowerBusy = false
                            task.wait(2)
                        end
                    end
                elseif isTrialOngoing then
                    if not isTowerWorthy() then
                        task.wait(3)
                    else
                        Flags.TowerBusy = true
                        toggleNoclip(true)
                        enableHeightLock()
                        doTowerQuestLoop()
                        Flags.TowerBusy = false
                        if Flags.AutoFarmEnabled then
                            toggleNoclip(true)
                            enableHeightLock()
                            diveDown()
                        end
                    end
                elseif isCompleteTrial then
                    local currentRarity = info and info.rarity or "Unknown"
                    if Flags.LastCompletionState.rarity == currentRarity and Flags.LastCompletionState.count >= 1 then
                        task.wait(5)
                    elseif info and info.isFull then
                        Flags.TowerBusy = true
                        toggleNoclip(true)
                        enableHeightLock()
                        local towerPos = getTowerPromptPosition()
                        if towerPos then
                            local hrp = getHRP()
                            local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, Flags.FixedY, towerPos.Z)).Magnitude or 999
                            if dist > 15 then
                                towerTweenTo(towerPos)
                                task.wait(1)
                            end
                            prompt = getTowerPrompt()
                        end
                        if prompt then
                            if info and info.rarity then
                                if Flags.LastCompletionState.rarity ~= info.rarity then
                                    Flags.LastCompletionState.rarity = info.rarity
                                    Flags.LastCompletionState.count = 0
                                end
                                Flags.LastCompletionState.count = Flags.LastCompletionState.count + 1
                            end
                            fireproximityprompt(prompt)
                            task.wait(1.5)
                            pcall(function() TowerClaimRemote:FireServer() end)
                            task.wait(3)
                        end
                        Flags.TowerBusy = false
                        task.wait(5)
                    else
                        task.wait(2)
                    end
                else
                    task.wait(2)
                end
            end
        end
        task.wait(1)
    end
end

local function farmLoop()
    resetCarryCount()
    toggleNoclip(true)
    enableHeightLock()
    diveDown()
    task.wait(0.3)
    while Flags.AutoFarmEnabled do
        if Flags.TowerBusy then
            task.wait(1)
        else
            if isEventPriorityActive() then
                if Flags.ActiveTween then
                    pcall(function() Flags.ActiveTween:Cancel() end)
                    Flags.ActiveTween = nil
                end
                disableHeightLock()
                while isEventPriorityActive() and Flags.AutoFarmEnabled do
                    task.wait(1)
                end
                if not Flags.AutoFarmEnabled then break end
                enableHeightLock()
                diveDown()
                task.wait(0.3)
            end
            local carryCapacity = getCarryCapacity()
            local collected = false
            if Flags.FarmMode == "Both" then
                local bestBox = findBestLuckyBox()
                if bestBox then
                    tweenToDive(bestBox.position)
                    task.wait(0.1)
                    if collectLuckyBoxItem(bestBox) then collected = true end
                end
                if not collected then
                    local bestBrainrot = findBestBrainrot()
                    if bestBrainrot then
                        tweenToDive(bestBrainrot.position)
                        task.wait(0.1)
                        if collectBrainrotItem(bestBrainrot) then collected = true end
                    end
                end
            elseif Flags.FarmMode == "LuckyBlock" then
                local bestBox = findBestLuckyBox()
                if bestBox then
                    tweenToDive(bestBox.position)
                    task.wait(0.1)
                    if collectLuckyBoxItem(bestBox) then collected = true end
                end
            elseif Flags.FarmMode == "Brainrot" then
                local bestBrainrot = findBestBrainrot()
                if bestBrainrot then
                    tweenToDive(bestBrainrot.position)
                    task.wait(0.1)
                    if collectBrainrotItem(bestBrainrot) then collected = true end
                end
            end
            if getCurrentCarry() >= carryCapacity then
                disableHeightLock()
                local basePos = Zones["Base"]
                tweenToFixedY(basePos, Flags.FixedY, nil)
                task.wait(0.1)
                local hrp = getHRP()
                if hrp then hrp.CFrame = CFrame.new(basePos) end
                task.wait(0.5)
                resetCarryCount()
                if Flags.AutoFarmEnabled then
                    enableHeightLock()
                    diveDown()
                end
            end
            if not collected then
                task.wait(1)
            else
                task.wait(0.3)
            end
        end
        task.wait(0.1)
    end
end


local function getFireIceSacrificeMachinePrompt()
    local s, result = pcall(function()
        return workspace.FireAndIceMap.FireAndIceSacraficeMachine.Primary.Prompt.ProximityPrompt
    end)
    if s and result and result:IsA("ProximityPrompt") then return result end
    return nil
end

local function getFireIceFloors(side)
    local floors = {}
    local folderName = (side == "Fire") and "LeftSide" or "RightSide"
    local s, areaFolder = pcall(function()
        return workspace.FireAndIceMap[folderName]
    end)
    if not s or not areaFolder then return floors end
    for _, part in pairs(areaFolder:GetChildren()) do
        if part:IsA("BasePart") then
            table.insert(floors, part)
        end
    end
    return floors
end

local function isPositionOnSide(pos, side)
    local rayOrigin = Vector3.new(pos.X, pos.Y + 5, pos.Z)
    local rayDir = Vector3.new(0, -50, 0)
    local raycastParams = RaycastParams.new()
    raycastParams.FilterType = Enum.RaycastFilterType.Include
    
    local folderName = (side == "Fire") and "LeftSide" or "RightSide"
    local s, areaFolder = pcall(function()
        return workspace.FireAndIceMap[folderName]
    end)
    
    if s and areaFolder then
        raycastParams.FilterDescendantsInstances = {areaFolder}
        local result = workspace:Raycast(rayOrigin, rayDir, raycastParams)
        if result and result.Instance then
            print(("[FIRE-ICE DEBUG] SUCCESS: Position %s is inside %s (Hit: %s)"):format(tostring(pos), folderName, result.Instance.Name))
            return true
        end
    else
        print("[FIRE-ICE DEBUG] ERROR: Could not find folder", folderName)
    end
    local floors = getFireIceFloors(side)
    if #floors == 0 then 
        print("[FIRE-ICE DEBUG] No floors found for side:", side, "| Defaulting to false (Safer)")
        return false 
    end
    for _, floor in pairs(floors) do
        local withinX = math.abs(pos.X - floor.Position.X) < (floor.Size.X / 2)
        local withinZ = math.abs(pos.Z - floor.Position.Z) < (floor.Size.Z / 2)
        if withinX and withinZ then return true end
    end
    return false
end

local function detectTeamFromGui()
    local playerGui = LocalPlayer:FindFirstChild("PlayerGui")
    if not playerGui then return nil end
    local fireIceGui = playerGui:FindFirstChild("FireAndIceGui")
    if fireIceGui and fireIceGui.Enabled then
        local main = fireIceGui:FindFirstChild("Main")
        if main then
            local teamLabel = main:FindFirstChild("Team")
            if teamLabel and teamLabel:IsA("TextLabel") then
                local txt = teamLabel.Text:lower()
                if txt:find("fire") then return "Fire"
                elseif txt:find("ice") then return "Ice"
                end
            end
        end
    end
    return nil
end

local FireIcePopupConnection = nil
local FireIceTeamChanged = false

local function connectFireIceTeamDetection()
    if FireIcePopupConnection then
        FireIcePopupConnection:Disconnect()
        FireIcePopupConnection = nil
    end
    local s, Event = pcall(function()
        return game:GetService("ReplicatedStorage").Shared.Remotes.Networking["RE/Misc/DisplayPopup"]
    end)
    if not s or not Event then return end
    FireIcePopupConnection = Event.OnClientEvent:Connect(function(msgType, text)
        local combined = tostring(msgType):lower() .. " " .. tostring(text or ""):lower()
        print("[FIRE-ICE DEBUG] Received Popup:", combined)
        
        local newTeam = nil
        if combined:find("team fire") or combined:find("fire side") then
            newTeam = "Fire"
        elseif combined:find("team ice") or combined:find("ice side") then
            newTeam = "Ice"
        end
        
        if newTeam then
            print("[FIRE-ICE DEBUG] Detected Team:", newTeam)
            if newTeam ~= Flags.FireIceTeam then
                print("[FIRE-ICE DEBUG] Updating Team from", tostring(Flags.FireIceTeam), "to", newTeam)
                Flags.FireIceTeam = newTeam
                FireIceTeamChanged = true
                if Flags.ActiveTween then
                    pcall(function() Flags.ActiveTween:Cancel() end)
                    Flags.ActiveTween = nil
                end
                if Flags.ActiveAntiPhysicsConnection then
                    Flags.ActiveAntiPhysicsConnection:Disconnect()
                    Flags.ActiveAntiPhysicsConnection = nil
                end
            end
        else
            print("[FIRE-ICE DEBUG] No Team Keywords Found in Message.")
        end
    end)
end

local function disconnectFireIceTeamDetection()
    if FireIcePopupConnection then
        FireIcePopupConnection:Disconnect()
        FireIcePopupConnection = nil
    end
end

local function findBestFireIceBrainrot()
    local brainrotRoot = getBrainrotRoot()
    if not brainrotRoot then return nil end
    local hrp = getHRP()
    if not hrp then return nil end
    
    local team = Flags.FireIceTeam
    if not team and Flags.FireIceTeamMode == "Auto" then
        team = detectTeamFromGui()
        if team then 
            Flags.FireIceTeam = team
            print("[FIRE-ICE DEBUG] Auto-detected team:", team)
        end
    end

    local isInitialTest = (team == nil)
    if isInitialTest then
        print("[FIRE-ICE DEBUG] Team is nil. Searching for ANY rarest Brainrot to trigger popup...")
    end

    local best = nil
    local bestPriority = math.huge
    local bestDist = math.huge

    for i, rarityName in ipairs(Flags.RarityPriority) do
        if FIREICE_RARITIES[rarityName] then
            local rarityFolder = brainrotRoot:FindFirstChild(rarityName)
            if rarityFolder then
                local children = rarityFolder:GetChildren()
                if #children > 0 then
                    print(("[FIRE-ICE DEBUG] Searching Rarity: %s (%d items)"):format(rarityName, #children))
                end
                for _, container in pairs(children) do
                    local rootPart = container:FindFirstChild("Root")
                    if rootPart and rootPart:IsA("BasePart") then
                        local pos = rootPart.Position
                        local allowed = (isInitialTest or isPositionOnSide(pos, team)) and isBrainrotAllowed(container, rarityName, true)
                        
                        if allowed then
                            local priority = i
                            local dist = (hrp.Position - pos).Magnitude
                            
                            if priority < bestPriority then
                                bestPriority = priority
                                bestDist = dist
                                best = {
                                    position = pos,
                                    rarity = rarityName,
                                    priority = priority,
                                    rootPart = rootPart,
                                    container = container,
                                }
                            elseif priority == bestPriority and dist < bestDist then
                                bestDist = dist
                                best = {
                                    position = pos,
                                    rarity = rarityName,
                                    priority = priority,
                                    rootPart = rootPart,
                                    container = container,
                                }
                            end
                        end
                    end
                end
            end
        end
        if best and bestPriority <= i then
            print(("[FIRE-ICE DEBUG] Selection made: %s (Priority %d)"):format(best.rarity, best.priority))
            break 
        end
    end
    return best
end

local function collectFireIceBrainrot(brainrot)
    local waveIn = isWaveInRadius()
    if waveIn then
        waitForWaveToPass()
        task.wait(0.3)
    end
    if not brainrot.rootPart or not brainrot.rootPart.Parent then return false end
    local hrp = getHRP()
    if hrp then
        hrp.CFrame = CFrame.new(brainrot.rootPart.Position.X, Flags.FixedY, brainrot.rootPart.Position.Z)
    end
    task.wait(0.1)
    local prompt = brainrot.rootPart:FindFirstChild("TakePrompt")
    if not prompt then
        for _, child in pairs(brainrot.rootPart:GetDescendants()) do
            if child:IsA("ProximityPrompt") then prompt = child break end
        end
    end
    if not prompt then return false end
    fireproximityprompt(prompt)
    local startTime = os.clock()
    local brainrotRoot = getBrainrotRoot()
    local char = getChar()
    while os.clock() - startTime < 1.5 do
        if not brainrot.rootPart or not brainrot.rootPart.Parent or
           not brainrot.rootPart:IsDescendantOf(brainrotRoot) or
           brainrot.rootPart:IsDescendantOf(char) then
            addCarryCount()
            task.wait(0.1)
            return true
        end
        task.wait(0.1)
    end
    return false
end

local function fireIceLoop()
    resetCarryCount()
    Flags.FireIceTeam = nil
    FireIceTeamChanged = false
    connectFireIceTeamDetection()
    while Flags.AutoFireIce do
        local sacrificePrompt = getFireIceSacrificeMachinePrompt()
        if not sacrificePrompt then
            task.wait(2)
        else
            toggleNoclip(true)
            enableHeightLock()
            diveDown()
            task.wait(0.3)
            while Flags.AutoFireIce do
                local carryCapacity = getCarryCapacity()
                local collected = false
                FireIceTeamChanged = false
                
                print(("[FIRE-ICE DEBUG] Loop Tick | Team: %s | Carry: %d/%d"):format(tostring(Flags.FireIceTeam), getCurrentCarry(), carryCapacity))
                
                local hrp = getHRP()
                local bestBrainrot = findBestFireIceBrainrot()
                if bestBrainrot and hrp then
                    print(("[FIRE-ICE DEBUG] Target Found: %s (%s) at dist %.1f"):format(bestBrainrot.container.Name, bestBrainrot.rarity, (hrp.Position - bestBrainrot.position).Magnitude))
                    local char = getChar()
                    local humanoid = char and char:FindFirstChildOfClass("Humanoid")
                    local origWalk = humanoid and humanoid.WalkSpeed or 16
                    local origJump = humanoid and humanoid.JumpPower or 50
                    if humanoid then
                        humanoid.WalkSpeed = 0
                        humanoid.JumpPower = 0
                        humanoid.AutoRotate = false
                    end
                    local targetPos = Vector3.new(bestBrainrot.position.X, Flags.FixedY, bestBrainrot.position.Z)
                    local dist = (Vector3.new(hrp.Position.X, 0, hrp.Position.Z) - Vector3.new(targetPos.X, 0, targetPos.Z)).Magnitude
                    
                    local speed = getActualTweenSpeed()
                    local duration = dist / speed
                    if duration < 0.05 then duration = 0.05 end
                    
                    local moveInfo = TweenInfo.new(duration, Enum.EasingStyle.Linear, Enum.EasingDirection.Out)
                    local moveTween = TweenService:Create(hrp, moveInfo, { CFrame = CFrame.new(targetPos) })
                    local antiConn = RunService.Heartbeat:Connect(function()
                        if hrp and hrp.Parent then
                            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
                            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
                        end
                    end)
                    Flags.ActiveTween = moveTween
                    Flags.ActiveAntiPhysicsConnection = antiConn
                    moveTween:Play()
                    moveTween.Completed:Wait()
                    Flags.ActiveTween = nil
                    antiConn:Disconnect()
                    Flags.ActiveAntiPhysicsConnection = nil
                    if humanoid then
                        humanoid.WalkSpeed = origWalk
                        humanoid.JumpPower = origJump
                        humanoid.AutoRotate = true
                    end
                    if FireIceTeamChanged then
                        FireIceTeamChanged = false
                        continue
                    end
                    task.wait(0.05)
                    if collectFireIceBrainrot(bestBrainrot) then
                        collected = true
                    end
                end
                if getCurrentCarry() >= carryCapacity then
                    if Flags.ActiveTween then
                        pcall(function() Flags.ActiveTween:Cancel() end)
                        Flags.ActiveTween = nil
                    end
                    disableHeightLock()
                    local s, machinePos = pcall(function()
                        return workspace.FireAndIceMap.FireAndIceSacraficeMachine.Primary.Position
                    end)
                    if s and machinePos then
                        tweenToFixedY(machinePos, Flags.FixedY, nil)
                        task.wait(0.1)
                        local hrp = getHRP()
                        if hrp then
                            hrp.CFrame = CFrame.new(machinePos.X, Flags.FixedY, machinePos.Z)
                        end
                        task.wait(0.5)
                        sacrificePrompt = getFireIceSacrificeMachinePrompt()
                        if sacrificePrompt then
                            print("[SACRIFICE DEBUG] Firing ProximityPrompt...")
                            fireproximityprompt(sacrificePrompt)
                            task.wait(0.5)
                            
                            print("[SACRIFICE DEBUG] Waiting for ChoiceGui...")
                            local startTime = os.clock()
                            local clicked = false
                            
                            local function fireEvent(obj, eventName)
                                local s, event = pcall(function() return obj[eventName] end)
                                if s and event then
                                    for _, conn in pairs(getconnections(event)) do
                                        conn:Fire()
                                    end
                                    pcall(function() event:Fire() end)
                                end
                            end

                            while os.clock() - startTime < 10 do
                                local choiceGui = LocalPlayer.PlayerGui:FindFirstChild("ChoiceGui")
                                local choice = choiceGui and choiceGui:FindFirstChild("Choice")
                                
                                if (not choice or not choice.Visible) then
                                    if clicked then
                                        print("[SACRIFICE DEBUG] Sacrifice Successful!")
                                        break
                                    end
                                else
                                    local yesBtn = choice:FindFirstChild("Choices") and choice.Choices:FindFirstChild("Yes")
                                    if yesBtn then
                                        print("[SACRIFICE DEBUG] Clicking Yes...")
                                        fireEvent(yesBtn, "MouseButton1Click")
                                        fireEvent(yesBtn, "Activated")

                                        task.spawn(function()
                                            local vim = game:GetService("VirtualInputManager")
                                            local absPos = yesBtn.AbsolutePosition
                                            local absSize = yesBtn.AbsoluteSize
                                            local center = absPos + (absSize / 2)
                                            vim:SendMouseButtonEvent(center.X, center.Y + 58, 0, true, game, 1)
                                            task.wait(0.05)
                                            vim:SendMouseButtonEvent(center.X, center.Y + 58, 0, false, game, 1)
                                        end)
                                        clicked = true
                                    end
                                end
                                task.wait(0.3) -- Essential delay to prevent crash
                            end
                            if not clicked then print("[SACRIFICE DEBUG] ChoiceGui not detected or Yes button missing.") end
                        end
                    end
                    resetCarryCount()
                    if Flags.AutoFireIce then
                        enableHeightLock()
                        diveDown()
                        task.wait(0.05)
                    end
                end
                if not getFireIceSacrificeMachinePrompt() then
                    break
                end
                if not collected then
                    if not Flags.FireIceTeam then
                        task.wait(1)
                    elseif not findBestFireIceBrainrot() then
                        task.wait(1.5)
                    else
                        task.wait(0.5)
                    end
                else
                    task.wait(0.3)
                end
            end
            disableHeightLock(true)
            toggleNoclip(false)
            task.wait(2)
        end
    end
    disconnectFireIceTeamDetection()
    disableHeightLock(true)
    toggleNoclip(false)
    Flags.FireIceTeam = nil
    FireIceTeamChanged = false
    Flags.FireIceThread = nil
end

local function autoUnequipLoop()
    while Flags.AutoUnequip do
        local char = getChar()
        if char then
            for _, item in pairs(char:GetChildren()) do
                if item:IsA("Tool") then
                    item.Parent = LocalPlayer.Backpack
                end
            end
        end
        task.wait(0.5)
    end
end

local function resetAll()
    Flags.Moving = false
    resetCarryCount()
    Flags.TowerBusy = false
    if Flags.FarmThread then
        pcall(function() task.cancel(Flags.FarmThread) end)
        Flags.FarmThread = nil
    end
    if Flags.TowerThread then
        pcall(function() task.cancel(Flags.TowerThread) end)
        Flags.TowerThread = nil
    end
end

local function restoreMovement()
    local char = LocalPlayer.Character
    if char then
        local humanoid = char:FindFirstChildOfClass("Humanoid")
        if humanoid then
            humanoid.WalkSpeed = 16
            humanoid.JumpPower = 50
        end
    end
end

LocalPlayer.CharacterAdded:Connect(function(newChar)
    task.wait(0.5)
    resetAll()
    restoreMovement()
    initDetectionCircle()
    local hum = newChar:WaitForChild("Humanoid", 5)
    if hum then
        repeat task.wait(0.2) until hum.Health > 0 or not newChar.Parent
    end
    task.wait(2)
    if Flags.AutoFarmEnabled then
        Flags.FarmThread = task.spawn(farmLoop)
    end
    if Flags.AutoTowerEnabled then
        Flags.TowerThread = task.spawn(towerLoop)
    end
    if Flags.AutoFireIce then
        Flags.FireIceTeam = nil
        if Flags.FireIceThread then
            pcall(function() task.cancel(Flags.FireIceThread) end)
        end
        Flags.FireIceThread = task.spawn(fireIceLoop)
    end
end)

ProximityPromptService.PromptShown:Connect(function(prompt)
    if Flags.InstantInteractEnabled then
        prompt.HoldDuration = 0
    end
end)

task.spawn(function()
    while task.wait(0.6) do
        if Flags.AutoSpeed then
            pcall(function() UpgradeSpeed:InvokeServer(Flags.SpeedAmount) end)
        end
    end
end)

task.spawn(function()
    while task.wait(0.8) do
        if Flags.AutoCarry then
            pcall(function() UpgradeCarry:InvokeServer() end)
        end
    end
end)

task.spawn(function()
    while task.wait(2) do
        if Flags.AutoRebirth then
            pcall(function() RebirthRemote:InvokeServer() end)
        end
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoSell then
            pcall(function() SellRemote:InvokeServer() end)
        end
        task.wait(Flags.SellDelay)
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoValentine then
            local folder = workspace:FindFirstChild("ValentinesCoinParts")
            if folder then
                local targetPart = getNearestTargetHelper(folder)
                if targetPart then
                    local targetY = math.min(targetPart.Position.Y, -1)
                    tweenToFixedY(targetPart.Position, targetY, targetPart)
                    if targetPart.Parent then
                        local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                        if hrp then
                            firetouchinterest(hrp, targetPart, 0)
                            firetouchinterest(hrp, targetPart, 1)
                        end
                        task.wait(0.05)
                    end
                else
                    task.wait(0.5)
                end
            else
                task.wait(1)
            end
        else
            task.wait(1)
        end
        task.wait()
    end
end)

local function isPhantomOrbFull()
    local success, result = pcall(function()
        local label = game:GetService("Players").LocalPlayer.PlayerGui.HUD.BottomLeft.EventSpecificCurrencies.Container.Slot1.Value
        if label and label.Text:find("100") then
            return true
        end
        return false
    end)
    return success and result
end

local function collectOnePhantomOrb()
    local folder = workspace:FindFirstChild("PhantomOrbParts")
    if folder then
        local targetPart = getNearestTargetHelper(folder)
        if targetPart then
            local targetY = math.min(targetPart.Position.Y, -1)
            tweenToFixedY(targetPart.Position, targetY, targetPart)
            if targetPart.Parent then
                local hrp = getHRP()
                if hrp then
                    firetouchinterest(hrp, targetPart, 0)
                    firetouchinterest(hrp, targetPart, 1)
                end
                task.wait(0.05)
            end
        else
            task.wait(0.5)
        end
    else
        task.wait(1)
    end
end

local function submitPhantomOrb()
    local station = workspace:FindFirstChild("PhantomMap") and workspace.PhantomMap:FindFirstChild("GhostCannon")
    if station then
        local cannonPart = station:FindFirstChild("Part")
        if cannonPart then
            tweenToFixedY(cannonPart.Position, cannonPart.Position.Y, cannonPart)
            task.wait(0.5)
            local prompts = cannonPart:FindFirstChild("Prompts")
            local prompt = prompts and prompts:FindFirstChild("ProximityPrompt")
            if prompt then
                fireproximityprompt(prompt)
                task.wait(0.5)
            end
        end
    end
end

local function collectOnePhantomShard()
    local folder = workspace:FindFirstChild("PhantomShardParts")
    if folder then
        local targetPart = getNearestTargetHelper(folder)
        if targetPart then
            local targetY = math.min(targetPart.Position.Y, -1)
            tweenToFixedY(targetPart.Position, targetY, targetPart)
            if targetPart.Parent then
                local hrp = getHRP()
                if hrp then
                    firetouchinterest(hrp, targetPart, 0)
                    firetouchinterest(hrp, targetPart, 1)
                end
                task.wait(0.05)
            end
        else
            task.wait(0.5)
        end
    else
        task.wait(1)
    end
end

local function collectOnePhantomCoin()
    local folder = workspace:FindFirstChild("PhantomCoinParts")
    if folder then
        local targetPart = getNearestTargetHelper(folder)
        if targetPart then
            local targetY = math.min(targetPart.Position.Y, -1)
            tweenToFixedY(targetPart.Position, targetY, targetPart)
            if targetPart.Parent then
                local hrp = getHRP()
                if hrp then
                    firetouchinterest(hrp, targetPart, 0)
                    firetouchinterest(hrp, targetPart, 1)
                end
                task.wait(0.05)
            end
        else
            task.wait(0.5)
        end
    else
        task.wait(1)
    end
end

local function isCandyFull()
    local success, result = pcall(function()
        local label = game:GetService("Players").LocalPlayer.PlayerGui.HUD.BottomLeft.EventSpecificCurrencies.Container.Slot1.Value
        if label and label.Text:find("100") then
            return true
        end
        return false
    end)
    return success and result
end

local function collectOneCandy()
    local folder = workspace:FindFirstChild("CandyEventParts")
    if folder then
        local targetPart = getNearestTargetHelper(folder)
        if targetPart then
            local targetY = math.min(targetPart.Position.Y, -1)
            tweenToFixedY(targetPart.Position, targetY, targetPart)
            if targetPart.Parent then
                local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                if hrp then
                    firetouchinterest(hrp, targetPart, 0)
                    firetouchinterest(hrp, targetPart, 1)
                end
                task.wait(0.05)
            end
        else
            task.wait(0.5)
        end
    else
        task.wait(1)
    end
end

local function submitCandy()
    local station = workspace:WaitForChild("ValentinesMap"):WaitForChild("CandyGramStation"):WaitForChild("Main")
    if station then
        tweenToFixedY(station.Position, -1, station)
        task.wait(0.1)
        local prompts = station:FindFirstChild("Prompts")
        if prompts then
            local prompt = prompts:FindFirstChild("ProximityPrompt")
            if prompt then
                fireproximityprompt(prompt)
                task.wait(0.3)
            end
        end
    end
end

local JustSubmitted = false
task.spawn(function()
    while true do
        if Flags.AutoCandy then
            if isCandyFull() and not JustSubmitted then
                submitCandy()
                JustSubmitted = true
                task.wait(0.5)
            else
                collectOneCandy()
                JustSubmitted = false
            end
        else
            JustSubmitted = false
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoArcade then
            local folder = workspace:FindFirstChild("ArcadeEventConsoles")
            if folder then
                local targetPart = getNearestTargetHelper(folder)
                if targetPart then
                    local targetY = math.min(targetPart.Position.Y, -1)
                    tweenToFixedY(targetPart.Position, targetY, targetPart)
                    if targetPart.Parent then
                        local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                        if hrp then
                            firetouchinterest(hrp, targetPart, 0)
                            firetouchinterest(hrp, targetPart, 1)
                        end
                        task.wait(0.05)
                    end
                else
                    task.wait(0.5)
                end
            else
                task.wait(1)
            end
        else
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoUFOCoins then
            local folder = workspace:FindFirstChild("UFOEventParts")
            if folder then
                local targetPart = getNearestTargetHelper(folder)
                if targetPart then
                    local targetY = math.min(targetPart.Position.Y, -1)
                    tweenToFixedY(targetPart.Position, targetY, targetPart)
                    if targetPart.Parent then
                        local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                        if hrp then
                            firetouchinterest(hrp, targetPart, 0)
                            firetouchinterest(hrp, targetPart, 1)
                        end
                        task.wait(0.05)
                    end
                else
                    task.wait(0.5)
                end
            else
                task.wait(1)
            end
        else
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoDoomCoins then
            local folder = workspace:FindFirstChild("DoomEventParts")
            if folder then
                local targetPart = getNearestTargetHelper(folder)
                if targetPart then
                    local targetY = math.min(targetPart.Position.Y, -1)
                    tweenToFixedY(targetPart.Position, targetY, targetPart)
                    if targetPart.Parent then
                        local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                        if hrp then
                            firetouchinterest(hrp, targetPart, 0)
                            firetouchinterest(hrp, targetPart, 1)
                        end
                        task.wait(0.05)
                    end
                else
                    task.wait(0.5)
                end
            else
                task.wait(1)
            end
        else
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoDoomButtons then
            local folder = workspace:FindFirstChild("DoomEventButtons")
            if folder then
                local targetPart = getNearestTargetHelper(folder)
                if targetPart then
                    local targetY = math.min(targetPart.Position.Y, -1)
                    enableHeightLock(targetY)
                    tweenToFixedY(targetPart.Position, targetY, targetPart)
                    while targetPart.Parent and Flags.AutoDoomButtons do
                        local hrp = getHRP()
                        local hum = getHumanoid()
                        if hrp and hum then
                            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
                            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
                            hum.WalkSpeed = 0
                            hrp.CFrame = CFrame.new(hrp.Position.X, targetY, hrp.Position.Z)
                            local prompt = targetPart:FindFirstChildWhichIsA("ProximityPrompt", true)
                            if prompt then fireproximityprompt(prompt) end
                        end
                        task.wait(0.05)
                    end
                    local hum = getHumanoid()
                    if hum then hum.WalkSpeed = 16 end
                else
                    task.wait(0.5)
                end
            else
                task.wait(1)
            end
        else
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoRadioactiveCoins then
            local eventFolder = workspace:FindFirstChild("EventParts")
            if eventFolder then
                local folder = eventFolder:FindFirstChild("RadioactiveCoinsFolder")
                if folder then
                    local targetPart = getNearestTargetHelper(folder)
                    if targetPart then
                        local targetY = math.min(targetPart.Position.Y, -1)
                        tweenToFixedY(targetPart.Position, targetY, targetPart)
                        if targetPart.Parent then
                            local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                            if hrp then
                                firetouchinterest(hrp, targetPart, 0)
                                firetouchinterest(hrp, targetPart, 1)
                            end
                            task.wait(0.05)
                        end
                    else
                        task.wait(0.5)
                    end
                else
                    task.wait(1)
                end
            else
                task.wait(1)
            end
        else
            task.wait(1)
        end
        task.wait()
    end
end)

local PhantomOrbSubmitted = false
task.spawn(function()
    while true do
        if Flags.AutoPhantomOrb then
            if isPhantomOrbFull() and not PhantomOrbSubmitted then
                submitPhantomOrb()
                PhantomOrbSubmitted = true
            else
                collectOnePhantomOrb()
                PhantomOrbSubmitted = false
            end
        else
            PhantomOrbSubmitted = false
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoPhantomShard then
            collectOnePhantomShard()
        else
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoPhantomCoin then
            collectOnePhantomCoin()
        else
            task.wait(1)
        end
        task.wait()
    end
end)

task.spawn(function()
    while true do
        if Flags.AutoUpgradeBase then
            pcall(function() UpgradeBaseRemote:FireServer() end)
        end
        task.wait(2)
    end
end)

local function lockItems()
    local char = LocalPlayer.Character
    local backpack = LocalPlayer:FindFirstChild("Backpack")
    local items = {}
    if backpack then for _, v in pairs(backpack:GetChildren()) do table.insert(items, v) end end
    if char then for _, v in pairs(char:GetChildren()) do table.insert(items, v) end end
    if #items == 0 then return end
    for _, item in pairs(items) do
        if item:IsA("Tool") then
            local isLocked = item:GetAttribute("Locked") == true
            if isLocked then continue end
            local brainrotName = item:GetAttribute("BrainrotName")
            local lbType = item:GetAttribute("LuckyBlockType")
            local lbTool = item:GetAttribute("LuckyBlockTool")
            local isLB = lbType ~= nil or lbTool ~= nil
            local isBR = brainrotName ~= nil
            if Flags.LockType == "Lucky Block Only" and not isLB then continue end
            if Flags.LockType == "Brainrot Only" and not isBR then continue end
            local shouldLock = false
            if isBR then
                local rarity = Flags.BrainrotRarityMap[brainrotName] or "Unknown"
                local mutation = item:GetAttribute("Mutation") or "None"
                if Flags.SelectedLockBrainrots[brainrotName] then shouldLock = true end
                if not shouldLock then
                    if Flags.SelectedLockBrainrotRarities[rarity] or Flags.SelectedLockMutations[mutation] then
                        shouldLock = true
                    end
                end
            elseif isLB then
                local rarity = lbType or "Unknown"
                local displayName = item:GetAttribute("DisplayName") or item.Name
                local cleanName = displayName:gsub("%s*%b()", ""):gsub("%s*Block%s*", "")
                local parts = string.split(cleanName, " ")
                local mutation = "None"
                if #parts >= 2 then mutation = parts[1] end
                if not Flags.SelectedLockMutations[mutation] and mutation ~= "None" then mutation = "None" end
                if Flags.SelectedLockLuckyBlockRarities[rarity] or Flags.SelectedLockMutations[mutation] then
                    shouldLock = true
                end
            end
            if shouldLock then
                LockItemRemote:FireServer(item.Name, true)
            end
        end
    end
end

task.spawn(function()
    while true do
        if Flags.AutoLockInventory then
            local s, e = pcall(lockItems)
            if not s then warn("[LOCK ERROR] " .. tostring(e)) end
        end
        task.wait(0.5)
    end
end)

local JumpConnection = nil

local function enableUnlimitedJump()
    if JumpConnection then
        JumpConnection:Disconnect()
        JumpConnection = nil
    end
    JumpConnection = UserInputService.JumpRequest:Connect(function()
        if Flags.UnlimitedJumpEnabled then
            local char = LocalPlayer.Character
            if char then
                local humanoid = char:FindFirstChildOfClass("Humanoid")
                if humanoid then
                    humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
                end
            end
        end
    end)
end

local BasesFolder = workspace:WaitForChild("Bases")
local CollectDelay = 0
local CollectRepeatDelay = 10

local function isMyBase(base)
    local success, result = pcall(function()
        return base.Title.TitleGui.Frame.PlayerName.Text
    end)
    if success and result then
        if result == LocalPlayer.Name or result == LocalPlayer.DisplayName then return true end
    end
    local ownerVal = base:FindFirstChild("Owner")
    if ownerVal and (ownerVal:IsA("StringValue") or ownerVal:IsA("ObjectValue")) then
        if tostring(ownerVal.Value) == LocalPlayer.Name then return true end
    end
    local ownerNameVal = base:FindFirstChild("OwnerName")
    if ownerNameVal and ownerNameVal:IsA("StringValue") then
        if ownerNameVal.Value == LocalPlayer.Name then return true end
    end
    local titlePart = base:FindFirstChild("Title")
    if titlePart then
        local success2, result2 = pcall(function()
            for _, v in pairs(titlePart:GetDescendants()) do
                if v:IsA("TextLabel") and v.Text == LocalPlayer.Name then return true end
            end
            return false
        end)
        if success2 and result2 then return true end
    end
    return false
end

local function findMyBase()
    for _, base in pairs(BasesFolder:GetChildren()) do
        if isMyBase(base) then return base end
    end
    return nil
end

local function collectSlot(slot, hrp)
    local touchPart = nil
    local collect = slot:FindFirstChild("Collect")
    if collect and collect:IsA("BasePart") and collect:FindFirstChild("TouchInterest") then
        touchPart = collect
    else
        for _, child in pairs(slot:GetDescendants()) do
            if child:IsA("BasePart") and child:FindFirstChild("TouchInterest") then
                touchPart = child
                break
            end
        end
    end
    if touchPart then
        firetouchinterest(hrp, touchPart, 0)
        task.wait()
        firetouchinterest(hrp, touchPart, 1)
        return true
    end
    return false
end

local function autoCollectMyBase()
    local hrp = getHRP()
    local base = findMyBase()
    if base then
        local slots = base:FindFirstChild("Slots")
        if slots then
            for _, slot in pairs(slots:GetChildren()) do
                if slot.Name:find("Slot") then
                    local collected = collectSlot(slot, hrp)
                    if collected then task.wait(CollectDelay) end
                end
            end
        end
    end
end

task.spawn(function()
    while true do
        if Flags.AutoCollectSpecificBase then
            pcall(autoCollectMyBase)
        end
        task.wait(CollectRepeatDelay)
    end
end)

Flags.WaveDetectEnabled = true

local FarmGroup = MainTab:NewSection("Auto Farm", false)
FarmGroup:Dropdown({
    Name = "Farm Mode",
    Flag = "FarmMode_Dropdown",
    Search = true,
    List = { "Both", "Brainrot Only", "Lucky Block Only" },
    Default = "Both",
    Callback = function(v)
        if v == "Both" then
            Flags.FarmMode = "Both"
            UI:Notify({ Title = "Mode", Content = "Both Mode Selected", Time = 2 })
        elseif v == "Brainrot Only" then
            Flags.FarmMode = "Brainrot"
            UI:Notify({ Title = "Mode", Content = "Brainrot Mode Selected", Time = 2 })
        elseif v == "Lucky Block Only" then
            Flags.FarmMode = "LuckyBlock"
            UI:Notify({ Title = "Mode", Content = "Lucky Box Mode Selected", Time = 2 })
        end
    end
})
FarmGroup:Dropdown({
    Name = "Select Brainrot Rarities",
    Flag = "SelectBrainrotRarities_Dropdown",
    Search = true,
    List = Flags.RarityPriority,
    Multi = true,
    Default = {},
    Callback = function(selected)
        for k in pairs(Flags.SelectedBrainrotRarities) do Flags.SelectedBrainrotRarities[k] = false end
        for _, r in ipairs(selected) do Flags.SelectedBrainrotRarities[r] = true end
    end
})
FarmGroup:Dropdown({
    Name = "Select Lucky Block Rarities",
    Flag = "SelectLuckyBlockRarities_Dropdown",
    Search = true,
    List = GetLuckyBlockRarityList(),
    Multi = true,
    Default = {},
    Callback = function(selected)
        for k in pairs(Flags.SelectedLuckyBlockRarities) do Flags.SelectedLuckyBlockRarities[k] = false end
        for _, r in ipairs(selected) do Flags.SelectedLuckyBlockRarities[r] = true end
    end
})
FarmGroup:Dropdown({
    Name = "Select Lucky Block Mutations",
    Flag = "SelectLuckyBlockMutations_Dropdown",
    Search = true,
    List = GetLuckyBlockMutationList(),
    Multi = true,
    Default = {},
    Callback = function(selected)
        for k in pairs(Flags.SelectedLuckyBlockMutations) do Flags.SelectedLuckyBlockMutations[k] = false end
        for _, m in ipairs(selected) do Flags.SelectedLuckyBlockMutations[m] = true end
    end
})
FarmGroup:Dropdown({
    Name = "Select Brainrots",
    Flag = "SelectBrainrots_Dropdown",
    List = GetBrainrotNameList(),
    Multi = true,
    Search = true,
    Default = {},
    Callback = function(selected)
        for k in pairs(Flags.SelectedBrainrotNames) do Flags.SelectedBrainrotNames[k] = false end
        for _, name in ipairs(selected) do Flags.SelectedBrainrotNames[name] = true end
    end
})

local function stopFarmCleanup()
    if Flags.ActiveTween then
        pcall(function() Flags.ActiveTween:Cancel() end)
        Flags.ActiveTween = nil
    end
    if Flags.ActiveAntiPhysicsConnection then
        Flags.ActiveAntiPhysicsConnection:Disconnect()
        Flags.ActiveAntiPhysicsConnection = nil
    end
    disableHeightLock()
    local char = getChar()
    local hrp = getHRP()
    local humanoid = char and char:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.WalkSpeed = Flags.SavedWalkSpeed
        humanoid.JumpPower = Flags.SavedJumpPower
        humanoid.AutoRotate = true
    end
    disableHeightLock(true)
    toggleNoclip(false)
    if hrp then
        resetPhysics(hrp)
        hrp.CFrame = CFrame.new(hrp.Position.X, 5, hrp.Position.Z)
        task.wait(0.1)
        resetPhysics(hrp)
    end
end

FarmGroup:Toggle({
    Name = "Auto Farm",
    Flag = "AutoFarm_Toggle",
    Default = false,
    Callback = function(state)
        Flags.AutoFarmEnabled = state
        if state then
            local char = getChar()
            local humanoid = char and char:FindFirstChildOfClass("Humanoid")
            Flags.SavedWalkSpeed = (humanoid and humanoid.WalkSpeed > 0) and humanoid.WalkSpeed or 16
            Flags.SavedJumpPower = (humanoid and humanoid.JumpPower or 50)
            if not Flags.FarmThread then
                Flags.FarmThread = task.spawn(farmLoop)
            end
            UI:Notify({ Title = "Farm", Content = "Auto Farm Started", Time = 2 })
        else
            if Flags.FarmThread then
                pcall(function() task.cancel(Flags.FarmThread) end)
                Flags.FarmThread = nil
            end
            stopFarmCleanup()
            UI:Notify({ Title = "Farm", Content = "Auto Farm Stopped", Time = 2 })
        end
    end
})

do
    local FarmSettingsGroup = MainTab:NewSection("Farm Settings", false)
    FarmSettingsGroup:Slider({
        Name = "Carry Capacity",
        Flag = "CarryCapacity_Slider",
        Min = 1,
        Max = 6,
        Default = 6,
        Callback = function(value)
            Flags.ManualCarryCapacity = value
        end
    })
    FarmSettingsGroup:Toggle({
        Name = "Auto Unequip Items",
        Flag = "AutoUnequip_Toggle",
        Default = false,
        Callback = function(state)
            Flags.AutoUnequip = state
            if state then
                if not Flags.AutoUnequipThread then
                    Flags.AutoUnequipThread = task.spawn(autoUnequipLoop)
                end
            else
                if Flags.AutoUnequipThread then
                    pcall(function() task.cancel(Flags.AutoUnequipThread) end)
                    Flags.AutoUnequipThread = nil
                end
            end
        end
    })
    local TweenSpeedSliderInstance = nil
    FarmSettingsGroup:Toggle({
        Name = "Auto Adjust Tween Speed",
        Flag = "AutoAdjustTweenSpeed_Toggle",
        Default = true,
        Callback = function(state)
            Flags.AutoAdjustTweenSpeed = state
            if TweenSpeedSliderInstance then
                if state then
                    TweenSpeedSliderInstance:Hide()
                else
                    TweenSpeedSliderInstance:Show()
                end
            end
        end
    })
    TweenSpeedSliderInstance = FarmSettingsGroup:Slider({
        Name = "Tween Speed",
        Flag = "TweenSpeed_Slider",
        Min = 50,
        Max = 1500,
        Default = 50,
        Callback = function(value)
            ManualTweenSpeed = value
        end
    })
    task.spawn(function()
        task.wait(0.1)
        if Flags.AutoAdjustTweenSpeed then
            TweenSpeedSliderInstance:Hide()
        else
            TweenSpeedSliderInstance:Show()
        end
    end)
end

do
    local TowerGroup = MainTab:NewSection("Auto Tower Trial", false)
    TowerGroup:Toggle({
        Name = "Auto Tower Trial",
        Flag = "AutoTower_Toggle",
        Default = false,
        Callback = function(state)
            Flags.AutoTowerEnabled = state
            if state then
                if not Flags.TowerThread then
                    Flags.TowerThread = task.spawn(towerLoop)
                end
                UI:Notify({ Title = "Tower", Content = "Auto Tower Trial Started", Time = 2 })
            else
                if Flags.TowerThread then
                    pcall(function() task.cancel(Flags.TowerThread) end)
                    Flags.TowerThread = nil
                end
                cleanupTowerState()
                UI:Notify({ Title = "Tower", Content = "Auto Tower Trial Stopped", Time = 2 })
            end
        end
    })
    TowerGroup:Slider({
        Name = "Progress Threshold",
        Flag = "ProgressThreshold_Slider",
        Min = 3,
        Max = 20,
        Default = 6,
        Callback = function(value)
            Flags.ProgressThreshold = value
        end
    })
end

do
    local ManualGroup = TeleportTab:NewSection("Zones", false)
    local SelectedManualZone = "Base"
    ManualGroup:Dropdown({
        Name = "Select Zone",
        Flag = "SelectZone_Dropdown",
        Search = true,
        List = ZoneOrder,
        Default = "Base",
        Callback = function(value)
            SelectedManualZone = value
        end
    })
    ManualGroup:Button({
        Name = "TP to Selected Zone",
        Callback = function()
            if Zones[SelectedManualZone] then
                tweenTo(Zones[SelectedManualZone])
            end
        end
    })
    ManualGroup:Button({ Name = "Previous Zone", Callback = stepBackward })
    ManualGroup:Button({ Name = "Next Zone", Callback = stepForward })
end

do
    local EventGroup = EventTab:NewSection("Valentine Event", false)
    EventGroup:Toggle({
        Name = "Auto Collect Valentine Coins",
        Flag = "AutoValentine_Toggle",
        Default = false,
        Callback = function(value)
            Flags.AutoValentine = value
            updateEventFarmState()
        end
    })
    EventGroup:Toggle({
        Name = "Auto Collect Candy + Submit Candy",
        Flag = "AutoCandy_Toggle",
        Default = false,
        Callback = function(value)
            Flags.AutoCandy = value
            updateEventFarmState()
        end
    })
    local ArcadeGroup = EventTab:NewSection("Arcade Event", false)
    ArcadeGroup:Toggle({
        Name = "Auto Collect Arcade Consoles",
        Flag = "AutoArcade_Toggle",
        Default = false,
        Callback = function(value)
            Flags.AutoArcade = value
            updateEventFarmState()
        end
    })
    local UFOGroup = EventTab:NewSection("UFO Event", false)
    UFOGroup:Toggle({
        Name = "Auto Collect UFO Coins",
        Flag = "AutoUFOCoins_Toggle",
        Default = false,
        Callback = function(v)
            Flags.AutoUFOCoins = v
            updateEventFarmState()
        end
    })
    local DoomGroup = EventTab:NewSection("Doom Event", false)
    DoomGroup:Toggle({
        Name = "Auto Collect Doom Coins",
        Flag = "AutoDoomCoins_Toggle",
        Default = false,
        Callback = function(v)
            Flags.AutoDoomCoins = v
            updateEventFarmState()
        end
    })
    DoomGroup:Toggle({
        Name = "Auto Press Doom Buttons",
        Flag = "AutoDoomButtons_Toggle",
        Default = false,
        Callback = function(v)
            Flags.AutoDoomButtons = v
            updateEventFarmState()
        end
    })
    local RadioactiveGroup = EventTab:NewSection("Radioactive Event", false)
    RadioactiveGroup:Toggle({
        Name = "Auto Collect Radioactive Coins",
        Flag = "AutoRadioactiveCoins_Toggle",
        Default = false,
        Callback = function(v)
            Flags.AutoRadioactiveCoins = v
            updateEventFarmState()
        end
    })
    local PhantomGroup = EventTab:NewSection("Phantom Event", false)
    PhantomGroup:Toggle({
        Name = "Auto Collect Orb + Submit",
        Flag = "AutoPhantomOrb_Toggle",
        Default = false,
        Callback = function(v)
            Flags.AutoPhantomOrb = v
            updateEventFarmState()
        end
    })
    PhantomGroup:Toggle({
        Name = "Auto Collect Shard",
        Flag = "AutoPhantomShard_Toggle",
        Default = false,
        Callback = function(v)
            Flags.AutoPhantomShard = v
            updateEventFarmState()
        end
    })
    PhantomGroup:Toggle({
        Name = "Auto Collect Phantom Coins",
        Flag = "AutoPhantomCoin_Toggle",
        Default = false,
        Callback = function(v)
            Flags.AutoPhantomCoin = v
            updateEventFarmState()
        end
    })
    local FireIceGroup = EventTab:NewSection("Ice & Fire Event", false)
     FireIceGroup:Toggle({
        Name = "Ice & Fire Mode",
        Flag = "AutoFireIce_Toggle",
        Default = false,
        Callback = function(state)
            Flags.AutoFireIce = state
            if state then
                if not Flags.FireIceThread then
                    Flags.FireIceThread = task.spawn(fireIceLoop)
                end
                UI:Notify({ Title = "Ice & Fire", Content = "Ice & Fire Mode Started", Time = 2 })
            else
                if Flags.FireIceThread then
                    pcall(function() task.cancel(Flags.FireIceThread) end)
                    Flags.FireIceThread = nil
                end
                disableHeightLock(true)
                toggleNoclip(false)
                Flags.FireIceTeam = nil
                disconnectFireIceTeamDetection()
                UI:Notify({ Title = "Ice & Fire", Content = "Ice & Fire Mode Stopped", Time = 2 })
            end
        end
    })
end

do
    local PlayerGroup = LocalPlayerTab:NewSection("Player", false)
    PlayerGroup:Toggle({
        Name = "Unlimited Jump",
        Flag = "UnlimitedJump_Toggle",
        Default = false,
        Callback = function(state)
            Flags.UnlimitedJumpEnabled = state
            if state then enableUnlimitedJump() end
        end
    })
    local FlyGroup = LocalPlayerTab:NewSection("Fly", false)
    FlyGroup:Button({
        Name = "Open Fly GUI",
        Callback = function()
            loadstring(game:HttpGet("https://raw.githubusercontent.com/XNEOFF/FlyGuiV3/main/FlyGuiV3.txt"))()
        end
    })
end

local SAFE_Y_HEIGHT = -7
local CLONE_TRANSPARENCY = 0.5
local GodModeKey = Enum.KeyCode.Q
local godModeEnabled = false
local GodCloneChar = nil
local GodConnections = {}
local GodChar = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
local GodRealHRP = GodChar:WaitForChild("HumanoidRootPart")
local GodRealHumanoid = GodChar:WaitForChild("Humanoid")
local GodCamera = Workspace.CurrentCamera
local PlayerModule = require(LocalPlayer:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule"))
local GodControls = PlayerModule:GetControls()

local function CleanVisuals(characterModel)
    for _, part in pairs(characterModel:GetDescendants()) do
        if part:IsA("BasePart") then
            if part.Name == "CollisionPart" or part.Name == "HumanoidRootPart" then
                part.Transparency = 1
                part.CanCollide = false
            else
                part.Transparency = CLONE_TRANSPARENCY
            end
            if part.Name ~= "CollisionPart" then part.CanCollide = true end
            part.Anchored = false
        end
        if part.Name == "HumanoidRootPart" or part.Name == "CollisionPart" then
            for _, child in pairs(part:GetChildren()) do
                if child:IsA("Decal") or child:IsA("Texture") then child:Destroy() end
            end
        end
    end
end

local function DisableGodMode(teleportBack)
    for _, conn in pairs(GodConnections) do conn:Disconnect() end
    GodConnections = {}
    local targetCFrame = nil
    if GodCloneChar and GodCloneChar:FindFirstChild("HumanoidRootPart") then
        targetCFrame = GodCloneChar.HumanoidRootPart.CFrame
    end
    if GodCloneChar then
        GodCloneChar:Destroy()
        GodCloneChar = nil
    end
    GodCamera.CameraSubject = GodRealHumanoid
    GodRealHumanoid.PlatformStand = false
    if GodRealHRP:FindFirstChild("AntiGravity") then GodRealHRP.AntiGravity:Destroy() end
    GodRealHRP.Velocity = Vector3.new(0, 0, 0)
    GodRealHRP.RotVelocity = Vector3.new(0, 0, 0)
    local currentTool = GodChar:FindFirstChildOfClass("Tool")
    if currentTool then
        currentTool.Grip = CFrame.new(0, 0, 0)
    end
    if teleportBack and targetCFrame then GodRealHRP.CFrame = targetCFrame end
    for _, part in pairs(GodChar:GetDescendants()) do
        if part:IsA("BasePart") then
            if part.Name == "CollisionPart" or part.Name == "HumanoidRootPart" then
                part.Transparency = 1
            else
                part.Transparency = 0
                part.CanCollide = true
            end
        elseif part:IsA("Decal") or part:IsA("Texture") then
            if part.Parent.Name ~= "HumanoidRootPart" and part.Parent.Name ~= "CollisionPart" then
                part.Transparency = 0
            end
        end
    end
end

local function EnableGodMode()
    GodChar = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
    GodRealHRP = GodChar:WaitForChild("HumanoidRootPart")
    GodRealHumanoid = GodChar:WaitForChild("Humanoid")
    GodChar.Archivable = true
    if GodCloneChar then GodCloneChar:Destroy() end
    GodCloneChar = GodChar:Clone()
    GodCloneChar.Name = "GodClone"
    GodCloneChar.Parent = Workspace
    for _, v in pairs(GodCloneChar:GetDescendants()) do
        if v:IsA("Script") or v:IsA("LocalScript") then v:Destroy() end
    end
    if GodCloneChar:FindFirstChild("Humanoid") then
        GodCloneChar.Humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
    end
    local CloneHumanoid = GodCloneChar:WaitForChild("Humanoid")
    local CloneHRP = GodCloneChar:WaitForChild("HumanoidRootPart")
    local CloneAnimator = CloneHumanoid:WaitForChild("Animator")
    CleanVisuals(GodCloneChar)
    CloneHRP.CFrame = GodRealHRP.CFrame + Vector3.new(0, 5, 0)
    GodCamera.CameraSubject = CloneHumanoid
    GodRealHumanoid.PlatformStand = true
    if GodRealHRP:FindFirstChild("AntiGravity") then GodRealHRP.AntiGravity:Destroy() end
    local bv = Instance.new("BodyVelocity")
    bv.Name = "AntiGravity"
    bv.Velocity = Vector3.new(0, 0, 0)
    bv.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    bv.Parent = GodRealHRP
    for _, part in pairs(GodChar:GetDescendants()) do
        if part:IsA("BasePart") then part.CanCollide = false end
    end
    local animIds = {
        Idle = "http://www.roblox.com/asset/?id=180435571",
        Walk = "http://www.roblox.com/asset/?id=180426354",
        Jump = "http://www.roblox.com/asset/?id=125750702"
    }
    if GodRealHumanoid.RigType == Enum.HumanoidRigType.R15 then
        animIds.Idle = "http://www.roblox.com/asset/?id=507766388"
        animIds.Walk = "http://www.roblox.com/asset/?id=507777826"
        animIds.Jump = "http://www.roblox.com/asset/?id=507765000"
    end
    local tracks = {}
    for name, id in pairs(animIds) do
        local anim = Instance.new("Animation")
        anim.AnimationId = id
        tracks[name] = CloneAnimator:LoadAnimation(anim)
    end
    local renderConn = RunService.RenderStepped:Connect(function()
        if not GodCloneChar or not GodCloneChar.Parent then return end
        CloneHRP.Transparency = 1
        local colPart = GodCloneChar:FindFirstChild("CollisionPart")
        if colPart then colPart.Transparency = 1 end
        for _, part in pairs(GodChar:GetDescendants()) do
            if (part:IsA("BasePart") or part:IsA("Decal") or part:IsA("Texture")) and not part:FindFirstAncestorOfClass("Tool") then
                part.Transparency = 1
            end
        end
        local currentTool = GodChar:FindFirstChildOfClass("Tool")
        if currentTool then
            local handle = currentTool:FindFirstChild("Handle")
            if handle then
                local armName = (GodRealHumanoid.RigType == Enum.HumanoidRigType.R15) and "RightHand" or "Right Arm"
                local realArm = GodChar:FindFirstChild(armName)
                if realArm then
                    currentTool.Grip = CFrame.new(0, -( 4 - realArm.Position.Y ), 0)
                end
            end
        end
        local moveVector = GodControls:GetMoveVector()
        local camLook = GodCamera.CFrame.LookVector
        local camRight = GodCamera.CFrame.RightVector
        camLook = Vector3.new(camLook.X, 0, camLook.Z).Unit
        camRight = Vector3.new(camRight.X, 0, camRight.Z).Unit
        local moveDir = (camLook * -moveVector.Z) + (camRight * moveVector.X)
        if moveDir.Magnitude > 0 then
            CloneHumanoid:Move(moveDir, false)
        else
            CloneHumanoid:Move(Vector3.new(0, 0, 0), false)
        end
        if GodRealHumanoid.Jump then
            CloneHumanoid.Jump = true
            GodRealHumanoid.Jump = false
        end
        if UserInputService:IsKeyDown(Enum.KeyCode.Space) then
            CloneHumanoid.Jump = true
        end
        local velocity = CloneHRP.Velocity
        local speed = Vector3.new(velocity.X, 0, velocity.Z).Magnitude
        local inAir = math.abs(velocity.Y) > 2
        if inAir then
            if not tracks.Jump.IsPlaying then tracks.Jump:Play() end
            tracks.Walk:Stop()
            tracks.Idle:Stop()
        elseif speed > 0.5 then
            if not tracks.Walk.IsPlaying then
                tracks.Walk:Play()
                tracks.Walk:AdjustSpeed(CloneHumanoid.WalkSpeed / 16)
            end
            tracks.Idle:Stop()
            tracks.Jump:Stop()
        else
            if not tracks.Idle.IsPlaying then tracks.Idle:Play() end
            tracks.Walk:Stop()
            tracks.Jump:Stop()
        end
        CloneHumanoid.WalkSpeed = GodRealHumanoid.WalkSpeed
        CloneHumanoid.JumpPower = GodRealHumanoid.JumpPower
    end)
    table.insert(GodConnections, renderConn)
    local steppedConn = RunService.Stepped:Connect(function()
        if GodRealHRP and CloneHRP then
            GodRealHRP.CFrame = CFrame.new(CloneHRP.Position.X, SAFE_Y_HEIGHT, CloneHRP.Position.Z)
            GodRealHRP.Velocity = Vector3.new(0, 0, 0)
            GodRealHRP.RotVelocity = Vector3.new(0, 0, 0)
        end
    end)
    table.insert(GodConnections, steppedConn)
end

local function ToggleGodMode()
    if godModeEnabled then
        godModeEnabled = false
        DisableGodMode(true)
    else
        godModeEnabled = true
        EnableGodMode()
    end
end

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == GodModeKey then ToggleGodMode() end
end)

local function ConnectGodDeathEvent()
    if not GodRealHumanoid then return end
    GodRealHumanoid.Died:Connect(function()
        if godModeEnabled then
            task.spawn(function()
                task.wait(0.5)
                local was = godModeEnabled
                godModeEnabled = false
                DisableGodMode(false)
                task.wait(0.5)
                if was and LocalPlayer.Character and LocalPlayer.Character:FindFirstChildOfClass("Humanoid") and LocalPlayer.Character:FindFirstChildOfClass("Humanoid").Health > 0 then
                    godModeEnabled = true
                    EnableGodMode()
                end
            end)
        end
    end)
end

ConnectGodDeathEvent()

LocalPlayer.CharacterAdded:Connect(function(newChar)
    GodChar = newChar
    GodRealHRP = GodChar:WaitForChild("HumanoidRootPart")
    GodRealHumanoid = GodChar:WaitForChild("Humanoid")
    ConnectGodDeathEvent()
    if godModeEnabled then
        task.wait(0.1)
        EnableGodMode()
    end
end)

do
    local GodGroup = LocalPlayerTab:NewSection("God Mode", false)
    GodGroup:Toggle({
        Name = "Enable God Mode",
        Flag = "EnableGodMode_Toggle",
        Default = false,
        Callback = function(state)
            if state ~= godModeEnabled then ToggleGodMode() end
        end
    })
    GodGroup:Keybind({
        Name = "God Mode Keybind",
        Flag = "GodMode_Keybind",
        Default = Enum.KeyCode.Q,
        Callback = function(key)
            GodModeKey = key
        end
    })
end

do
    local UpgradeGroup = AutomaticTab:NewSection("Upgrades", false)
    UpgradeGroup:Toggle({
        Name = "Auto Upgrade Speed",
        Flag = "AutoUpgradeSpeed_Toggle",
        Default = false,
        Callback = function(v) Flags.AutoSpeed = v end
    })
    UpgradeGroup:Dropdown({
        Name = "Speed Amount",
        Flag = "SpeedAmount_Dropdown",
        Search = true,
        List = { "1","5","10" },
        Default = "10",
        Callback = function(v) Flags.SpeedAmount = tonumber(v) end
    })
    UpgradeGroup:Toggle({
        Name = "Auto Upgrade Carry",
        Flag = "AutoUpgradeCarry_Toggle",
        Default = false,
        Callback = function(v) Flags.AutoCarry = v end
    })
    UpgradeGroup:Toggle({
        Name = "Auto Upgrade Base",
        Flag = "AutoUpgradeBase_Toggle",
        Default = false,
        Callback = function(v) Flags.AutoUpgradeBase = v end
    })
end

do
    local RebirthGroup = AutomaticTab:NewSection("Auto Rebirth", false)
    RebirthGroup:Toggle({
        Name = "Auto Rebirth",
        Flag = "AutoRebirth_Toggle",
        Default = false,
        Callback = function(v) Flags.AutoRebirth = v end
    })
end

do
    local SellGroup = AutomaticTab:NewSection("Auto Sell", false)
    SellGroup:Toggle({
        Name = "Auto Sell All Brainrot",
        Flag = "AutoSell_Toggle",
        Default = false,
        Callback = function(v) Flags.AutoSell = v end
    })
    SellGroup:Textbox({
        Name = "Delay (s)",
        Flag = "AutoSellDelay_Textbox",
        Placeholder = "1.2",
        Default = "1.2",
        Callback = function(v)
            local num = tonumber(v)
            if num then Flags.SellDelay = num end
        end
    })
end

do
    local BaseGroup = AutomaticTab:NewSection("Auto Collect Cash", false)
    BaseGroup:Toggle({
        Name = "Auto Collect",
        Flag = "BaseAutoCollect_Toggle",
        Default = false,
        Callback = function(state)
            Flags.AutoCollectSpecificBase = state
        end
    })
    BaseGroup:Textbox({
        Name = "Delay (s)",
        Flag = "BaseCollectDelay_Textbox",
        Placeholder = "10",
        Default = "10",
        Callback = function(text, enter)
            local num = tonumber(text)
            if num and num >= 0 then CollectRepeatDelay = num end
        end
    })
end

do
    local LockGroup = AutomaticTab:NewSection("Inventory Lock", false)
    LockGroup:Toggle({
        Name = "Auto Lock Inventory",
        Flag = "AutoLockInventory_Toggle",
        Default = false,
        Callback = function(v) Flags.AutoLockInventory = v end
    })
    LockGroup:Dropdown({
        Name = "Lock Type",
        Flag = "LockType_Dropdown",
        List = {"Both", "Lucky Block Only", "Brainrot Only"},
        Default = "Both",
        Callback = function(v) Flags.LockType = v end
    })
    LockGroup:Dropdown({
        Name = "Select by Rarity for Lucky Block",
        Flag = "LockLuckyBlockRarities_Dropdown",
        List = GetLuckyBlockRarityList(),
        Multi = true,
        Search = true,
        Default = {},
        Callback = function(selected)
            for k in pairs(Flags.SelectedLockLuckyBlockRarities) do Flags.SelectedLockLuckyBlockRarities[k] = false end
            for _, r in ipairs(selected) do Flags.SelectedLockLuckyBlockRarities[r] = true end
        end
    })
    LockGroup:Dropdown({
        Name = "Select by Rarity for Brainrot",
        Flag = "LockBrainrotRarities_Dropdown",
        List = Flags.RarityPriority,
        Multi = true,
        Search = true,
        Default = {},
        Callback = function(selected)
            for k in pairs(Flags.SelectedLockBrainrotRarities) do Flags.SelectedLockBrainrotRarities[k] = false end
            for _, r in ipairs(selected) do Flags.SelectedLockBrainrotRarities[r] = true end
        end
    })
    LockGroup:Dropdown({
        Name = "Select by Brainrot Name",
        Flag = "LockBrainrots_Dropdown",
        List = GetBrainrotNameList(),
        Multi = true,
        Search = true,
        Default = {},
        Callback = function(selected)
            for k in pairs(Flags.SelectedLockBrainrots) do Flags.SelectedLockBrainrots[k] = false end
            for _, name in ipairs(selected) do Flags.SelectedLockBrainrots[name] = true end
        end
    })
    LockGroup:Dropdown({
        Name = "Select by Mutations",
        Flag = "LockMutations_Dropdown",
        List = GetMutationList(),
        Multi = true,
        Search = true,
        Default = {},
        Callback = function(selected)
            for k in pairs(Flags.SelectedLockMutations) do Flags.SelectedLockMutations[k] = false end
            for _, name in ipairs(selected) do Flags.SelectedLockMutations[name] = true end
        end
    })
end

local function applyExtremeFPSBoost()
    local Terrain = workspace:FindFirstChildOfClass("Terrain") or workspace.Terrain
    local Lighting = game:GetService("Lighting")
    local function OptimizeLightingAndSettings()
        Lighting.GlobalShadows = false
        Lighting.FogEnd = 9e9
        Lighting.Brightness = 0
        Lighting.Ambient = Color3.fromRGB(150, 150, 150)
        Lighting.OutdoorAmbient = Color3.fromRGB(150, 150, 150)
        Lighting.EnvironmentSpecularScale = 0
        Lighting.EnvironmentDiffuseScale = 0
        pcall(function() sethiddenproperty(Lighting, "Technology", Enum.Technology.Compatibility) end)
        for _, v in pairs(Lighting:GetChildren()) do
            if v:IsA("PostEffect") or v:IsA("Sky") or v:IsA("Atmosphere") or v:IsA("SunRaysEffect") or v:IsA("BloomEffect") or v:IsA("BlurEffect") or v:IsA("DepthOfFieldEffect") then
                v:Destroy()
            end
        end
    end
    local function OptimizeTerrain()
        pcall(function()
            if Terrain then
                Terrain.WaterWaveSize = 0
                Terrain.WaterWaveSpeed = 0
                Terrain.WaterReflectance = 0
                Terrain.WaterTransparency = 1
                sethiddenproperty(Terrain, "Decoration", false)
                local clouds = Terrain:FindFirstChildOfClass("Clouds")
                if clouds then clouds:Destroy() end
            end
        end)
    end
    local function ForceLowQuality()
        pcall(function()
            settings().Rendering.QualityLevel = Enum.QualityLevel.Level01
            settings().Rendering.MeshPartDetailLevel = Enum.MeshPartDetailLevel.Level01
        end)
    end
    local function MakeItUgly()
        for _, v in pairs(workspace:GetDescendants()) do
            pcall(function()
                if v:IsA("BasePart") and not v:IsA("Terrain") then
                    v.Material = Enum.Material.SmoothPlastic
                    v.Reflectance = 0
                    v.Color = Color3.fromRGB(100, 100, 100)
                    v.CastShadow = false
                    if v:IsA("MeshPart") then v.TextureID = "" end
                    for _, child in pairs(v:GetChildren()) do
                        if child:IsA("SpecialMesh") then child:Destroy() end
                    end
                end
                if v:IsA("Decal") or v:IsA("Texture") then
                    v:Destroy()
                elseif v:IsA("ParticleEmitter") or v:IsA("Trail") or v:IsA("Smoke") or v:IsA("Fire") or v:IsA("Sparkles") or v:IsA("Explosion") then
                    v:Destroy()
                elseif v:IsA("Light") then
                    v:Destroy()
                elseif v:IsA("SurfaceAppearance") then
                    v:Destroy()
                elseif v:IsA("Shirt") or v:IsA("Pants") or v:IsA("ShirtGraphic") or v:IsA("Accessory") then
                    v:Destroy()
                end
            end)
        end
    end
    local function OptimizeCharacter(char)
        if not char then return end
        task.wait(0.5)
        for _, item in pairs(char:GetChildren()) do
            pcall(function()
                if item:IsA("Accessory") or item:IsA("Shirt") or item:IsA("Pants") or item:IsA("ShirtGraphic") or item:IsA("CharacterMesh") then
                    item:Destroy()
                elseif item:IsA("BasePart") then
                    item.Color = Color3.fromRGB(100, 100, 100)
                    item.Material = Enum.Material.SmoothPlastic
                end
            end)
        end
    end
    OptimizeLightingAndSettings()
    OptimizeTerrain()
    ForceLowQuality()
    MakeItUgly()
    for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
        if player.Character then OptimizeCharacter(player.Character) end
    end
    task.spawn(function()
        while Flags.FPSBoost do
            task.wait(10)
            MakeItUgly()
            OptimizeLightingAndSettings()
        end
    end)
end

local function removeMapsLoop()
    local mapNames = {
        "DefaultMap", "ArcadeMap", "DoomMap", "FireAndIceMap",
        "MarsMap", "MoneyMap", "RadioactiveMap", "ValentineMap"
    }
    while Flags.RemoveMapsEnabled do
        local success, err = pcall(function()
            for _, name in ipairs(mapNames) do
                local map = workspace:FindFirstChild(name)
                if map then map:Destroy() end
            end
        end)
        if not success then warn("[REMOVE MAPS ERROR] " .. tostring(err)) end
        task.wait(10)
    end
    Flags.RemoveMapsThread = nil
end

do
    local MiscGroup = MiscTab:NewSection("Others", false)
    MiscGroup:Button({
        Name = "Remove VIP Walls",
        Callback = function()
            local success, err = pcall(function()
                local walls = workspace:FindFirstChild("DefaultMap_SharedInstances")
                if walls then
                    local vipWalls = walls:FindFirstChild("VIPWalls")
                    if vipWalls then
                        vipWalls:Destroy()
                        UI:Notify({ Title = "VinzHub", Content = "VIP Walls Removed!", Time = 5 })
                    else
                        UI:Notify({ Title = "VinzHub", Content = "VIP Walls already removed or not found.", Time = 5 })
                    end
                else
                    UI:Notify({ Title = "VinzHub", Content = "Map container not found.", Time = 5 })
                end
            end)
            if not success then warn("[MISC ERROR] " .. tostring(err)) end
        end
    })
    MiscGroup:Toggle({
        Name = "Enable Instant Interact",
        Flag = "InstantInteract_Toggle",
        Default = false,
        Callback = function(state)
            Flags.InstantInteractEnabled = state
            if state then
                for _, v in pairs(workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") then v.HoldDuration = 0 end
                end
            end
        end
    })
    MiscGroup:Toggle({
        Name = "FPS Boost",
        Flag = "FPSBoost_Toggle",
        Default = false,
        Callback = function(state)
            Flags.FPSBoost = state
            if state then applyExtremeFPSBoost() end
        end
    })
    MiscGroup:Toggle({
        Name = "Remove Maps",
        Flag = "RemoveMaps_Toggle",
        Default = false,
        Callback = function(state)
            Flags.RemoveMapsEnabled = state
            if state then
                if Flags.RemoveMapsThread then task.cancel(Flags.RemoveMapsThread) end
                Flags.RemoveMapsThread = task.spawn(removeMapsLoop)
                UI:Notify({ Title = "VinzHub", Content = "Remove Maps Loop Started!", Time = 3 })
            else
                if Flags.RemoveMapsThread then
                    task.cancel(Flags.RemoveMapsThread)
                    Flags.RemoveMapsThread = nil
                end
                UI:Notify({ Title = "VinzHub", Content = "Remove Maps Loop Stopped!", Time = 3 })
            end
        end
    })
end

do
    local InfoGroup = InfoTab:NewSection("Information", false)
    InfoGroup:Paragraph({
        Title = "Need Help Using Our Scripts?",
        Content = "Join our community for support, updates, and more!"
    })
    InfoGroup:Button({
        Name = "Join Discord Server",
        Callback = function()
            setclipboard("https://discord.gg/vinzhub")
            UI:Notify({ Title = "VinzHub", Content = "Discord Link Copied to Clipboard!", Time = 5 })
        end
    })
end

do
    local ConfigSection = SettingsTab:NewSection("Configuration", false)
    UI:ConfigManager(ConfigSection)
end

initDetectionCircle()
