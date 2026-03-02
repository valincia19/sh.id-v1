/**
 * Get the correct base URL for getfreekey subdomain redirects.
 * Handles both getfreekey.localhost:3000 (dev) and getfreekey.scripthub.id (prod).
 */
export function getFreeKeyBaseUrl(): string {
    if (typeof window !== 'undefined') {
        const currentHost = window.location.hostname;
        if (currentHost.includes('getfreekey.')) {
            return window.location.origin;
        } else {
            const domainParts = currentHost.split('.');
            if (domainParts.length > 1) {
                const mainDomain = domainParts.slice(
                    domainParts.indexOf('localhost') !== -1 ? domainParts.indexOf('localhost') : 0
                ).join('.');
                return `http://getfreekey.${mainDomain}`;
            }
            return `http://getfreekey.${currentHost}`;
        }
    }
    return 'http://getfreekey.localhost:3000';
}
