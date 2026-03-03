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

-- Discord Promo GUI
local function CreateDiscordGUI()
    local inviteCode = "vinzhub"
    local discordLink = "https://discord.gg/" .. inviteCode
    
    local CoreGui = game:GetService("CoreGui")
    local Players = game:GetService("Players")
    local LocalPlayer = Players.LocalPlayer
    local HttpService = game:GetService("HttpService")
    
    local ScreenGui = Instance.new("ScreenGui")
    ScreenGui.Name = "VinzHubDiscordPromo"
    ScreenGui.Parent = (gethui and gethui()) or CoreGui or LocalPlayer:WaitForChild("PlayerGui")
    ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    ScreenGui.DisplayOrder = 999999 -- Ensure it's on top

    local MainFrame = Instance.new("Frame")
    MainFrame.Name = "MainFrame"
    MainFrame.Size = UDim2.new(0, 450, 0, 220) -- Reduced height slightly
    MainFrame.Position = UDim2.new(0.5, -225, 0.5, -110)
    MainFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    MainFrame.BorderSizePixel = 0
    MainFrame.Parent = ScreenGui

    local UICorner = Instance.new("UICorner")
    UICorner.CornerRadius = UDim.new(0, 10)
    UICorner.Parent = MainFrame

    local UIStroke = Instance.new("UIStroke")
    UIStroke.Color = Color3.fromRGB(60, 60, 60)
    UIStroke.Thickness = 2
    UIStroke.Parent = MainFrame

    local Title = Instance.new("TextLabel")
    Title.Size = UDim2.new(1, 0, 0, 50)
    Title.BackgroundTransparency = 1
    Title.Text = "VinzHub • Community"
    Title.TextColor3 = Color3.fromRGB(255, 255, 255)
    Title.TextSize = 24
    Title.Font = Enum.Font.GothamBold
    Title.Parent = MainFrame

    local Warning = Instance.new("TextLabel")
    Warning.Size = UDim2.new(1, 0, 0, 25)
    Warning.Position = UDim2.new(0, 0, 0, 40) -- Moved up slightly
    Warning.BackgroundTransparency = 1
    Warning.Text = "⚠️ FREE VERSION - NOT FOR SALE ⚠️"
    Warning.TextColor3 = Color3.fromRGB(255, 50, 50)
    Warning.TextSize = 18
    Warning.Font = Enum.Font.GothamBold
    Warning.Parent = MainFrame

    local Message = Instance.new("TextLabel")
    Message.Size = UDim2.new(1, -40, 1, -135)
    Message.Position = UDim2.new(0, 20, 0, 65) -- Moved up significantly to close the gap
    Message.BackgroundTransparency = 1
    Message.Text = "Thanks for using VinzHub, dont forget to join our Discord Server for more updates!"
    Message.TextColor3 = Color3.fromRGB(220, 220, 220)
    Message.TextSize = 18
    Message.Font = Enum.Font.GothamMedium
    Message.TextWrapped = true
    Message.Parent = MainFrame

    local ButtonContainer = Instance.new("Frame")
    ButtonContainer.Size = UDim2.new(1, -40, 0, 45)
    ButtonContainer.Position = UDim2.new(0, 20, 1, -60)
    ButtonContainer.BackgroundTransparency = 1
    ButtonContainer.Parent = MainFrame

    local JoinButton = Instance.new("TextButton")
    JoinButton.Name = "JoinButton"
    JoinButton.Size = UDim2.new(0.6, -5, 1, 0)
    JoinButton.BackgroundColor3 = Color3.fromRGB(88, 101, 242)
    JoinButton.Text = "Join Discord"
    JoinButton.TextColor3 = Color3.fromRGB(255, 255, 255)
    JoinButton.Font = Enum.Font.GothamBold
    JoinButton.TextSize = 16
    JoinButton.Parent = ButtonContainer

    local JoinCorner = Instance.new("UICorner")
    JoinCorner.CornerRadius = UDim.new(0, 6)
    JoinCorner.Parent = JoinButton

    local CloseButton = Instance.new("TextButton")
    CloseButton.Name = "CloseButton"
    CloseButton.Size = UDim2.new(0.4, -5, 1, 0)
    CloseButton.Position = UDim2.new(0.6, 5, 0, 0)
    CloseButton.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
    CloseButton.Text = "Wait (10)"
    CloseButton.TextColor3 = Color3.fromRGB(150, 150, 150)
    CloseButton.Font = Enum.Font.GothamBold
    CloseButton.TextSize = 16
    CloseButton.AutoButtonColor = false
    CloseButton.Parent = ButtonContainer

    local CloseCorner = Instance.new("UICorner")
    CloseCorner.CornerRadius = UDim.new(0, 6)
    CloseCorner.Parent = CloseButton

    -- Invite Logic
    local function JoinDiscord()
        local request = (syn and syn.request) or (http and http.request) or http_request or (Fluxus and Fluxus.request) or request
        -- Desktop RPC
        if request then
            pcall(function()
                request({
                    Url = "http://127.0.0.1:6463/rpc?v=1",
                    Method = "POST",
                    Headers = {["Content-Type"] = "application/json", ["Origin"] = "https://discord.com"},
                    Body = HttpService:JSONEncode({cmd = "INVITE_BROWSER", args = {code = inviteCode}, nonce = HttpService:GenerateGUID(false)}),
                })
            end)
        end
        -- Browser/Mobile
        if openurl then openurl(discordLink)
        elseif request then pcall(function() request({Url = discordLink, Method = "GET"}) end) end
        -- Clipboard
        if setclipboard then setclipboard(discordLink) end
        
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = "VinzHub",
            Text = "Link copied & attempting to open!",
            Duration = 5
        })
    end

    JoinButton.MouseButton1Click:Connect(JoinDiscord)

    -- Countdown Logic
    task.spawn(function()
        for i = 10, 1, -1 do -- Increased to 10
            CloseButton.Text = "Wait (" .. i .. ")"
            task.wait(1)
        end
        CloseButton.Text = "Close"
        CloseButton.TextColor3 = Color3.fromRGB(255, 255, 255)
        CloseButton.BackgroundColor3 = Color3.fromRGB(180, 50, 50)
        CloseButton.AutoButtonColor = true
        
        CloseButton.MouseButton1Click:Connect(function()
            ScreenGui:Destroy()
        end)
    end)
    
    -- Auto try join once on load
    task.spawn(JoinDiscord)
end

-- Run Discord Promo
task.spawn(CreateDiscordGUI)

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local LocalPlayer = Players.LocalPlayer
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

