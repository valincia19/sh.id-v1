import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get("cf-connecting-ip") ||
            req.headers.get("x-real-ip") ||
            req.headers.get("x-forwarded-for")?.split(',')[0].trim() ||
            "127.0.0.1";

        // Localhost bypass
        if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
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
