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
        let isBlackboxVpn = false;
        try {
            // Some free APIs struggle with IPv6, add a slight timeout or catch
            const blackboxRes = await fetch(`https://blackbox.ipinfo.app/lookup/${ip}`, {
                headers: { "User-Agent": "Mozilla/5.0" },
                cache: "no-store",
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            if (blackboxRes.ok) {
                const blackboxResult = await blackboxRes.text();
                isBlackboxVpn = blackboxResult.trim() === "Y";
            }
        } catch (e) {
            console.warn(`[SECURITY] Blackbox check failed for ${ip}:`, e);
        }

        // 2. Check using ip-api.com for datacenter/hosting check
        let isProxy = false;
        let ipApiData: any = {};
        try {
            const ipApiRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting,timezone,countryCode`, {
                headers: { "User-Agent": "Mozilla/5.0" },
                cache: "no-store",
                signal: AbortSignal.timeout(3000)
            });
            if (ipApiRes.ok) {
                ipApiData = await ipApiRes.json();
                isProxy = ipApiData.status === "success" && ipApiData.proxy === true;
            }
        } catch (e) {
            console.warn(`[SECURITY] IP-API check failed for ${ip}:`, e);
        }

        const isVpn = isBlackboxVpn || isProxy;

        return NextResponse.json({
            isVpn,
            ip,
            country: ipApiData.countryCode || "Unknown",
            timezone: ipApiData.timezone || "Unknown",
            details: {
                blackbox: isBlackboxVpn,
                proxy: ipApiData.proxy || false,
                hosting: ipApiData.hosting || false
            }
        });
    } catch (e) {
        console.error("[SECURITY] Failed to extract IP or root error:", e);
        // Fail-open (do not block if our security tools are down)
        return NextResponse.json({ isVpn: false, error: "Validation failed, fail-open applied" });
    }
}