local Positions = {
    Vector3.new(433.3, -9.7, -336.5),
    Vector3.new(1132.5, 2.2, 521.9),
    Vector3.new(2566.7, -5.5, -337.9),
}

local Zones = {
    ["Base"]   = Vector3.new(137.6, 3.2, 24.1),
    ["Zone 1"] = Vector3.new(200.0, -2.8, 0.0),
    ["Zone 2"] = Vector3.new(284.9, -2.8, 0.0),
    ["Zone 3"] = Vector3.new(398.9, -2.8, 0.0),
    ["Zone 4"] = Vector3.new(541.5, -2.8, 0.0),
    ["Zone 5"] = Vector3.new(757.9, -2.8, 0.0),
    ["Zone 6"] = Vector3.new(1073.7, -2.8, 0.0),
    ["Zone 7"] = Vector3.new(1553.7, -2.8, 0.0),
    ["Zone 8"] = Vector3.new(2253.7, -2.8, 0.0),
    ["Zone 9"] = Vector3.new(2955.6, -2.8, -25.4),
    ["Zone 10"] = Vector3.new(3306.5, -2.8, -12.7),
    ["Zone 11"] = Vector3.new(3666.7, -2.8, -7.4),
    ["Zone 12"] = Vector3.new(4021.7, -2.8, 4.5),
}

local ZoneOrder = { "Base","Zone 1","Zone 2","Zone 3","Zone 4","Zone 5","Zone 6","Zone 7","Zone 8","Zone 9","Zone 10","Zone 11","Zone 12" }

local BrainrotRoot = nil
local LuckyBlocksRoot = nil

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

local CurrentIndex = 1
local Moving = false

local FarmMode = "Both"
local FarmThread = nil
local AutoFarmEnabled = false

local AutoSpeed = false
local AutoCarry = false
local AutoRebirth = false
local SpeedAmount = 10
local AutoSell = false
local SellDelay = 1.2
local AutoUpgradeBase = false
local AutoLockInventory = false
local LockType = "Both"
local SelectedLockBrainrots = {}
local SelectedLockMutations = {}
local SelectedLockBrainrotRarities = {}
local SelectedLockLuckyBlockRarities = {}
local BrainrotRarityMap = {}
local AutoValentine = false
local AutoCandy = false
local AutoUFOCoins = false
local AutoDoomCoins = false
local AutoDoomButtons = false
local AutoRadioactiveCoins = false
local AutoArcade = false

local FixedY = -10
local WaveDetectEnabled = true
local WaveDetectRadius = 100
local TweenSpeed = 100

local HeightBodyVelocity = nil
local RunServiceConnection = nil
local ActiveTween = nil
local ActiveAntiPhysicsConnection = nil
local SavedWalkSpeed = 16
local SavedJumpPower = 50
local HeightLockActive = false
local HeightLockValue = -10
local NoclipConnection = nil
local NoclipConnection2 = nil

local TowerBusy = false
local AutoTowerEnabled = false
local ProgressThreshold = 6
local LastCompletionState = { rarity = nil, count = 0 }
local AutoUnequip = false
local AutoUnequipThread = nil
local InstantInteractEnabled = false

local ManualCarryCapacity = 6
local UseManualCarry = true
local BrainrotsCollected = 0

local RarityPriority = {
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
}

local SelectedBrainrotRarities = {}
local SelectedLuckyBlockRarities = {}
local SelectedLuckyBlockMutations = {}
local SelectedBrainrotNames = {}

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
    for priority, rarity in ipairs(RarityPriority) do
        if rarity == rarityName then
            return priority
        end
    end
    return 999
end

local function getCarryCapacity()
    if UseManualCarry then
        return ManualCarryCapacity
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
    return ManualCarryCapacity
end

local function getCurrentCarry()
    return BrainrotsCollected
end

local function resetCarryCount()
    BrainrotsCollected = 0
end

local function addCarryCount()
    BrainrotsCollected = BrainrotsCollected + 1
end

local function resetPhysics(hrp)
    if not hrp then return end
    hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
    hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
end

local function toggleNoclip(state)
    if NoclipConnection then NoclipConnection:Disconnect() end
    if NoclipConnection2 then NoclipConnection2:Disconnect() end
    NoclipConnection = nil
    NoclipConnection2 = nil
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
        NoclipConnection = RunService.Stepped:Connect(applyNoclip)
        NoclipConnection2 = RunService.Heartbeat:Connect(applyNoclip)
    end
end

function enableHeightLock(height)
    local hrp = getHRP()
    if not hrp then return end
    HeightLockValue = height or FixedY
    HeightLockActive = true
    if HeightBodyVelocity then HeightBodyVelocity:Destroy() end
    HeightBodyVelocity = Instance.new("BodyVelocity")
    HeightBodyVelocity.Name = "FarmHeightLock"
    HeightBodyVelocity.Velocity = Vector3.new(0, 0, 0)
    HeightBodyVelocity.MaxForce = Vector3.new(0, math.huge, 0)
    HeightBodyVelocity.Parent = hrp
    if RunServiceConnection then RunServiceConnection:Disconnect() end
    RunServiceConnection = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent and HeightLockActive then
            local currentPos = hrp.Position
            if math.abs(currentPos.Y - HeightLockValue) > 0.5 then
                hrp.CFrame = CFrame.new(currentPos.X, HeightLockValue, currentPos.Z)
            end
            hrp.AssemblyLinearVelocity = Vector3.new(hrp.AssemblyLinearVelocity.X, 0, hrp.AssemblyLinearVelocity.Z)
        end
    end)
end

function disableHeightLock(forceSurface)
    HeightLockActive = false
    if HeightBodyVelocity then
        HeightBodyVelocity:Destroy()
        HeightBodyVelocity = nil
    end
    if RunServiceConnection then
        RunServiceConnection:Disconnect()
        RunServiceConnection = nil
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
    local anyActive = AutoValentine or AutoCandy or AutoArcade or AutoUFOCoins or AutoDoomCoins or AutoDoomButtons or AutoRadioactiveCoins
    toggleNoclip(anyActive)
    if anyActive then
        enableHeightLock(-1)
    else
        disableHeightLock(true)
    end
end

