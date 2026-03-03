import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // More robust IP extraction (preferring CF-Connecting-IP if behind Cloudflare)
        let ip = req.headers.get("cf-connecting-ip") ||
            req.headers.get("x-real-ip") ||
            "127.0.0.1";

        // If not found, try to parse x-forwarded-for
        if (ip === "127.0.0.1") {
            const forwarded = req.headers.get("x-forwarded-for");
            if (forwarded) {
                // x-forwarded-for can be a comma separated list, the first one is the real client IP
                ip = forwarded.split(',')[0].trim();
            }
        }

        console.log(`[SECURITY] IP Check Requested for: ${ip} | Headers: CF=${req.headers.get("cf-connecting-ip")} | X-Real=${req.headers.get("x-real-ip")} | X-Forwarded=${req.headers.get("x-forwarded-for")}`);

        // Localhost / Docker internal bypass
        if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
            console.log(`[SECURITY] Bypassing VPN check for local/internal IP: ${ip}`);
            return NextResponse.json({ isVpn: false, ip });
        }

        // 1. Check using blackbox.ipinfo.app (Simple Y/N for VPN/Proxy)
        const blackboxRes = await fetch(`https://blackbox.ipinfo.app/lookup/${ip}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            cache: "no-store"
        });
        const blackboxResult = await blackboxRes.text();
        const isBlackboxVpn = blackboxResult.trim() === "Y";

        // 2. Check using ip-api.com for datacenter/hosting check
        const ipApiRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting,timezone,countryCode`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            cache: "no-store"
        });
        const ipApiData = await ipApiRes.json();

        const isProxyOrHosting = ipApiData.status === "success" && (ipApiData.proxy === true || ipApiData.hosting === true);

        const isVpn = isBlackboxVpn || isProxyOrHosting;

        return NextResponse.json({
            isVpn,
            ip,
            country: ipApiData.countryCode,
            timezone: ipApiData.timezone,
            details: {
                blackbox: isBlackboxVpn,
                proxy: ipApiData.proxy,
                hosting: ipApiData.hosting
            }
        });
    } catch (e) {
        console.error("[SECURITY] Failed to check IP:", e);
        // Fail-open (or fail-close depending on strictness)
        return NextResponse.json({ isVpn: false, error: "Validation failed" });
    }
}
