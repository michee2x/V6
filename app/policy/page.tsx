import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Recrea8 collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 21, 2025";

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16">
      <div className="mb-10">
        <Link
          href="/"
          className="text-caption text-muted-foreground hover:text-foreground transition-colors duration-150 inline-flex items-center gap-1 mb-8"
        >
          ← Back to Recrea8
        </Link>
        <h1 className="text-h1 font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-caption text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-body text-foreground/90">
        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">1. Who We Are</h2>
          <p>
            Recrea8 (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a web application that helps you analyse
            online content — videos, images, and articles — and generate creative briefs from them.
            Our service is available at{" "}
            <a href="https://recrea8.app" className="text-primary hover:underline">
              recrea8.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">2. Information We Collect</h2>
          <h3 className="text-h3 font-medium text-foreground mb-2">Information you provide</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>URLs you paste into the application for analysis</li>
            <li>Your email address and name when you sign in via Google OAuth</li>
            <li>Creative briefs and outputs you generate and choose to save</li>
          </ul>
          <h3 className="text-h3 font-medium text-foreground mt-4 mb-2">Information collected automatically</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Usage data and analytics (pages visited, features used) via Google Analytics 4</li>
            <li>Browser type, operating system, and device information</li>
            <li>IP address and general geographic region</li>
          </ul>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>To process and analyse the URLs you submit using AI models</li>
            <li>To generate creative briefs and structured content breakdowns</li>
            <li>To authenticate you and maintain your session</li>
            <li>To store your analysis history when you are signed in</li>
            <li>To understand how the product is used and improve it</li>
            <li>To detect and prevent abuse or misuse of the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">4. Third-Party Services</h2>
          <p className="text-muted-foreground mb-3">
            We rely on the following third-party services to operate Recrea8:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Google OAuth</strong> — for sign-in authentication.
              Subject to{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-foreground">Supabase</strong> — for database storage and user session management.
            </li>
            <li>
              <strong className="text-foreground">Google Analytics 4</strong> — for anonymised usage analytics.
            </li>
            <li>
              <strong className="text-foreground">Google Gemini / AI APIs</strong> — for content analysis and brief generation.
              Submitted URLs and content are processed by these APIs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">5. Data Retention</h2>
          <p className="text-muted-foreground">
            If you are a guest (not signed in), your session data is temporary and is not persisted
            beyond your browser session. If you are signed in, your analysis history is stored in our
            database until you delete your account or request deletion. You may contact us at any time
            to request deletion of your data.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">6. Cookies</h2>
          <p className="text-muted-foreground">
            We use essential cookies to maintain your authentication session. We also use analytics
            cookies via Google Analytics 4 to understand usage patterns. You can disable cookies in
            your browser settings, though this may affect the functionality of the service.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">7. Your Rights</h2>
          <p className="text-muted-foreground">
            Depending on your location, you may have the right to access, correct, or delete the
            personal data we hold about you, or to restrict or object to its processing. To exercise
            any of these rights, please contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">8. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground">
            Recrea8 is not directed at children under the age of 13. We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal
            information, please contact us and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by updating the &quot;Last updated&quot; date at the top of this page. Continued use of
            Recrea8 after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">10. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy or how we handle your data, please
            contact us at{" "}
            <a href="mailto:hello@recrea8.app" className="text-primary hover:underline">
              hello@recrea8.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