local function isEventPriorityActive()
    if AutoValentine then
        local f = workspace:FindFirstChild("ValentinesCoinParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if AutoCandy then
        local f = workspace:FindFirstChild("CandyEventParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if AutoArcade then
        local f = workspace:FindFirstChild("ArcadeEventConsoles")
        if f and #f:GetChildren() > 0 then return true end
    end
    if AutoUFOCoins then
        local f = workspace:FindFirstChild("UFOEventParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if AutoDoomCoins then
        local f = workspace:FindFirstChild("DoomEventParts")
        if f and #f:GetChildren() > 0 then return true end
    end
    if AutoDoomButtons then
        local f = workspace:FindFirstChild("DoomEventButtons")
        if f and #f:GetChildren() > 0 then return true end
    end
    if AutoRadioactiveCoins then
        local f = workspace:FindFirstChild("EventParts")
        if f then
            local radioactive = f:FindFirstChild("RadioactiveCoinsFolder")
            if radioactive and #radioactive:GetChildren() > 0 then return true end
        end
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
        
        local resultObj = {
            rarity = rarity,
            current = current,
            max = max,
            isFull = current and max and current >= ProgressThreshold,
            isReady = (rarity == "Ready")
        }
        
        
        return resultObj
    end)
    if s and result then return result end
    return nil
end

local function isBrainrotRarityAllowed(rarity)
    return SelectedBrainrotRarities[rarity] == true
end

local function isLuckyBlockRarityAllowed(rarity)
    return SelectedLuckyBlockRarities[rarity] == true
end

local function isLuckyBlockMutationAllowed(box)
    local hasMutationFilter = false
    for _, enabled in pairs(SelectedLuckyBlockMutations) do
        if enabled then
            hasMutationFilter = true
            break
        end
    end
    if not hasMutationFilter then return false end
    local mutAttr = box:GetAttribute("Mutation")
    if mutAttr and SelectedLuckyBlockMutations[mutAttr] then
        return true
    end
    for mutName, enabled in pairs(SelectedLuckyBlockMutations) do
        if enabled then
            local lowerName = box.Name:lower()
            local lowerMut = mutName:lower()
            if lowerMut == "lucky" then
                local cleanName = lowerName:gsub("luckyblock", "")
                if cleanName:find("lucky") then
                    return true
                end
            elseif lowerName:find(lowerMut) then
                return true
            end
        end
    end
    for mutName, enabled in pairs(SelectedLuckyBlockMutations) do
        if enabled then
            if box:FindFirstChild(mutName, true) then
                return true
            end
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
    for _, r in ipairs(RarityPriority) do
        if boxName:find(r) then
            return r
        end
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

local function isBrainrotAllowed(variant, rarityName)
    if SelectedBrainrotRarities[rarityName] then
        return true
    end
    local bName = getBrainrotName(variant)
    if bName and SelectedBrainrotNames[bName] then
        return true
    end
    return false
end

local function updateBrainrotRarityMap()
    local root = ReplicatedStorage:FindFirstChild("Assets") and ReplicatedStorage.Assets:FindFirstChild("Brainrots")
    if not root then return end
    table.clear(BrainrotRarityMap)
    for _, rarityFolder in pairs(root:GetChildren()) do
        for _, item in pairs(rarityFolder:GetChildren()) do
            BrainrotRarityMap[item.Name] = rarityFolder.Name
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
    part.Name = "WaveDetectCircle_Invisible"
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Size = Vector3.new(WaveDetectRadius * 2, WaveDetectRadius * 2, WaveDetectRadius * 2)
    part.Shape = Enum.PartType.Ball
    part.Parent = Workspace
    DetectCirclePart = part
    return part
end

local function startCircleTracking()
    if CircleConnection then
        CircleConnection:Disconnect()
    end
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
    if not WaveDetectEnabled then return false, nil end
    local hrp = getHRP()
    local waves = getActiveWaves()
    local nearestWave = nil
    local nearestDist = math.huge
    for _, wave in ipairs(waves) do
        local dist = (hrp.Position - wave.Position).Magnitude
        if dist < nearestDist then
            nearestDist = dist
            nearestWave = {
                part = wave,
                position = wave.Position,
                distance = dist
            }
        end
    end
    if nearestWave and nearestWave.distance <= WaveDetectRadius then
        return true, nearestWave
    end
    return false, nil
end

local function waitForWaveToPass()
    local waitCount = 0
    local maxWait = 200
    while waitCount < maxWait do
        local waveInRadius, _ = isWaveInRadius()
        if not waveInRadius then
            return true
        end
        task.wait(0.1)
        waitCount = waitCount + 1
    end
    return false
end

local AutoAdjustTweenSpeed = true
local ManualTweenSpeed = 50

local function getActualTweenSpeed()
    if not AutoAdjustTweenSpeed then
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
    return TweenSpeed
end

local function tweenToDive(position)
    local hrp = getHRP()
    local char = getChar()
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local originalWalkSpeed = (humanoid and humanoid.WalkSpeed or 16)
    local originalJumpPower = (humanoid and humanoid.JumpPower or 50)
    local tweenSpeed = getActualTweenSpeed()
    local startPos = hrp.Position
    local targetPos = Vector3.new(position.X, FixedY, position.Z)
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
    ActiveAntiPhysicsConnection = antiPhysicsConnection
    ActiveTween = moveTween
    moveTween:Play()
    moveTween.Completed:Wait()
    ActiveTween = nil
    antiPhysicsConnection:Disconnect()
    ActiveAntiPhysicsConnection = nil
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
    local distance = (Vector3.new(startPos.X, 0, startPos.Z) - Vector3.new(finalPos.X, 0, finalPos.Z)).Magnitude
    local tweenDuration = distance / tweenSpeed
    if tweenDuration < 0.05 then tweenDuration = 0.05 end
    if humanoid then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
        humanoid.AutoRotate = false
    end
    resetPhysics(hrp)
    hrp.CFrame = CFrame.new(startPos.X, fixedY, startPos.Z)
    local moveInfo = TweenInfo.new(tweenDuration, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, 0, false, 0)
    local moveGoal = { CFrame = CFrame.new(finalPos) }
    local moveTween = TweenService:Create(hrp, moveInfo, moveGoal)
    local antiPhysicsConnection = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent then
            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
            if math.abs(hrp.Position.Y - fixedY) > 0.5 then
                hrp.CFrame = CFrame.new(hrp.Position.X, fixedY, hrp.Position.Z)
            end
        end
        if targetPart and (not targetPart.Parent) then
            if moveTween.PlaybackState == Enum.PlaybackState.Playing then
                moveTween:Cancel()
            end
        end
    end)
    ActiveAntiPhysicsConnection = antiPhysicsConnection
    ActiveTween = moveTween
    moveTween:Play()
    moveTween.Completed:Wait()
    ActiveTween = nil
    antiPhysicsConnection:Disconnect()
    ActiveAntiPhysicsConnection = nil
    if not (targetPart and not targetPart.Parent) then
        hrp.CFrame = CFrame.new(finalPos)
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
    local targetPos = Vector3.new(currentPos.X, FixedY, currentPos.Z)
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
    local targetPos = Vector3.new(currentPos.X, FixedY, currentPos.Z)
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

local function findBestBrainrot()
    local bestBrainrot = nil
    local bestPriority = math.huge
    local brainrotRoot = getBrainrotRoot()
    if not brainrotRoot then return nil end
    local allVariants = {}
    for _, rarityFolder in pairs(brainrotRoot:GetChildren()) do
        local isRarity = false
        for _, r in ipairs(RarityPriority) do
            if rarityFolder.Name == r then isRarity = true break end
        end
        if isRarity then
            for _, container in pairs(rarityFolder:GetChildren()) do
                local rootPart = container:FindFirstChild("Root")
                if rootPart then
                    for _, item in pairs(container:GetChildren()) do
                        if item.Name ~= "Root" then
                            table.insert(allVariants, {
                                item = item,
                                rarity = rarityFolder.Name,
                                container = container,
                                rootPart = rootPart
                            })
                        end
                    end
                end
            end
        end
    end
    for _, data in pairs(allVariants) do
        local variant = data.item
        local rarity = data.rarity
        local rootPart = data.rootPart
        if isBrainrotAllowed(variant, rarity) then
            if rootPart and rootPart:IsA("BasePart") then
                local priority = getRarityPriority(rarity)
                if priority <= bestPriority then
                    bestPriority = priority
                    bestBrainrot = {
                        position = rootPart.Position,
                        rarity = rarity or variant.Name,
                        priority = priority,
                        rootPart = rootPart,
                        variant = variant
                    }
                end
            end
        end
    end
    return bestBrainrot
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
        for _, v in pairs(SelectedLuckyBlockRarities) do if v then hasRarityFilter = true break end end
        local hasMutationFilter = false
        for _, v in pairs(SelectedLuckyBlockMutations) do if v then hasMutationFilter = true break end end
        local allowed = false
        if hasRarityFilter and hasMutationFilter then
            allowed = rarityMatch or mutationMatch
        elseif hasRarityFilter then
            allowed = rarityMatch
        elseif hasMutationFilter then
            allowed = mutationMatch
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
        if a.priority ~= b.priority then
            return a.priority < b.priority
        end
        return a.distance < b.distance
    end)
    if #allBoxes > 0 then
        return allBoxes[1]
    end
    return nil
