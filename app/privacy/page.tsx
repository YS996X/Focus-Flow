import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Focus Flow',
  description: 'Privacy Policy for Focus Flow - Your AI-Powered Focus Assistant',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold mb-12 text-center">Privacy Policy</h1>
        
        <div className="space-y-8 text-lg">
          <div className="text-center mb-12">
            <p className="text-2xl mb-4">Effective Date: April 30, 2025</p>
            <p className="text-xl">App Name: Focus Flow</p>
            <p className="text-xl">Operated by: Rexlab, under RexGroup</p>
            <p className="text-xl">Contact Email: yuvrajsj996@gmail.com</p>
            <p className="text-xl">Locations: British Columbia, Canada & California, United States</p>
          </div>

          <section>
            <h2 className="text-3xl font-semibold mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              RexGroup ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how Focus Flow ("the App") collects, uses, stores, and safeguards your data. We are fully transparent about our practices, which are designed to respect your privacy and comply with global standards, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We only collect the minimal data necessary to operate the App and provide its core functionality. Specifically, we collect the following:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address – used solely for account login and user authentication</li>
              <li>Unique user ID – generated to associate your data securely with your account</li>
              <li>Pomodoro usage statistics – stored to display your focus session history</li>
              <li>User notes – stored temporarily for your access and reference</li>
              <li>Daily AI response usage status – tracked to ensure fair use of AI features</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Any additional content uploaded by you (e.g., attachments, inputs) is encrypted and automatically deleted at the end of your session.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">3. How We Use Your Data</h2>
            <p className="leading-relaxed mb-4">
              We access your data exclusively to support the functionality you choose to use within Focus Flow. Your data is never used for any secondary purposes such as marketing, advertising, profiling, or analytics.
            </p>
            <p className="leading-relaxed mb-4">We do not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sell or rent your data to anyone</li>
              <li>Share your data with third parties</li>
              <li>Use your data for internal analysis or commercial gain</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Data is accessed only to serve your immediate, user-initiated requests within the app.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="leading-relaxed mb-4">
              All data is stored securely using Google Firebase, a trusted infrastructure provider with strong security practices. Additional safeguards include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>End-to-end encryption for all user-uploaded content</li>
              <li>Session-based data handling, where temporary content is deleted once a session ends</li>
              <li>Regular system-level checks to ensure privacy compliance</li>
            </ul>
            <p className="leading-relaxed mt-4">
              We follow industry best practices to protect your personal information from unauthorized access, disclosure, alteration, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">5. Data Retention and Deletion</h2>
            <p className="leading-relaxed mb-4">
              You have full control over your data. We retain your personal data (email, usage stats, notes) only as long as necessary to provide the App's services.
            </p>
            <p className="leading-relaxed mb-4">You may request to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your stored data</li>
              <li>Correct or update inaccuracies</li>
              <li>Permanently delete your data</li>
            </ul>
            <p className="leading-relaxed mt-4">
              To exercise these rights, email yuvrajsj996@gmail.com. All deletion requests are fulfilled within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">6. Children's Privacy</h2>
            <p className="leading-relaxed">
              Focus Flow is designed to be safe and accessible for users of all ages. The App is monitored by automated encrypted moderation systems that help ensure a secure environment. We do not knowingly collect personal data from children under 13 without parental consent where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">7. International Compliance</h2>
            <p className="leading-relaxed mb-4">
              Focus Flow operates in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>British Columbia, Canada (in compliance with PIPA and related provincial privacy laws)</li>
              <li>California, USA (in compliance with CCPA and CalOPPA)</li>
            </ul>
            <p className="leading-relaxed mt-4">
              We are also committed to upholding users' rights under the General Data Protection Regulation (GDPR) for users in the European Union.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="leading-relaxed mb-4">
              We use Google Firebase solely for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentication</li>
              <li>Secure data storage</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Firebase operates under its own privacy policy, which can be reviewed here.
            </p>
            <p className="leading-relaxed mt-4">
              We do not integrate any third-party analytics, marketing platforms, or tracking services.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted here, and the "Effective Date" at the top will be updated accordingly. Continued use of the App after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-4">10. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, you may contact us at:
            </p>
            <div className="mt-4 space-y-2">
              <p className="flex items-center">
                <span className="mr-2">📧</span> Email: yuvrajsj996@gmail.com
              </p>
              <p className="flex items-center">
                <span className="mr-2">🏢</span> Locations: British Columbia, Canada | California, United States
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 