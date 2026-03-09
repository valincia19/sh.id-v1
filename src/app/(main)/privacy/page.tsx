export const metadata = {
    title: "Privacy Policy",
    description: "Privacy Policy for ScriptHub.id",
};

export default function PrivacyPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <section className="space-y-1.5 border-b border-white/[0.06] pb-6">
                <h1 className="heading-base text-2xl text-offgray-50">Privacy Policy</h1>
                <p className="text-sm text-offgray-500">
                    Last updated: March 2026
                </p>
            </section>

            {/* Content */}
            <div className="space-y-8 text-[13px] text-offgray-300 leading-relaxed">

                <section className="space-y-3">
                    <p>
                        At ScriptHub, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (scripthub.id) or use our services.
                    </p>
                    <p>
                        Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">1. Information We Collect</h2>
                    <p>We collect information that you voluntarily provide to us when you register on the site, express an interest in obtaining information about us or our products and services, or otherwise contact us.</p>

                    <h3 className="text-sm font-medium text-offgray-200 mt-4">Personal Data</h3>
                    <ul className="list-disc pl-5 space-y-2 text-offgray-400">
                        <li><strong>Account Information:</strong> Username, email address (optional for some registration methods), display name, and password.</li>
                        <li><strong>Third-Party Logins:</strong> If you register using Discord, we collect your Discord ID, username, and avatar URL.</li>
                        <li><strong>Profile Data:</strong> Avatars, bio descriptions, and linked social accounts that you choose to display.</li>
                    </ul>

                    <h3 className="text-sm font-medium text-offgray-200 mt-4">Automatically Collected Data</h3>
                    <ul className="list-disc pl-5 space-y-2 text-offgray-400">
                        <li><strong>Device & Usage Data:</strong> IP addresses, browser types, operating systems, referring URLs, device information, and pages viewed. We use this to maintain system security and identify bots.</li>
                        <li><strong>Key System Data:</strong> When utilizing the "Get Key" system, we may log encrypted hardware identifiers (HWID) or IP hashes to prevent abuse, enforce cooldowns, and prevent key sharing.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">2. How We Use Your Information</h2>
                    <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
                    <ul className="list-disc pl-5 space-y-2 text-offgray-400">
                        <li>Create and manage your account.</li>
                        <li>Compile anonymous statistical data and analysis for use internally to improve the platform.</li>
                        <li>Deliver targeted advertising, key system checkpoints, and promotional materials.</li>
                        <li>Monitor and analyze usage and trends to improve your experience.</li>
                        <li>Prevent fraudulent transactions, automated scraping, monitor against theft, and protect against criminal activity.</li>
                        <li>Resolve disputes and troubleshoot problems.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">3. Cookies and Tracking Technologies</h2>
                    <p>
                        We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site to help customize the Site and improve your experience. For example:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-offgray-400">
                        <li><strong>Authentication Cookies:</strong> Used to keep you logged in between sessions safely using HTTP-only cookies.</li>
                        <li><strong>Security Tokens:</strong> Used in our Key Systems (like Cloudflare Turnstile) to verify that you are a human and not a bot attempting to brute-force checkpoints.</li>
                    </ul>
                    <p>You can remove or reject cookies using your browser settings, but be aware that such action could affect the availability and functionality of the Site (e.g., you will be unable to log in or complete Key Checkpoints).</p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">4. Third-Party Websites and Advertising</h2>
                    <p>
                        The Site securely redirects you to third-party ad networks (such as Linkvertise or Work.ink) as part of our monetization system. We do not control these third-party websites and are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party website you visit.
                    </p>
                    <p>
                        Our platform heavily utilizes Google Analytics and Cloudflare for security and traffic monitoring.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">5. Data Security</h2>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. Passwords are securely hashed using bcrypt. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">6. Contact Us</h2>
                    <p>
                        If you have questions or comments about this Privacy Policy, or if you would like us to delete your account entirely, please join our Discord server and open a support ticket.
                    </p>
                </section>

            </div>
        </div>
    );
}