end

local function detectCurrentZone()
    local hrp = getHRP()
    local closest, idx = math.huge, 1
    for i, name in ipairs(ZoneOrder) do
        local d = (hrp.Position - Zones[name]).Magnitude
        if d < closest then
            closest, idx = d, i
        end
    end
    CurrentIndex = idx
end

local function stepForward()
    if Moving then return end
    Moving = true
    detectCurrentZone()
    if CurrentIndex < #ZoneOrder then
        CurrentIndex = CurrentIndex + 1
        tweenTo(Zones[ZoneOrder[CurrentIndex]])
    end
    Moving = false
end

local function stepBackward()
    if Moving then return end
    Moving = true
    detectCurrentZone()
    if CurrentIndex > 1 then
        CurrentIndex = CurrentIndex - 1
        tweenTo(Zones[ZoneOrder[CurrentIndex]])
    end
    Moving = false
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
            if child:IsA("ProximityPrompt") then
                prompt = child
                break
            end
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
    
    local finalPos = Vector3.new(targetPosition.X, FixedY, targetPosition.Z)
    
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
    hrp.CFrame = CFrame.new(startPos.X, FixedY, startPos.Z)
    local moveInfo = TweenInfo.new(tweenDuration, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, 0, false, 0)
    local moveTween = TweenService:Create(hrp, moveInfo, { CFrame = CFrame.new(finalPos) })
    local antiConn = RunService.Heartbeat:Connect(function()
        if hrp and hrp.Parent then
            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
            if math.abs(hrp.Position.Y - FixedY) > 0.5 then
                hrp.CFrame = CFrame.new(hrp.Position.X, FixedY, hrp.Position.Z)
            end
        end
    end)
    ActiveTween = moveTween
    moveTween:Play()
    moveTween.Completed:Wait()
    ActiveTween = nil
    antiConn:Disconnect()
    resetPhysics(hrp)
    hrp.CFrame = CFrame.new(targetPosition.X, FixedY, targetPosition.Z)
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
    while attempt < maxAttempts and AutoTowerEnabled do
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
                    hrp.CFrame = CFrame.new(bPos.X, FixedY, bPos.Z)
                    task.wait(0.3)
                end
                if not brainrot.rootPart.Parent then
                    task.wait(0.3)
                else
                    local bPrompt = brainrot.rootPart:FindFirstChild("TakePrompt")
                    if not bPrompt then
                        for _, child in pairs(brainrot.rootPart:GetDescendants()) do
                            if child:IsA("ProximityPrompt") then
                                bPrompt = child
                                break
                            end
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
    TowerBusy = false
    if ActiveTween then
        pcall(function() ActiveTween:Cancel() end)
        ActiveTween = nil
    end
    if ActiveAntiPhysicsConnection then
        ActiveAntiPhysicsConnection:Disconnect()
        ActiveAntiPhysicsConnection = nil
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
            if hum and hum.Health > 0 then
                break
            end
        end
        task.wait(0.5)
    end
    task.wait(2)
end

