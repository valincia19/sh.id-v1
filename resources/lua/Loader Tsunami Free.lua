-- =================================================================
-- ScriptHub Loader v2
-- Powered by scripthub.id
-- =================================================================

local Config = {
    -- [ Configuration ] --
    ScriptTitle = "VinzHub Key System Free", -- Title displayed to users in the UI
    Version = "1.0",                   -- Your script version

    -- [ ScriptHub Integration ] --
    ScriptID    = "7057201d-b062-421e-9a52-30af4c39e825",                      -- Your Script UUID from scripthub.id/studio (required)

    -- [ Target Script ] --
    LoadURL     = "https://api.scripthub.id/v1/5a01134e2c4779b1a90fd5261126d08e.lua",                      -- URL of the script to execute after validation

    -- [ Get Key & Socials ] --
    GetKeyLink  = "https://scripthub.id/s/eb8f66b4ba2cb23e",                      -- e.g. "https://getkey.scripthub.id/your-slug"
    DiscordLink = "https://discord.gg/vinzhub",

    -- [ UI Theming (Zinc Palette) ] --
    Colors = {
        Background    = Color3.fromHex("#09090b"),
        BackgroundAlt = Color3.fromHex("#18181b"),
        Glass         = Color3.fromHex("#27272a"),
        GlassHover    = Color3.fromHex("#3f3f46"),
        Accent        = Color3.fromHex("#fafafa"),
        AccentHover   = Color3.fromHex("#e4e4e7"),
        Text          = Color3.fromHex("#fafafa"),
        TextMuted     = Color3.fromHex("#a1a1aa"),
        TextDim       = Color3.fromHex("#71717a"),
        Border        = Color3.fromHex("#27272a"),
        Success       = Color3.fromRGB(34, 197, 94),
        Error         = Color3.fromRGB(239, 68, 68),
    }
}

-- =================================================================
-- Services
-- =================================================================
local HttpService    = game:GetService("HttpService")
local Players        = game:GetService("Players")
local TweenService   = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local Player    = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

-- Prevent duplicate UI
for _, gui in pairs(PlayerGui:GetChildren()) do
    if gui.Name == "ScriptHubLoader" then gui:Destroy() end
end

-- =================================================================
-- Helpers
-- =================================================================
local function Tween(obj, props, duration, style, direction)
    local info = TweenInfo.new(duration or 0.25, style or Enum.EasingStyle.Quint, direction or Enum.EasingDirection.Out)
    return TweenService:Create(obj, info, props)
end

local function Create(class, props)
    local el = Instance.new(class)
    for k, v in pairs(props) do el[k] = v end
    return el
end

-- =================================================================
-- HWID Detection & Executor Info
-- =================================================================
local function GetSystemInfo()
    local hwid = nil
    local executor = nil

    pcall(function()
        if gethwid then
            hwid = gethwid()
        elseif getexecutorname and game:GetService("RbxAnalyticsService") then
            hwid = game:GetService("RbxAnalyticsService"):GetClientId()
        end
    end)
    
    pcall(function()
        if identify then
            executor = identify()
        elseif getexecutorname then
            executor = getexecutorname()
        else
            executor = "Unknown Executor"
        end
    end)
    
    return hwid, executor
end

-- =================================================================
-- HTTP Request (multi-executor support)
-- =================================================================
local function DoRequest(url, method, headers, body)
    if request then
        return request({ Url = url, Method = method, Headers = headers, Body = body })
    elseif http_request then
        return http_request({ Url = url, Method = method, Headers = headers, Body = body })
    elseif syn and syn.request then
        return syn.request({ Url = url, Method = method, Headers = headers, Body = body })
    elseif fluxus and fluxus.request then
        return fluxus.request({ Url = url, Method = method, Headers = headers, Body = body })
    end
    return nil
end

-- =================================================================
-- Validate Key via ScriptHub API v2
-- =================================================================
local function ValidateKey(keyValue)
    keyValue = keyValue:gsub("%s+", "")
    if keyValue == "" then
        return false, "Key cannot be empty."
    end

    if Config.ScriptID == "" then
        return false, "ScriptID is not configured."
    end

    local hwid, executor = GetSystemInfo()

    local payload = {
        key            = keyValue,
        scriptId       = Config.ScriptID,
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
            HttpService:JSONEncode(payload)
        )
    end)

    if not ok or not response then
        return false, "HTTP request failed. Your executor may not support HTTP."
    end

    local parseOk, data = pcall(function()
        return HttpService:JSONDecode(response.Body)
    end)

    if not parseOk or not data then
        return false, "Invalid response from server."
    end

    if data.valid then
        return true, data.message or "Key is valid!"
    else
        return false, data.message or "Invalid or expired key."
    end
