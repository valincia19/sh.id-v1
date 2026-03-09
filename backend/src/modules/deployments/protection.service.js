import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../config/s3.js";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";

// ============================================
// Token / HMAC helpers
// ============================================

const SECRET = config.jwtSecret || "scripthub-protection-secret";

/**
 * Generate a one-time token for HWID verification.
 * Token = HMAC-SHA256(deployKey + hwid + timestamp)
 * Valid for `ttl` seconds (default 60).
 */
export function generateToken(deployKey, hwid, timestamp) {
    const payload = `${deployKey}:${hwid}:${timestamp}`;
    return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

/**
 * Verify a token is valid and not expired.
 */
export function verifyToken(deployKey, hwid, timestamp, token, ttlSeconds = 60) {
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(timestamp, 10) > ttlSeconds) {
        return { valid: false, reason: "Token expired" };
    }

    // Recompute and compare
    const expected = generateToken(deployKey, hwid, timestamp);
    const isValid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));

    return { valid: isValid, reason: isValid ? "OK" : "Invalid token" };
}

// ============================================
// RC4 Script Encryption
// ============================================

/**
 * Encrypts raw Lua script content using the RC4 algorithm.
 * Converts strings to UTF-8 bytes before encryption to handle Unicode safely,
 * and returns the final encrypted payload as a Hex string to guarantee
 * cross-platform Lua compatibility in the game client.
 *
 * @param {string} scriptContent - The raw Lua script
 * @param {string} deployKey - The dynamic encryption key
 * @returns {string} Hex encoded encrypted payload
 */
export function encryptScript(scriptContent, deployKey) {
    const textBytes = Buffer.from(scriptContent, "utf8");
    const keyBytes = Buffer.from(deployKey, "utf8");

    const s = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        s[i] = i;
    }

    let j = 0;
    for (let i = 0; i < 256; i++) {
        j = (j + s[i] + keyBytes[i % keyBytes.length]) % 256;
        const temp = s[i];
        s[i] = s[j];
        s[j] = temp;
    }

    let i = 0;
    j = 0;
    const result = new Uint8Array(textBytes.length);
    for (let y = 0; y < textBytes.length; y++) {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        const temp = s[i];
        s[i] = s[j];
        s[j] = temp;
        // XOR the string byte with the keystream
        result[y] = textBytes[y] ^ s[(s[i] + s[j]) % 256];
    }

    return Buffer.from(result).toString("hex");
}

// ============================================
// S3 Signed URL generation
// ============================================

/**
 * Generate a short-lived presigned S3 URL for the real script content.
 * @param {string} s3Key - The S3 key of the deployment
 * @param {number} ttlSeconds - How long the URL is valid (default 30s)
 * @returns {Promise<string>} The presigned URL
 */
export async function generateSignedUrl(s3Key, ttlSeconds = 30) {
    const command = new GetObjectCommand({
        Bucket: config.s3.bucketScripts,
        Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: ttlSeconds });
    return url;
}

// ============================================
// Pure-Lua bit32 polyfill for mobile executors (Delta, etc.)
// Only activates when bit32 is nil in the executor environment.
// ============================================
const BIT32_POLYFILL = `if not bit32 then
bit32={}
local floor=math.floor
local MOD=4294967296
local function mask(w)return w%MOD end
local function _bxor(a,b)local r,p=0,1;for i=0,31 do local x,y=a%2,b%2;if x~=y then r=r+p end;a=floor(a/2);b=floor(b/2);p=p*2 end;return r end
local function _band(a,b)local r,p=0,1;for i=0,31 do if a%2==1 and b%2==1 then r=r+p end;a=floor(a/2);b=floor(b/2);p=p*2 end;return r end
local function _bor(a,b)local r,p=0,1;for i=0,31 do if a%2==1 or b%2==1 then r=r+p end;a=floor(a/2);b=floor(b/2);p=p*2 end;return r end
local function _bnot(a)return mask(MOD-1-a)end
function bit32.bxor(a,b,...)a=mask(a or 0);b=mask(b or 0);local r=_bxor(a,b);if select("#",...)>0 then for i=1,select("#",...)do r=_bxor(r,mask(select(i,...)))end end;return r end
function bit32.band(a,b,...)a=mask(a or 0);b=mask(b or 0);local r=_band(a,b);if select("#",...)>0 then for i=1,select("#",...)do r=_band(r,mask(select(i,...)))end end;return r end
function bit32.bor(a,b,...)a=mask(a or 0);b=mask(b or 0);local r=_bor(a,b);if select("#",...)>0 then for i=1,select("#",...)do r=_bor(r,mask(select(i,...)))end end;return r end
function bit32.bnot(a)return _bnot(mask(a or 0))end
function bit32.lshift(a,n)a=mask(a or 0);n=n or 0;if n<0 then return bit32.rshift(a,-n)end;if n>=32 then return 0 end;return mask(a*(2^n))end
function bit32.rshift(a,n)a=mask(a or 0);n=n or 0;if n<0 then return bit32.lshift(a,-n)end;if n>=32 then return 0 end;return floor(a/(2^n))end
function bit32.lrotate(a,n)a=mask(a or 0);n=n%32;if n==0 then return a end;return _bor(mask(a*(2^n)),floor(a/(2^(32-n))))end
function bit32.rrotate(a,n)a=mask(a or 0);n=n%32;if n==0 then return a end;return _bor(floor(a/(2^n)),mask(a*(2^(32-n))))end
function bit32.countlz(a)a=mask(a or 0);if a==0 then return 32 end;local n=0;if a<=0x0000FFFF then n=n+16;a=a*65536 end;if a<=0x00FFFFFF then n=n+8;a=a*256 end;if a<=0x0FFFFFFF then n=n+4;a=a*16 end;if a<=0x3FFFFFFF then n=n+2;a=a*4 end;if a<=0x7FFFFFFF then n=n+1 end;return n end
function bit32.countrz(a)a=mask(a or 0);if a==0 then return 32 end;local n=0;while a%2==0 do n=n+1;a=floor(a/2)end;return n end
end;`;