local function doTowerQuestLoop()
    local questDone = false
    local towerPos = nil

    local nilCounter = 0
    while AutoTowerEnabled and not questDone do
        if not isCharacterAlive() then
            cleanupTowerState()
            waitForCharacterAlive()
            enableHeightLock()
        end

        local currentPrompt = getTowerPrompt()
        if currentPrompt and (currentPrompt.ActionText or ""):lower():find("start trial") then
            break
        end

        local info = getTowerTrialInfo()

        if not info or info.isReady or not info.rarity then
            nilCounter = nilCounter + 1
            if nilCounter >= 5 then 
                break 
            end
            task.wait(1)
            continue
        end
        nilCounter = 0

        if info.isFull then
            if LastCompletionState.rarity == info.rarity and LastCompletionState.count >= 1 then
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
                local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, FixedY, towerPos.Z)).Magnitude or 999
                if dist > 15 then
                    towerTweenTo(towerPos) 
                    task.wait(1)
                else
                end
            end
            local prompt = getTowerPrompt()
            local submitAction = (prompt and prompt.ActionText or ""):lower()
            
            if prompt and (submitAction:find("complete") or submitAction:find("finish")) then
                if LastCompletionState.rarity ~= info.rarity then
                    LastCompletionState.rarity = info.rarity
                    LastCompletionState.count = 0
                end
                LastCompletionState.count = LastCompletionState.count + 1
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
                    local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, FixedY, towerPos.Z)).Magnitude or 999
                    if dist > 15 then
                        towerTweenTo(towerPos) 
                        task.wait(1)
                    else
                    end
                end
                local prompt = getTowerPrompt()
                if prompt then 
                    fireproximityprompt(prompt) 
                end
                task.wait(2)
                task.wait(1.5)
            else
                task.wait(2)
            end
        end
    end

    return questDone
end

local function towerLoop()
    while AutoTowerEnabled do
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
                TowerBusy = true
                enableHeightLock()
                if ActiveTween then
                    pcall(function() ActiveTween:Cancel() end)
                    ActiveTween = nil
                end
                if ActiveAntiPhysicsConnection then
                    ActiveAntiPhysicsConnection:Disconnect()
                    ActiveAntiPhysicsConnection = nil
                end
                doTowerQuestLoop()
                TowerBusy = false
                if AutoFarmEnabled then
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
                    LastCompletionState.rarity = nil
                    LastCompletionState.count = 0
                    if not isTowerWorthy() then
                        task.wait(3)
                    else
                        TowerBusy = true
                        enableHeightLock()
                        local towerPos = getTowerPromptPosition()
                        if towerPos then
                            local hrp = getHRP()
                            local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, FixedY, towerPos.Z)).Magnitude or 999
                            
                            if dist > 15 then
                                towerTweenTo(towerPos)
                                task.wait(1)
                            else
                            end
                            
                            for i = 1, 3 do
                                prompt = getTowerPrompt()
                                if prompt then
                                    fireproximityprompt(prompt)
                                    task.wait(1.5)
                                    local checkInfo = getTowerTrialInfo()
                                    if checkInfo and checkInfo.rarity then
                                        break
                                    end
                                end
                                if i < 3 then
                                    task.wait(1)
                                end
                            end
                            task.wait(2)
                        else
                            TowerBusy = false
                            task.wait(2)
                        end
                    end
                elseif isTrialOngoing then
                    if not isTowerWorthy() then
                        task.wait(3)
                    else
                        TowerBusy = true
                        enableHeightLock()
                        doTowerQuestLoop()
                        TowerBusy = false
                        if AutoFarmEnabled then
                            toggleNoclip(true)
                            enableHeightLock()
                            diveDown()
                        end
                    end
                elseif isCompleteTrial then
                    local currentRarity = info and info.rarity or "Unknown"
                    if LastCompletionState.rarity == currentRarity and LastCompletionState.count >= 1 then
                        task.wait(5)
                    elseif info and info.isFull then
                        TowerBusy = true
                        enableHeightLock()
                        local towerPos = getTowerPromptPosition()
                        if towerPos then
                            local hrp = getHRP()
                            local dist = hrp and (hrp.Position - Vector3.new(towerPos.X, FixedY, towerPos.Z)).Magnitude or 999
                            if dist > 15 then
                                towerTweenTo(towerPos)
                                task.wait(1)
                            else
                            end
                            prompt = getTowerPrompt()
                        end
                        if prompt then
                            if info and info.rarity then
                                if LastCompletionState.rarity ~= info.rarity then
                                    LastCompletionState.rarity = info.rarity
                                    LastCompletionState.count = 0
                                end
                                LastCompletionState.count = LastCompletionState.count + 1
                            end
                            fireproximityprompt(prompt)
                            task.wait(1.5)
                            pcall(function() TowerClaimRemote:FireServer() end)
                            task.wait(3)
                        end
                        TowerBusy = false
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
    enableHeightLock()
    diveDown()
    task.wait(0.3)
    while AutoFarmEnabled do
        if TowerBusy then
            task.wait(1)
        else
            if isEventPriorityActive() then
                if ActiveTween then
                    pcall(function() ActiveTween:Cancel() end)
                    ActiveTween = nil
                end
                disableHeightLock()
                while isEventPriorityActive() and AutoFarmEnabled do
                    task.wait(1)
                end
                if not AutoFarmEnabled then break end
                enableHeightLock()
                diveDown()
                task.wait(0.3)
            end
            local carryCapacity = getCarryCapacity()
            local currentCarry = getCurrentCarry()
            local collected = false
            if FarmMode == "Both" then
                local bestBox = findBestLuckyBox()
                if bestBox then
                    tweenToDive(bestBox.position)
                    task.wait(0.1)
                    if collectLuckyBoxItem(bestBox) then
                        collected = true
                    end
                end
                if not collected then
                    local bestBrainrot = findBestBrainrot()
                    if bestBrainrot then
                        tweenToDive(bestBrainrot.position)
                        task.wait(0.1)
                        if collectBrainrotItem(bestBrainrot) then
                            collected = true
                        end
                    end
                end
                currentCarry = getCurrentCarry()
                if currentCarry >= carryCapacity then
                    disableHeightLock()
                    local basePos = Zones["Base"]
                    tweenToDive(basePos)
                    task.wait(0.1)
                    local hrp = getHRP()
                    hrp.CFrame = CFrame.new(basePos)
                    task.wait(0.5)
                    resetCarryCount()
                    enableHeightLock()
                    diveDown()
                end
            elseif FarmMode == "Brainrot" then
                local bestBrainrot = findBestBrainrot()
                if bestBrainrot then
                    tweenToDive(bestBrainrot.position)
                    task.wait(0.1)
                    if collectBrainrotItem(bestBrainrot) then
                        collected = true
                    end
                end
                currentCarry = getCurrentCarry()
                if currentCarry >= carryCapacity then
                    disableHeightLock()
                    local basePos = Zones["Base"]
                    tweenToDive(basePos)
                    task.wait(0.1)
                    local hrp = getHRP()
                    hrp.CFrame = CFrame.new(basePos)
                    task.wait(0.5)
                    resetCarryCount()
                    enableHeightLock()
                    diveDown()
                end
            elseif FarmMode == "LuckyBox" then
                local bestBox = findBestLuckyBox()
                if bestBox then
                    tweenToDive(bestBox.position)
                    task.wait(0.1)
                    if collectLuckyBoxItem(bestBox) then
                        collected = true
                    end
                end
                currentCarry = getCurrentCarry()
                if currentCarry >= carryCapacity then
                    disableHeightLock()
                    local basePos = Zones["Base"]
                    tweenToDive(basePos)
                    task.wait(0.1)
                    local hrp = getHRP()
                    hrp.CFrame = CFrame.new(basePos)
                    task.wait(0.5)
                    resetCarryCount()
                    enableHeightLock()
                    diveDown()
                end
            end
            if not collected then
                task.wait(1)
            else
                task.wait(0.3)
            end
            task.wait(0.1)
        end
    end
