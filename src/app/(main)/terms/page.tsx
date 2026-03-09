export const metadata = {
    title: "Terms of Service",
    description: "Terms of Service for using ScriptHub.id",
};

export default function TermsPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <section className="space-y-1.5 border-b border-white/[0.06] pb-6">
                <h1 className="heading-base text-2xl text-offgray-50">Terms of Service</h1>
                <p className="text-sm text-offgray-500">
                    Last updated: March 2026
                </p>
            </section>

            {/* Content */}
            <div className="space-y-8 text-[13px] text-offgray-300 leading-relaxed">

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using ScriptHub (scripthub.id), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. These Terms apply to all visitors, users, developers, and others who access or use the platform.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">2. Description of Service</h2>
                    <p>
                        ScriptHub is a platform that allows users to discover, share, publish, and monetize code snippets ("scripts") designed for third-party applications. We provide the infrastructure for hosting metadata, monetizing access via key systems, and facilitating community interaction.
                    </p>
                    <p>
                        We do not create, endorse, or guarantee the safety or functionality of any user-uploaded scripts. Users download and execute third-party code strictly at their own risk.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">3. User Accounts & Responsibilities</h2>
                    <ul className="list-disc pl-5 space-y-2 text-offgray-400">
                        <li>You must be at least 13 years old to use this service.</li>
                        <li>You are responsible for safeguarding the password that you use to access the service.</li>
                        <li>You agree not to disclose your password to any third party.</li>
                        <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                        <li>You are strictly prohibited from using automated systems (bots, scrapers) to interact with the platform without express written permission.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">4. Content & Intellectual Property</h2>
                    <p>
                        <strong className="text-offgray-200">User Content:</strong> By uploading scripts, tutorials, comments, or any other content ("Content"), you grant ScriptHub a non-exclusive, worldwide, royalty-free license to use, reproduce, adapt, publish, and display such Content solely for the purpose of operating the Service.
                    </p>
                    <p>
                        <strong className="text-offgray-200">Ownership:</strong> You retain all ownership rights to your original code. However, you represent and warrant that you own or have the necessary licenses, rights, and permissions to publish the Content you submit. Submitting plagiarized work or code violating third-party licenses (e.g., GPL, MIT) is strictly prohibited.
                    </p>
                    <p>
                        <strong className="text-offgray-200">DMCA Takedowns:</strong> We respect intellectual property rights and will respond to alleged copyright infringement notices that comply with applicable laws.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">5. Monetization & Key Systems</h2>
                    <p>
                        ScriptHub relies on monetization to keep the platform running. Developers are free to utilize our built-in Key System (which currently supports platform maintenance and future creator monetization) or integrate their own third-party key systems to monetize their work, subject to the following rules:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-offgray-400">
                        <li>Users attempting to bypass, crack, or distribute bypasses for developer key systems will be permanently banned.</li>
                        <li>Developers must not use deceptive, malicious, or infinite-loop ad links (e.g., excessive Linkvertise chains without a functional end destination).</li>
                        <li>ScriptHub reserves the right to suspend or remove key system privileges for developers who abuse the system or violate our Content Policy.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">6. Platform Moderation</h2>
                    <p>
                        We reserve the right, but not the obligation, to monitor and edit or remove any Content. We have the right to terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service or our Platform Rules.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">7. Limitation of Liability</h2>
                    <p>
                        In no event shall ScriptHub, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
                    </p>
                    <p className="font-medium text-emerald-400/80">
                        DISCLAIMER: Scripts and executors discussed or hosted on this platform are third-party modifications. Using them may violate the Terms of Service of the respective games or platforms they target. ScriptHub takes no responsibility for account bans, hardware damage, or data loss resulting from the use of materials found on this site.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-offgray-100">8. Changes</h2>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                    </p>
                </section>

            </div>
        </div>
    );
}
