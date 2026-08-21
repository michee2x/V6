import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the terms and conditions governing your use of Recrea8.",
};

export default function TermsOfServicePage() {
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
        <h1 className="text-h1 font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-caption text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-body text-foreground/90">
        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using Recrea8 (&quot;the Service&quot;), available at{" "}
            <a href="https://recrea8.app" className="text-primary hover:underline">
              recrea8.app
            </a>
            , you agree to be bound by these Terms of Service. If you do not agree to these terms,
            please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">2. Description of Service</h2>
          <p className="text-muted-foreground">
            Recrea8 is an AI-powered tool that allows you to paste a URL — from a video, image, or
            article — and receive an instant breakdown of the content. You can then use that analysis
            to generate a creative brief. Some features are available without an account; others
            require sign-in.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">3. User Accounts</h2>
          <p className="text-muted-foreground">
            You may sign in using Google OAuth. You are responsible for maintaining the
            confidentiality of your account and for all activities that occur under your account.
            You agree to notify us immediately of any unauthorised use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">4. Permitted Use</h2>
          <p className="text-muted-foreground mb-3">You agree to use Recrea8 only for lawful purposes. You must not:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Submit URLs containing illegal, harmful, or infringing content</li>
            <li>Use the Service to harass, abuse, or harm others</li>
            <li>Attempt to circumvent rate limits, access controls, or security measures</li>
            <li>Use automated bots or scripts to abuse the Service</li>
            <li>Reverse-engineer or attempt to extract proprietary AI models or data</li>
            <li>Resell or commercialise access to the Service without written permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">5. Intellectual Property</h2>
          <p className="text-muted-foreground">
            All content, design, code, and branding of Recrea8 is the property of Recrea8 and is
            protected by applicable intellectual property laws. You retain ownership of any content
            you submit, but you grant us a limited licence to process it for the purpose of providing
            the Service. AI-generated outputs (creative briefs) are provided for your own use; we
            make no claim to them.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">6. Third-Party Content</h2>
          <p className="text-muted-foreground">
            The Service analyses third-party URLs and content. You are responsible for ensuring you
            have the right to submit any URL for analysis. Recrea8 is not responsible for the
            accuracy, legality, or appropriateness of third-party content.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground">
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
            express or implied. We do not warrant that the Service will be uninterrupted, error-free,
            or that AI-generated outputs will be accurate or suitable for any particular purpose.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the fullest extent permitted by law, Recrea8 shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the
            Service, even if we have been advised of the possibility of such damages. Our total
            liability to you for any claim shall not exceed the amount you paid us in the 12 months
            prior to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">9. Termination</h2>
          <p className="text-muted-foreground">
            We reserve the right to suspend or terminate your access to the Service at any time,
            with or without notice, for conduct that we believe violates these Terms or is harmful
            to other users, us, or third parties.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">10. Changes to These Terms</h2>
          <p className="text-muted-foreground">
            We may update these Terms from time to time. We will notify you of material changes by
            updating the &quot;Last updated&quot; date. Continued use of the Service after changes are posted
            constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">11. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of England
            and Wales, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-h2 font-semibold text-foreground mb-3">12. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about these Terms, please contact us at{" "}
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