end

local function autoUnequipLoop()
    while AutoUnequip do
        local char = getChar()
        if char then
            local tool = char:FindFirstChildOfClass("Tool")
            if tool then
                local humanoid = char:FindFirstChildOfClass("Humanoid")
                if humanoid then
                    humanoid:UnequipTools()
                end
            end
        end
        task.wait(0.5)
    end
end

local function resetAll()
    Moving = false
    resetCarryCount()
    TowerBusy = false
    if FarmThread then
        pcall(function() task.cancel(FarmThread) end)
        FarmThread = nil
    end
    if TowerThread then
        pcall(function() task.cancel(TowerThread) end)
        TowerThread = nil
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
    if AutoFarmEnabled then
        FarmThread = task.spawn(farmLoop)
    end
    if AutoTowerEnabled then
        TowerThread = task.spawn(towerLoop)
    end
end)

ProximityPromptService.PromptShown:Connect(function(prompt)
    if InstantInteractEnabled then
        prompt.HoldDuration = 0
    end
end)

task.spawn(function()
    while task.wait(0.6) do
        if AutoSpeed then
            pcall(function() UpgradeSpeed:InvokeServer(SpeedAmount) end)
        end
    end
end)

task.spawn(function()
    while task.wait(0.8) do
        if AutoCarry then
            pcall(function() UpgradeCarry:InvokeServer() end)
        end
    end
end)

task.spawn(function()
    while task.wait(2) do
        if AutoRebirth then
            pcall(function() RebirthRemote:InvokeServer() end)
        end
    end
end)

task.spawn(function()
    while true do
        if AutoSell then
            pcall(function() SellRemote:InvokeServer() end)
        end
        task.wait(SellDelay)
    end
end)