end

-- =================================================================
-- Load Target Script
-- =================================================================
local function LoadScript()
    if Config.LoadURL == "" then
        return false, "LoadURL is not configured."
    end

    local ok, source = pcall(function()
        return game:HttpGet(Config.LoadURL)
    end)

    if not ok or not source then
        return false, "Failed to download script."
    end

    local fn, err = loadstring(source)
    if not fn then
        return false, "Script compile error."
    end

    task.spawn(function()
        -- Inject runtime token so Tsunami Free.lua allows execution
        _G.VinzHub_LoaderToken = "VH_" .. tostring(HttpService:GenerateGUID(false))
        
        local execOk, execErr = pcall(fn)
        if not execOk then
            warn("[ScriptHub] Runtime error: " .. tostring(execErr))
        end
    end)

    return true, "Script loaded!"
end

-- =================================================================
-- User Interface
-- =================================================================
local function CreateUI()
    local C = Config.Colors

    local Gui = Create("ScreenGui", {
        Name = "ScriptHubLoader",
        ResetOnSpawn = false,
        ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
        Parent = PlayerGui
    })

    local Main = Create("Frame", {
        Name = "Main",
        Size = UDim2.new(0, 360, 0, 0),
        Position = UDim2.new(0.5, 0, 0.5, 0),
        AnchorPoint = Vector2.new(0.5, 0.5),
        BackgroundColor3 = C.Background,
        BackgroundTransparency = 0.05,
        BorderSizePixel = 0,
        ClipsDescendants = true,
        Parent = Gui
    })
    Create("UICorner", { CornerRadius = UDim.new(0, 12), Parent = Main })
    Create("UIStroke", { Color = C.Border, Thickness = 1, Transparency = 0.5, Parent = Main })

    -- Header
    local Header = Create("Frame", {
        Size = UDim2.new(1, 0, 0, 48),
        BackgroundTransparency = 1,
        Parent = Main
    })

    Create("TextLabel", {
        Size = UDim2.new(1, -100, 1, 0),
        Position = UDim2.new(0, 20, 0, 0),
        BackgroundTransparency = 1,
        Text = Config.ScriptTitle,
        TextColor3 = C.Text,
        TextSize = 14,
        Font = Enum.Font.GothamBold,
        TextXAlignment = Enum.TextXAlignment.Left,
        Parent = Header
    })

    local CloseBtn = Create("TextButton", {
        Size = UDim2.new(0, 28, 0, 28),
        Position = UDim2.new(1, -12, 0.5, 0),
        AnchorPoint = Vector2.new(1, 0.5),
        BackgroundColor3 = C.Glass,
        BackgroundTransparency = 0.5,
        Text = "X",
        TextColor3 = C.TextMuted,
        Font = Enum.Font.GothamBold,
        TextSize = 12,
        AutoButtonColor = false,
        Parent = Header
    })
    Create("UICorner", { CornerRadius = UDim.new(0, 6), Parent = CloseBtn })

    local VersionBadge = Create("TextLabel", {
        Size = UDim2.new(0, 40, 0, 16),
        Position = UDim2.new(1, -50, 0.5, 0),
        AnchorPoint = Vector2.new(1, 0.5),
        BackgroundColor3 = C.Glass,
        BackgroundTransparency = 0.3,
        Text = "v" .. Config.Version,
        TextColor3 = C.TextMuted,
        TextSize = 10,
        Font = Enum.Font.GothamMedium,
        Parent = Header
    })
    Create("UICorner", { CornerRadius = UDim.new(0, 4), Parent = VersionBadge })

    -- Divider
    Create("Frame", {
        Size = UDim2.new(1, -40, 0, 1),
        Position = UDim2.new(0, 20, 0, 48),
        BackgroundColor3 = C.Border,
        BackgroundTransparency = 0.5,
        BorderSizePixel = 0,
        Parent = Main
    })

    -- Content
    local Content = Create("Frame", {
        Size = UDim2.new(1, -40, 1, -60),
        Position = UDim2.new(0, 20, 0, 56),
        BackgroundTransparency = 1,
        Parent = Main
    })

    -- Input row
    local InputRow = Create("Frame", {
        Size = UDim2.new(1, 0, 0, 38),
        BackgroundTransparency = 1,
        Parent = Content
    })

    local InputFrame = Create("Frame", {
        Size = UDim2.new(1, -85, 1, 0),
        BackgroundColor3 = C.Glass,
        BackgroundTransparency = 0.4,
        BorderSizePixel = 0,
        ClipsDescendants = true,
        Parent = InputRow
    })
    Create("UICorner", { CornerRadius = UDim.new(0, 8), Parent = InputFrame })
    local InputStroke = Create("UIStroke", { Color = C.Border, Thickness = 1, Transparency = 0.6, Parent = InputFrame })

    local KeyInput = Create("TextBox", {
        Size = UDim2.new(1, -16, 1, 0),
        Position = UDim2.new(0, 8, 0, 0),
        BackgroundTransparency = 1,
        Text = "",
        PlaceholderText = "Enter your license key...",
        TextColor3 = C.Text,
        PlaceholderColor3 = C.TextDim,
        Font = Enum.Font.Gotham,
        TextSize = 12,
        TextXAlignment = Enum.TextXAlignment.Left,
        ClearTextOnFocus = false,
        Parent = InputFrame
    })

    local ValidateBtn = Create("TextButton", {
        Size = UDim2.new(0, 80, 1, 0),
        Position = UDim2.new(1, 0, 0, 0),
        AnchorPoint = Vector2.new(1, 0),
        BackgroundColor3 = C.Accent,
        Text = "Validate",
        TextColor3 = C.Background,
        Font = Enum.Font.GothamBold,
        TextSize = 13,
        AutoButtonColor = false,
        Parent = InputRow
    })
    Create("UICorner", { CornerRadius = UDim.new(0, 8), Parent = ValidateBtn })

    -- Action row
    local ActionsRow = Create("Frame", {
        Size = UDim2.new(1, 0, 0, 32),
        Position = UDim2.new(0, 0, 0, 48),
        BackgroundTransparency = 1,
        Parent = Content
    })

    local GetKeyBtn = Create("TextButton", {
        Size = UDim2.new(0.5, -4, 1, 0),
        BackgroundColor3 = C.BackgroundAlt,
        Text = "Get Key",
        TextColor3 = C.Text,
        Font = Enum.Font.GothamMedium,
        TextSize = 12,
        AutoButtonColor = false,
        Parent = ActionsRow
    })
    Create("UICorner", { CornerRadius = UDim.new(0, 6), Parent = GetKeyBtn })
    Create("UIStroke", { Color = C.Border, Thickness = 1, Transparency = 0.5, Parent = GetKeyBtn })

    local DiscordBtn = Create("TextButton", {
        Size = UDim2.new(0.5, -4, 1, 0),
        Position = UDim2.new(1, 0, 0, 0),
        AnchorPoint = Vector2.new(1, 0),
        BackgroundColor3 = C.BackgroundAlt,
        Text = "Join Discord",
        TextColor3 = C.Text,
        Font = Enum.Font.GothamMedium,
        TextSize = 12,
        AutoButtonColor = false,
        Parent = ActionsRow
    })
    Create("UICorner", { CornerRadius = UDim.new(0, 6), Parent = DiscordBtn })
    Create("UIStroke", { Color = C.Border, Thickness = 1, Transparency = 0.5, Parent = DiscordBtn })

    -- Notification system
    local function Notify(msg, isSuccess)
        local color = isSuccess and C.Success or C.Error

        local Notif = Create("Frame", {
            Size = UDim2.new(0, 280, 0, 44),
            Position = UDim2.new(1, 100, 1, -150),
            AnchorPoint = Vector2.new(1, 1),
            BackgroundColor3 = C.Background,
            BackgroundTransparency = 0.05,
            Parent = Gui
        })
        Create("UICorner", { CornerRadius = UDim.new(0, 8), Parent = Notif })
        Create("UIStroke", { Color = C.Border, Thickness = 1, Transparency = 0.5, Parent = Notif })

        Create("Frame", {
            Size = UDim2.new(0, 3, 0.6, 0),
            Position = UDim2.new(0, 8, 0.5, 0),
            AnchorPoint = Vector2.new(0, 0.5),
            BackgroundColor3 = color,
            BorderSizePixel = 0,
            Parent = Notif
        })

        Create("TextLabel", {
            Size = UDim2.new(1, -24, 1, 0),
            Position = UDim2.new(0, 20, 0, 0),
            BackgroundTransparency = 1,
            Text = msg,
            TextColor3 = C.Text,
            TextSize = 12,
            Font = Enum.Font.Gotham,
            TextXAlignment = Enum.TextXAlignment.Left,
            TextTruncate = Enum.TextTruncate.AtEnd,
            Parent = Notif
        })

        Tween(Notif, { Position = UDim2.new(1, -16, 1, -150) }, 0.3):Play()
        task.delay(2.5, function()
            if Notif and Notif.Parent then
                Tween(Notif, { Position = UDim2.new(1, 100, 1, -150) }, 0.25):Play()
                task.wait(0.25)
                Notif:Destroy()
            end
        end)
    end

    -- Hover effects
    local function AddHover(btn, normal, hover)
        btn.MouseEnter:Connect(function() Tween(btn, { BackgroundColor3 = hover }, 0.15):Play() end)
        btn.MouseLeave:Connect(function() Tween(btn, { BackgroundColor3 = normal }, 0.15):Play() end)
    end

    CloseBtn.MouseEnter:Connect(function()
        Tween(CloseBtn, { BackgroundColor3 = C.Error, BackgroundTransparency = 0.2, TextColor3 = C.Text }, 0.15):Play()
    end)
    CloseBtn.MouseLeave:Connect(function()
        Tween(CloseBtn, { BackgroundColor3 = C.Glass, BackgroundTransparency = 0.5, TextColor3 = C.TextMuted }, 0.15):Play()
    end)
    CloseBtn.MouseButton1Click:Connect(function()
        Tween(Main, { Size = UDim2.new(0, 360, 0, 0) }, 0.2):Play()
        task.wait(0.2)
        Gui:Destroy()
    end)

    AddHover(ValidateBtn, C.Accent, C.AccentHover)
    AddHover(GetKeyBtn, C.BackgroundAlt, C.GlassHover)
    AddHover(DiscordBtn, C.BackgroundAlt, C.GlassHover)

    KeyInput.Focused:Connect(function() Tween(InputStroke, { Color = C.Accent, Transparency = 0 }, 0.2):Play() end)
    KeyInput.FocusLost:Connect(function() Tween(InputStroke, { Color = C.Border, Transparency = 0.6 }, 0.2):Play() end)

    -- Validate button click
    local debounce = false
    ValidateBtn.MouseButton1Click:Connect(function()
        if debounce then return end
        debounce = true

        local key = KeyInput.Text
        if key == "" then
            Notify("Please enter a key.", false)
            debounce = false
            return
        end

        ValidateBtn.Text = "..."
        task.wait(0.3)

        local valid, msg = ValidateKey(key)

        if valid then
            Notify(msg, true)
            ValidateBtn.Text = "Loading..."
            task.wait(0.5)

            local loadOk, loadMsg = LoadScript()
            if loadOk then
                Notify(loadMsg, true)
                task.wait(0.8)
                Tween(Main, { Size = UDim2.new(0, 360, 0, 0) }, 0.25):Play()
                task.wait(0.25)
                Gui:Destroy()
            else
                Notify(loadMsg, false)
                ValidateBtn.Text = "Validate"
                debounce = false
            end
        else
            Notify(msg, false)
            ValidateBtn.Text = "Validate"
            debounce = false
        end
    end)

    -- Action buttons
    GetKeyBtn.MouseButton1Click:Connect(function()
        if Config.GetKeyLink ~= "" then
            setclipboard(Config.GetKeyLink)
            Notify("Get Key link copied!", true)
        else
            Notify("Get Key link not configured.", false)
        end
    end)

    DiscordBtn.MouseButton1Click:Connect(function()
        if Config.DiscordLink ~= "" then
            setclipboard(Config.DiscordLink)
            Notify("Discord link copied!", true)
        else
            Notify("Discord link not configured.", false)
        end
    end)

    -- Dragging
    local dragging, dragInput, dragStart, startPos

    Header.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = Main.Position
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)

    Header.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
            dragInput = input
        end
    end)

    UserInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            local delta = input.Position - dragStart
            Main.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
        end
    end)

    -- Open animation
    Tween(Main, { Size = UDim2.new(0, 360, 0, 145) }, 0.35, Enum.EasingStyle.Back):Play()
end

-- =================================================================
-- Entry Point
-- =================================================================
local autoKey = script_key or _G.script_key or _G.ScriptHubKey

if autoKey and type(autoKey) == "string" and #autoKey > 0 then
    local valid, msg = ValidateKey(autoKey)
    if valid then
        LoadScript()
    else
        warn("[ScriptHub] Auto-validate failed: " .. msg)
        CreateUI()
    end
else
    pcall(CreateUI)
end
