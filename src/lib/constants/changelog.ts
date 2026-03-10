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
        version: "v1.2.1",
        title: "Studio Improvements & Bug Fixes",
        date: "March 10, 2026",
        description: "Resolved critical state management issues in the Studio's script publishing flow.",
        isLatest: true,
        changes: [
            {
                category: "Added",
                items: [
                    "Studio auto-prepends `script_key = \"YOUR_KEY\"` to the deployment loadstring preview when key validation is enabled.",
                    "Backend automatic image processing: All uploads (avatars, thumbnails, banners) are now automatically converted to WebP and compressed for faster load times.",
                ]
            },
            {
                category: "Improved",
                items: [
                    "Studio editing screen now accurately hydrates its toggles based on whether a script previously utilized a deployment loader.",
                    "Increased image upload limit to 20MB to accommodate high-resolution original assets before server-side compression.",
                ]
            },
            {
                category: "Fixed",
                items: [
                    "Resolved a backend omission that caused all newly created scripts to default to 'Draft' status regardless of user selection.",
                    "Resolved an issue where disabling the 'Include Loader' toggle failed to actually clear the loader URL from the database.",
                    "Fixed Studio 'Script Views' chart rendering where bars would appear empty due to CSS height resolution issues.",
                    "Corrected chart date alignment to use local browser time, ensuring analytic accuracy across different timezones.",
                    "Fixed critical `removeChild` hydration error on public script pages caused by DOM mutations from browser extensions.",
                ]
            }
        ]
    },
    {
        version: "v1.2.0",
        title: "Script Protection & Universal Support",
        date: "March 09, 2026",
        description: "Major update introducing multi-layer script protection, universal executor compatibility for mobile and desktop, and deployment experience improvements.",
        isLatest: false,
        changes: [
            {
                category: "Added",
                items: [
                    "Multi-layer protection architecture with encrypted script delivery.",
                    "Polymorphic system: server randomly selects from multiple variants per deployment.",
                    "Monthly protection quota system with per-plan usage tracking.",
                    "Real-time usage display showing remaining and total limits.",
                    "Quick access button after successful protection to view your deployments.",
                    "Admin panel for managing internal scripts and variants.",
                    "Automatic compatibility layer for executors that lack certain built-in libraries.",
                ]
            },
            {
                category: "Improved",
                items: [
                    "Universal request handling with multi-method fallback for broader support.",
                    "Universal device identification with multiple detection methods.",
                    "Safe execution wrapper with fallbacks for restricted environments.",
                    "Deployment timestamps now show exact date and time.",
                    "Fresh protection support: get a new variant from the original script at any time.",
                ]
            },
            {
                category: "Fixed",
                items: [
                    "Fixed execution errors on mobile executors caused by missing standard libraries.",
                    "Fixed decryption failures when standard math libraries are unavailable: now uses a built-in fallback.",
                    "Fixed development mode serving outdated logic without proper error handling.",
                    "Fixed minor variable issue in authentication flow.",
                ]
            },
            {
                category: "Security",
                items: [
                    "Challenge/verify authentication system for device verification before delivery.",
                    "Encoded variable injection to prevent exposure of endpoints and keys.",
                    "Environment detection: only verified executors can access protected content.",
                    "Automatic cleanup of temporary runtime variables after initialization.",
                ]
            },
            {
                category: "Infrastructure",
                items: [
                    "Short-lived secure links for time-limited access.",
                    "Server-side compatibility injection: no manual updates needed for new support.",
                    "Request caching to absorb traffic spikes without overloading services.",
                    "Automatic deployment usage tracking for analytics.",
                ]
            }
        ]
    },
    {
        version: "v1.1.0",
        title: "Full Beta Summary",
        date: "March 02, 2026",
        description: "Comprehensive overview of the platform infrastructure, security protocols, and core features.",
        isLatest: false,
        changes: [
            {
                category: "Added",
                items: [
                    "Studio features allowing developers to publish and manage content with descriptions and thumbnails.",
                    "Organization system to group related items under dedicated pages.",
                    "Compatibility tagging system to declare supported environments.",
                    "Comprehensive ecosystem for fetching trending items and searching.",
                    "Admin Dashboard with full management capabilities.",
                    "Official Gateway multi-checkpoint system for platform support while offering a seamless experience.",
                    "Video preview integration for detail pages to showcase capabilities.",
                    "Public Legal pages including Terms of Service and Privacy Policy.",
                    "Responsive Global Footer containing links to resources and social media."
                ]
            },
            {
                category: "Improved",
                items: [
                    "Improved loading speeds for dedicated subdomains with optimized delivery.",
                    "Refined rate limit headers and reduced latency for initial verification checks.",
                    "Redesigned the waiting UI with modern gradients and clear status indicators.",
                    "Removed redundant background animations to improve performance on low-end devices.",
                    "Enhanced visual countdown timers for gateway stages."
                ]
            },
            {
                category: "Changed",
                items: [
                    "Replaced specific layout components with standard tags to resolve aspect ratio issues.",
                    "Simplified settings by removing hardcoded third-party fields, allowing custom direct links.",
                    "Extracted static data into dynamic constants to allow for scalable release notes."
                ]
            },
            {
                category: "Fixed",
                items: [
                    "Fixed button routing issues by rectifying configuration variables.",
                    "Resolved infinite loop issues on management pages caused by logic bounds.",
                    "Fixed logo aspect ratios and resizing behaviors on mobile viewports."
                ]
            },
            {
                category: "Security",
                items: [
                    "Integrated advanced bot protection for authentication limits and checkpoints.",
                    "Implemented robust signature validation to strictly bind sessions to specific devices.",
                    "Deployed comprehensive access control to secure all administrative actions.",
                    "Enforced strict parameter validation and payload sanitation to prevent attacks.",
                    "Enhanced data protection by ensuring all sensitive credentials are computationally hidden."
                ]
            },
            {
                category: "Infrastructure",
                items: [
                    "Implemented edge routing and middleware to isolate and optimize secure subdomains.",
                    "Configured strict cross-origin policies to protect internal communication.",
                    "Deployed dynamic rate-limiting thresholds across sensitive endpoints to ensure stability.",
                    "Established a zero-downtime migration architecture for smooth updates.",
                    "Optimized the production environment by removing unused components, significantly reducing the footprint."
                ]
            }
        ]
    }
];