task.spawn(function()
    while true do
        if AutoValentine then
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

local function isCandyFull()
    local success, result = pcall(function()
        local hud = LocalPlayer.PlayerGui:FindFirstChild("HUD")
        if hud then
            local bottom = hud:FindFirstChild("BottomLeft")
            if bottom then
                for _, child in pairs(bottom:GetDescendants()) do
                    if child.Name == "Value" and child:IsA("TextLabel") then
                        if child.Text:match("100/100") then
                            return true
                        end
                    end
                end
            end
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
        task.wait(0.5)
        local prompts = station:FindFirstChild("Prompts")
        if prompts then
            local prompt = prompts:FindFirstChild("ProximityPrompt")
            if prompt then
                fireproximityprompt(prompt)
                task.wait(1)
            end
        end
    end
end

local JustSubmitted = false

task.spawn(function()
    while true do
        if AutoCandy then
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
        if AutoArcade then
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
        if AutoUFOCoins then
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
        if AutoDoomCoins then
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
        if AutoDoomButtons then
            local folder = workspace:FindFirstChild("DoomEventButtons")
            if folder then
                local targetPart = getNearestTargetHelper(folder)
                if targetPart then
                    local targetY = math.min(targetPart.Position.Y, -1)
                    enableHeightLock(targetY)
                    tweenToFixedY(targetPart.Position, targetY, targetPart)
                    while targetPart.Parent and AutoDoomButtons do
                        local hrp = getHRP()
                        local hum = getHumanoid()
                        if hrp and hum then
                            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
                            hrp.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
                            hum.WalkSpeed = 0
                            hrp.CFrame = CFrame.new(hrp.Position.X, targetY, hrp.Position.Z)
                            local prompt = targetPart:FindFirstChildWhichIsA("ProximityPrompt", true)
                            if prompt then
                                fireproximityprompt(prompt)
                            end
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
        if AutoRadioactiveCoins then
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

task.spawn(function()
    while true do
        if AutoUpgradeBase then
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
            if LockType == "Lucky Block Only" and not isLB then continue end
            if LockType == "Brainrot Only" and not isBR then continue end
            local shouldLock = false
            if isBR then
                local rarity = BrainrotRarityMap[brainrotName] or "Unknown"
                local mutation = item:GetAttribute("Mutation") or "None"
                if SelectedLockBrainrots[brainrotName] then
                    shouldLock = true
                end
                if not shouldLock then
                    if SelectedLockBrainrotRarities[rarity] or SelectedLockMutations[mutation] then
                        shouldLock = true
                    end
                end
            elseif isLB then
                local rarity = lbType or "Unknown"
                local displayName = item:GetAttribute("DisplayName") or item.Name
                local cleanName = displayName:gsub("%s*%b()", ""):gsub("%s*Block%s*", "")
                local parts = string.split(cleanName, " ")
                local mutation = "None"
                if #parts >= 2 then
                    mutation = parts[1]
                end
                if not SelectedLockMutations[mutation] and mutation ~= "None" then
                    mutation = "None"
                end
                if SelectedLockLuckyBlockRarities[rarity] or SelectedLockMutations[mutation] then
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
        if AutoLockInventory then
            local s, e = pcall(lockItems)
            if not s then
                warn("[LOCK ERROR] " .. tostring(e))
            end
        end
        task.wait(0.5)
    end
end)

local UnlimitedJumpEnabled = false
local JumpConnection = nil

local function enableUnlimitedJump()
    if JumpConnection then
        JumpConnection:Disconnect()
        JumpConnection = nil
    end
    JumpConnection = UserInputService.JumpRequest:Connect(function()
        if UnlimitedJumpEnabled then
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
local AutoCollectSpecificBase = false
local CollectDelay = 0
local CollectRepeatDelay = 10

local function isMyBase(base)
    local success, result = pcall(function()
        return base.Title.TitleGui.Frame.PlayerName.Text
    end)
    if success and result then
        if result == LocalPlayer.Name or result == LocalPlayer.DisplayName then
            return true
        end
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
                if v:IsA("TextLabel") and v.Text == LocalPlayer.Name then
                    return true
                end
            end
            return false
        end)
        if success2 and result2 then return true end
    end
    return false
end

local function findMyBase()
    for _, base in pairs(BasesFolder:GetChildren()) do
        if isMyBase(base) then
            return base
        end
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
                    if collected then
                        task.wait(CollectDelay)
                    end
                end
            end
        end
    end
end

task.spawn(function()
    while true do
        if AutoCollectSpecificBase then
            pcall(autoCollectMyBase)
        end
        task.wait(CollectRepeatDelay)
    end
end)

WaveDetectEnabled = true

local FarmGroup = MainTab:NewSection("Auto Farm", false)

FarmGroup:Dropdown({
    Name = "Farm Mode",
    Flag = "FarmMode_Dropdown",
    Search = true,
    List = { "Both", "Brainrot Only", "Lucky Block Only" },
    Default = "Both",
    Callback = function(value)
        if value == "Both" then
            FarmMode = "Both"
            UI:Notify({ Title = "Mode", Content = "Both Mode Selected", Time = 2 })
        elseif value == "Brainrot Only" then
            FarmMode = "Brainrot"
            UI:Notify({ Title = "Mode", Content = "Brainrot Mode Selected", Time = 2 })
        elseif value == "Lucky Block Only" then
            FarmMode = "LuckyBox"
            UI:Notify({ Title = "Mode", Content = "Lucky Box Mode Selected", Time = 2 })
        end
    end
})

FarmGroup:Dropdown({
    Name = "Select Brainrot Rarities",
    Flag = "SelectBrainrotRarities_Dropdown",
    Search = true,
    List = RarityPriority,
    Multi = true,
    Default = {},
    Callback = function(selected)
        for k in pairs(SelectedBrainrotRarities) do
            SelectedBrainrotRarities[k] = false
        end
        for _, r in ipairs(selected) do
            SelectedBrainrotRarities[r] = true
        end
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
        for k in pairs(SelectedLuckyBlockRarities) do
            SelectedLuckyBlockRarities[k] = false
        end
        for _, r in ipairs(selected) do
            SelectedLuckyBlockRarities[r] = true
        end
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
        for k in pairs(SelectedLuckyBlockMutations) do
            SelectedLuckyBlockMutations[k] = false
        end
        for _, m in ipairs(selected) do
            SelectedLuckyBlockMutations[m] = true
        end
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
        for k in pairs(SelectedBrainrotNames) do
            SelectedBrainrotNames[k] = false
        end
        for _, name in ipairs(selected) do
            SelectedBrainrotNames[name] = true
        end
    end
})

local function stopFarmCleanup()
    if ActiveTween then
        pcall(function() ActiveTween:Cancel() end)
        ActiveTween = nil
    end
    if ActiveAntiPhysicsConnection then
        ActiveAntiPhysicsConnection:Disconnect()
        ActiveAntiPhysicsConnection = nil
    end
    disableHeightLock()
    local char = getChar()
    local hrp = getHRP()
    local humanoid = char and char:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.WalkSpeed = SavedWalkSpeed
        humanoid.JumpPower = SavedJumpPower
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
        AutoFarmEnabled = state
        if state then
            local char = getChar()
            local humanoid = char and char:FindFirstChildOfClass("Humanoid")
            SavedWalkSpeed = (humanoid and humanoid.WalkSpeed > 0) and humanoid.WalkSpeed or 16
            SavedJumpPower = (humanoid and humanoid.JumpPower or 50)
            if not FarmThread then
                FarmThread = task.spawn(farmLoop)
            end
            UI:Notify({ Title = "Farm", Content = "Auto Farm Started", Time = 2 })
        else
            if FarmThread then
                pcall(function() task.cancel(FarmThread) end)
                FarmThread = nil
            end
            stopFarmCleanup()
            UI:Notify({ Title = "Farm", Content = "Auto Farm Stopped", Time = 2 })
        end
    end
})

do
    local FarmSettingsGroup = MainTab:NewSection("Farm Settings", false)

    FarmSettingsGroup:Textbox({
        Name = "Carry Capacity",
        Flag = "CarryCapacity_Textbox",
        Placeholder = "1 - 6",
        Default = "3",
        Callback = function(value)
            local num = tonumber(value)
            if num then
                ManualCarryCapacity = num
            end
        end
    })

    FarmSettingsGroup:Toggle({
        Name = "Auto Unequip Items",
        Flag = "AutoUnequip_Toggle",
        Default = false,
        Callback = function(state)
            AutoUnequip = state
            if state then
                if not AutoUnequipThread then
                    AutoUnequipThread = task.spawn(autoUnequipLoop)
                end
            else
                if AutoUnequipThread then
                    pcall(function() task.cancel(AutoUnequipThread) end)
                    AutoUnequipThread = nil
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
            AutoAdjustTweenSpeed = state
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
        if AutoAdjustTweenSpeed then
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
            AutoTowerEnabled = state
            if state then
                if not TowerThread then
                    TowerThread = task.spawn(towerLoop)
                end
                UI:Notify({ Title = "Tower", Content = "Auto Tower Trial Started", Time = 2 })
            else
                if TowerThread then
                    pcall(function() task.cancel(TowerThread) end)
                    TowerThread = nil
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
        Max = 12,
        Default = 6,
        Callback = function(value)
            ProgressThreshold = value
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
            AutoValentine = value
            updateEventFarmState()
        end
    })

    EventGroup:Toggle({
        Name = "Auto Collect Candy + Submit Candy",
        Flag = "AutoCandy_Toggle",
        Default = false,
        Callback = function(value)
            AutoCandy = value
            updateEventFarmState()
        end
    })

    local ArcadeGroup = EventTab:NewSection("Arcade Event", false)

    ArcadeGroup:Toggle({
        Name = "Auto Collect Arcade Consoles",
        Flag = "AutoArcade_Toggle",
        Default = false,
        Callback = function(value)
            AutoArcade = value
            updateEventFarmState()
        end
    })

    local UFOGroup = EventTab:NewSection("UFO Event", false)

    UFOGroup:Toggle({
        Name = "Auto Collect UFO Coins",
        Flag = "AutoUFOCoins_Toggle",
        Default = false,
        Callback = function(v)
            AutoUFOCoins = v
            updateEventFarmState()
        end
    })

    local DoomGroup = EventTab:NewSection("Doom Event", false)

    DoomGroup:Toggle({
        Name = "Auto Collect Doom Coins",
        Flag = "AutoDoomCoins_Toggle",
        Default = false,
        Callback = function(v)
            AutoDoomCoins = v
            updateEventFarmState()
        end
    })

    DoomGroup:Toggle({
        Name = "Auto Press Doom Buttons",
        Flag = "AutoDoomButtons_Toggle",
        Default = false,
        Callback = function(v)
            AutoDoomButtons = v
            updateEventFarmState()
        end
    })

    local RadioactiveGroup = EventTab:NewSection("Radioactive Event", false)

    RadioactiveGroup:Toggle({
        Name = "Auto Collect Radioactive Coins",
        Flag = "AutoRadioactiveCoins_Toggle",
        Default = false,
        Callback = function(v)
            AutoRadioactiveCoins = v
            updateEventFarmState()
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
            UnlimitedJumpEnabled = state
            if state then
                enableUnlimitedJump()
            end
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
            if part.Name ~= "CollisionPart" then
                part.CanCollide = true
            end
            part.Anchored = false
        end
        if part.Name == "HumanoidRootPart" or part.Name == "CollisionPart" then
            for _, child in pairs(part:GetChildren()) do
                if child:IsA("Decal") or child:IsA("Texture") then
                    child:Destroy()
                end
            end
        end
    end
end

local function DisableGodMode(teleportBack)
    for _, conn in pairs(GodConnections) do
        conn:Disconnect()
    end
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
    if GodRealHRP:FindFirstChild("AntiGravity") then
        GodRealHRP.AntiGravity:Destroy()
    end
    GodRealHRP.Velocity = Vector3.new(0, 0, 0)
    GodRealHRP.RotVelocity = Vector3.new(0, 0, 0)
    if teleportBack and targetCFrame then
        GodRealHRP.CFrame = targetCFrame
    end
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
        if v:IsA("Script") or v:IsA("LocalScript") then
            v:Destroy()
        end
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
        if part:IsA("BasePart") then
            part.CanCollide = false
        end
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
            if part:IsA("BasePart") or part:IsA("Decal") or part:IsA("Texture") then
                part.Transparency = 1
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
    if input.KeyCode == GodModeKey then
        ToggleGodMode()
    end
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
            if state ~= godModeEnabled then
                ToggleGodMode()
            end
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
        Callback = function(v) AutoSpeed = v end
    })

    UpgradeGroup:Dropdown({
        Name = "Speed Amount",
        Flag = "SpeedAmount_Dropdown",
        Search = true,
        List = { "1","5","10" },
        Default = "10",
        Callback = function(v) SpeedAmount = tonumber(v) end
    })

    UpgradeGroup:Toggle({
        Name = "Auto Upgrade Carry",
        Flag = "AutoUpgradeCarry_Toggle",
        Default = false,
        Callback = function(v) AutoCarry = v end
    })

    UpgradeGroup:Toggle({
        Name = "Auto Upgrade Base",
        Flag = "AutoUpgradeBase_Toggle",
        Default = false,
        Callback = function(v) AutoUpgradeBase = v end
    })
end

do
    local RebirthGroup = AutomaticTab:NewSection("Auto Rebirth", false)

    RebirthGroup:Toggle({
        Name = "Auto Rebirth",
        Flag = "AutoRebirth_Toggle",
        Default = false,
        Callback = function(v) AutoRebirth = v end
    })
end

do
    local SellGroup = AutomaticTab:NewSection("Auto Sell", false)

    SellGroup:Toggle({
        Name = "Auto Sell All Brainrot",
        Flag = "AutoSell_Toggle",
        Default = false,
        Callback = function(v) AutoSell = v end
    })

    SellGroup:Textbox({
        Name = "Delay (s)",
        Flag = "SellDelay_Textbox",
        Placeholder = "60",
        Default = "60",
        Callback = function(text, enter)
            local val = tonumber(text)
            if val and val > 0 then
                SellDelay = val
            end
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
            AutoCollectSpecificBase = state
        end
    })

    BaseGroup:Textbox({
        Name = "Delay (s)",
        Flag = "BaseCollectDelay_Textbox",
        Placeholder = "10",
        Default = "10",
        Callback = function(text, enter)
            local num = tonumber(text)
            if num and num >= 0 then
                CollectRepeatDelay = num
            end
        end
    })
end

do
    local LockGroup = AutomaticTab:NewSection("Inventory Lock", false)

    LockGroup:Toggle({
        Name = "Auto Lock Inventory",
        Flag = "AutoLockInventory_Toggle",
        Default = false,
        Callback = function(v) AutoLockInventory = v end
    })

    LockGroup:Dropdown({
        Name = "Lock Type",
        Flag = "LockType_Dropdown",
        List = {"Both", "Lucky Block Only", "Brainrot Only"},
        Default = "Both",
        Callback = function(v) LockType = v end
    })

    LockGroup:Dropdown({
        Name = "Select by Rarity for Lucky Block",
        Flag = "LockLuckyBlockRarities_Dropdown",
        List = GetLuckyBlockRarityList(),
        Multi = true,
        Search = true,
        Default = {},
        Callback = function(selected)
            for k in pairs(SelectedLockLuckyBlockRarities) do SelectedLockLuckyBlockRarities[k] = false end
            for _, r in ipairs(selected) do SelectedLockLuckyBlockRarities[r] = true end
        end
    })

    LockGroup:Dropdown({
        Name = "Select by Rarity for Brainrot",
        Flag = "LockBrainrotRarities_Dropdown",
        List = RarityPriority,
        Multi = true,
        Search = true,
        Default = {},
        Callback = function(selected)
            for k in pairs(SelectedLockBrainrotRarities) do SelectedLockBrainrotRarities[k] = false end
            for _, r in ipairs(selected) do SelectedLockBrainrotRarities[r] = true end
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
            for k in pairs(SelectedLockBrainrots) do SelectedLockBrainrots[k] = false end
            for _, name in ipairs(selected) do SelectedLockBrainrots[name] = true end
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
            for k in pairs(SelectedLockMutations) do SelectedLockMutations[k] = false end
            for _, name in ipairs(selected) do SelectedLockMutations[name] = true end
        end
    })
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
            if not success then
                warn("[MISC ERROR] " .. tostring(err))
            end
        end
    })

    MiscGroup:Toggle({
        Name = "Enable Instant Interact",
        Flag = "InstantInteract_Toggle",
        Default = false,
        Callback = function(state)
            InstantInteractEnabled = state
            if state then
                for _, v in pairs(workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") then
                        v.HoldDuration = 0
                    end
                end
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