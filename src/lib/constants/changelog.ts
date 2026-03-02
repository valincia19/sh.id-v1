export type ChangelogCategory = "Added" | "Improved" | "Changed" | "Fixed" | "Security" | "Infrastructure";

export interface ChangelogItem {
    category: ChangelogCategory;
    items: string[];
}

export interface ChangelogRelease {
    version: string;
    title: string;
    date: string;       // e.g. "March 01, 2026"
    description: string;
    isLatest: boolean;
    changes: ChangelogItem[];
}

export const CHANGELOG_DATA: ChangelogRelease[] = [
    {
        version: "v1.1.0",
        title: "Full Beta Summary",
        date: "March 02, 2026",
        description: "Comprehensive overview of the ScriptHub platform infrastructure, security protocols, and core features implemented during the beta phase.",
        isLatest: true,
        changes: [
            {
                category: "Added",
                items: [
                    "Creator Studio allowing developers to publish, edit, and manage ROBLOX scripts with markdown-supported descriptions and thumbnails.",
                    "Hub Management system to group related scripts under dedicated organizational pages.",
                    "Executor Compatibility tagging system to explicitly declare which executors are supported per script.",
                    "Comprehensive API ecosystem for fetching trending scripts, searching, and managing user metadata.",
                    "Admin Dashboard with full CRUD capabilities over Users, Scripts, Hubs, Executors, and Deployments.",
                    "Official Gateway multi-checkpoint key system tailored to support platform monetization while offering a seamless user experience.",
                    "YouTube video preview integration (`youtube-nocookie.com/embed/`) for script detail pages to showcase script capabilities.",
                    "Public Legal pages including comprehensive Terms of Service and Privacy Policy.",
                    "Responsive Global Footer containing links to resources, legal pages, and official social media (Discord, TikTok, Instagram, X)."
                ]
            },
            {
                category: "Improved",
                items: [
                    "Improved loading speeds for the `getfreekey` subdomain with optimized asset delivery.",
                    "Refined API rate limit headers and reduced latency for initial key verification checks.",
                    "Redesigned the `getfreekey.scripthub.id` waiting UI with modern gradients, responsive typography, and clear script status indicators.",
                    "Removed redundant background animations to improve performance on low-end mobile devices.",
                    "Enhanced visual countdown timers for the Official Gateway checkpoint stages."
                ]
            },
            {
                category: "Changed",
                items: [
                    "Replaced Next.js `<Image>` components with standard `<img>` tags in the Navigation Header and Auth Modal to resolve SVG aspect ratio squishing.",
                    "Simplified Studio Key Settings by removing hardcoded ad network fields (Linkvertise/Work.ink), allowing creators to input custom direct Key URLs.",
                    "Extracted static changelog HTML into dynamic TS constants to allow for scalable and maintainable release notes."
                ]
            },
            {
                category: "Fixed",
                items: [
                    "Fixed \"Get Key\" buttons routing to incorrect URLs (`undefined/[slug]`) by rectifying the backend configuration variables.",
                    "Resolved a \"429 Too Many Requests\" infinite loop on the Studio `/studio/keys` page caused by a missing dependency array in the React `useEffect` bounds.",
                    "Fixed SVG logo aspect ratios and resizing behaviors on mobile and tablet viewports."
                ]
            },
            {
                category: "Security",
                items: [
                    "Integrated advanced bot protection (Cloudflare Turnstile) for Authentication limits and Key System checkpoints.",
                    "Implemented robust cryptographic signature validation to strictly bind Key System sessions to the user's specific browser and device.",
                    "Deployed comprehensive Role-Based Access Control (RBAC) to secure all administrative endpoints and actions.",
                    "Enforced strict backend parameter validation and payload sanitation to prevent code injection and cross-site scripting attacks.",
                    "Enhanced data protection by ensuring all sensitive credentials are computationally hashed and omitted from backend responses."
                ]
            },
            {
                category: "Infrastructure",
                items: [
                    "Implemented edge routing and middleware to isolate and optimize the secure key generation subdomain.",
                    "Configured strict Cross-Origin Resource Sharing (CORS) policies to protect internal service communication.",
                    "Deployed dynamic rate-limiting thresholds across sensitive API endpoints to mitigate brute-force attempts and ensure platform stability.",
                    "Established a zero-downtime database migration architecture for smooth, uninterrupted platform updates.",
                    "Optimized the production environment by removing unused backend packages, significantly reducing the server footprint and potential attack surface."
                ]
            }
        ]
    }
];