// ============================================
// Stub Generator (prepend _G globals + obfuscated code)
// ============================================

// Cache the obfuscated stub in memory (read once from disk)
let _cachedObfuscatedStub = null;

function getObfuscatedStub() {
    if (_cachedObfuscatedStub) return _cachedObfuscatedStub;

    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const stubPath = path.join(__dirname, "stub-obfuscated.lua");
        _cachedObfuscatedStub = fs.readFileSync(stubPath, "utf-8");
        logger.info("Loaded obfuscated stub from %s (%d bytes)", stubPath, _cachedObfuscatedStub.length);
    } catch (err) {
        logger.warn("Could not load obfuscated stub, falling back to plain stub: %o", err);
        _cachedObfuscatedStub = null;
    }

    return _cachedObfuscatedStub;
}

/**
 * Clear the in-memory cache for the obfuscated stub.
 * Used when an admin updates the script via the dashboard.
 */
export function clearStubCache() {
    _cachedObfuscatedStub = null;
    logger.info("Cleared obfuscated stub cache");
}

/**
 * Generate the Lua stub script that will be served to executors.
 *
 * Approach: Prepend _G global assignments with the dynamic deploy key
 * and API URL, then append the obfuscated stub code which reads from
 * these globals.
 *
 * @param {string} deployKey - The deployment key
 * @param {string} apiBaseUrl - The API base URL (e.g. https://api.scripthub.id)
 * @returns {string} Lua source code (prepend + obfuscated)
 */
export function generateStub(deployKey, apiBaseUrl) {
    const obfuscatedStub = getObfuscatedStub();

    // Encode strings as Lua byte sequences to prevent exposure
    const enc = (str) => [...str].map(c => "\\" + c.charCodeAt(0)).join("");
    const prepend = `_G["${enc("__SH_API")}"]="${enc(apiBaseUrl)}";_G["${enc("__SH_KEY")}"]="${enc(deployKey)}";`;

    if (obfuscatedStub) {
        return prepend + "\n" + BIT32_POLYFILL + "\n" + obfuscatedStub;
    }

    // Fallback: plain text stub (for development/testing when no obfuscated file exists)
    logger.warn("Serving PLAIN TEXT stub for %s — obfuscate stub.lua with Luraph for production!", deployKey);
    return `${prepend}
local function http_get(url)
    local ok, res = pcall(function() return game:HttpGet(url) end)
    if ok and res then return res end
    if syn and syn.request then
        local s, r = pcall(function() return syn.request({Url=url,Method="GET"}).Body end)
        if s and r then return r end
    end
    if http_request then
        local s, r = pcall(function() return http_request({Url=url,Method="GET"}).Body end)
        if s and r then return r end
    end
    if request then
        local s, r = pcall(function() return request({Url=url,Method="GET"}).Body end)
        if s and r then return r end
    end
    return nil
end
local function get_hwid()
    local ok, hwid = pcall(function() return game:GetService("RbxAnalyticsService"):GetClientId() end)
    if ok and hwid and hwid ~= "" then return hwid end
    if gethwid then local s,r = pcall(gethwid); if s and r then return r end end
    return "sh_universal"
end
local _loadstring = loadstring or (syn and syn.loadstring) or (getgenv and getgenv().loadstring)
local HttpService = game:GetService("HttpService")
local API_BASE = _G.__SH_API
local DEPLOY_KEY = _G.__SH_KEY
_G.__SH_API = nil
_G.__SH_KEY = nil
if not API_BASE or not DEPLOY_KEY then return end
local hwid = get_hwid()
local cRes = http_get(API_BASE.."/v1/challenge?key="..DEPLOY_KEY.."&hwid="..hwid)
if not cRes then return end
local ok, cData = pcall(function() return HttpService:JSONDecode(cRes) end)
if not ok or not cData or not cData.token then return end
local vRes = http_get(API_BASE.."/v1/verify?key="..DEPLOY_KEY.."&hwid="..hwid.."&ts="..cData.ts.."&token="..cData.token)
if not vRes then return end
local vok, vData = pcall(function() return HttpService:JSONDecode(vRes) end)
if not vok or not vData then return end
if vData.loaderUrl then
    local lc = http_get(vData.loaderUrl)
    if lc then local fn = _loadstring(lc); if fn then fn() end end
elseif vData.payload then
    local function bxor_fb(a,b) local r=0; for i=0,7 do local x,y=a%2,b%2; if x~=y then r=r+2^i end; a=math.floor(a/2); b=math.floor(b/2) end; return r end
    local bxor = (bit32 and bit32.bxor) or (bit and bit.bxor) or bxor_fb
    local function rc4(key, hex)
        local data = hex:gsub("..", function(cc) return string.char(tonumber(cc,16)) end)
        local s = {}; for i=0,255 do s[i]=i end; local j=0
        for i=0,255 do j=(j+s[i]+key:sub((i%#key)+1,(i%#key)+1):byte())%256; s[i],s[j]=s[j],s[i] end
        local i=0; j=0; local out={}
        for y=1,#data do i=(i+1)%256; j=(j+s[i])%256; s[i],s[j]=s[j],s[i]; out[y]=string.char(bxor(data:sub(y,y):byte(),s[(s[i]+s[j])%256])) end
        return table.concat(out)
    end
    local sok, dec = pcall(function() return rc4(DEPLOY_KEY, vData.payload) end)
    if sok and dec then local fn = _loadstring(dec); if fn then fn() end end
end
`;
}

// ============================================
// Loader Pool (50 pre-obfuscated loaders)
// ============================================

let _cachedLoaders = null;

/**
 * Load all pre-obfuscated loaders from the loaders/ directory into memory.
 * @returns {string[]} Array of loader file contents
 */
function loadLoaderPool() {
    if (_cachedLoaders && _cachedLoaders.length > 0) return _cachedLoaders;

    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const loadersDir = path.join(__dirname, "loaders");

        const files = fs.readdirSync(loadersDir)
            .filter(f => f.endsWith(".lua") && f.startsWith("loader-"))
            .sort();

        if (files.length === 0) {
            logger.warn("No loaders found in %s — using raw loader.lua as fallback", loadersDir);
            // Fallback: read the un-obfuscated loader.lua
            const rawLoader = fs.readFileSync(path.join(__dirname, "loader.lua"), "utf-8");
            _cachedLoaders = [rawLoader];
            return _cachedLoaders;
        }

        _cachedLoaders = files.map(f => fs.readFileSync(path.join(loadersDir, f), "utf-8"));
        logger.info("Loaded %d obfuscated loaders from %s", _cachedLoaders.length, loadersDir);
    } catch (err) {
        logger.error("Failed to load loader pool: %o", err);
        _cachedLoaders = [];
    }

    return _cachedLoaders;
}

/**
 * Pick a random loader from the pool.
 * @returns {string} Content of a random loader file
 */
export function getRandomLoader() {
    const pool = loadLoaderPool();
    if (pool.length === 0) {
        throw new Error("No loaders available in pool");
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Clear the loader pool cache (e.g. when admin uploads new loaders).
 */
export function clearLoaderCache() {
    _cachedLoaders = null;
    logger.info("Cleared loader pool cache");
}

/**
 * Generate the final loader text with injected _G globals.
 * This is what users see as their "obfuscated" output.
 * Globals are byte-encoded to prevent human-readable exposure of
 * the deploy key and script URL.
 *
 * @param {string} deployKey - The decryption key for RC4
 * @param {string} scriptUrl - The full URL to the encrypted script on CDN
 * @returns {string} Loader code with prepended globals
 */
export function generateLoaderText(deployKey, scriptUrl) {
    const loader = getRandomLoader();

    // Encode strings as Lua byte sequences: "abc" → "\97\98\99"
    const luaByteEncode = (str) => {
        return [...str].map(c => "\\" + c.charCodeAt(0)).join("");
    };

    const encodedKeyName = luaByteEncode("__SH_DKEY");
    const encodedScriptName = luaByteEncode("__SH_SCRIPT");
    const encodedKeyValue = luaByteEncode(deployKey);
    const encodedScriptValue = luaByteEncode(scriptUrl);

    const prepend = `_G["${encodedKeyName}"]="${encodedKeyValue}";_G["${encodedScriptName}"]="${encodedScriptValue}";`;
    return prepend + "\n" + BIT32_POLYFILL + "\n" + loader;
}

