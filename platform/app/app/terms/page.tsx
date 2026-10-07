import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";

export const metadata: Metadata = {
  title: "Terms of Service - OpenScholar",
  description: "The rules for using OpenScholar.",
};

export default function TermsPage() {
  return (
    <PageShell width="default" offset="sm">
      <PageHeading
        title="Terms of Service"
        description="Last updated: October 6, 2026"
      />

      <div className="legal-content">
        <section>
          <h2>1. Acceptance of the terms</h2>
          <p>
            By creating an account or using OpenScholar, you agree to these
            Terms of Service and to our{" "}
            <Link href="/privacy">Privacy Policy</Link>. If you do not agree,
            please do not use the platform.
          </p>
        </section>

        <section>
          <h2>2. The service</h2>
          <p>
            OpenScholar is an academic publishing platform created as a student
            project (42 curriculum, ft_transcendence). It allows users to write
            and publish articles, submit them for peer review, review and
            comment on the work of others, add friends and exchange private
            messages in real time. The service is provided free of charge, for
            educational purposes, and may change or be interrupted at any time.
          </p>
        </section>

        <section>
          <h2>3. Your account</h2>
          <ul>
            <li>You must provide a valid email address and accurate information.</li>
            <li>
              You are responsible for keeping your password secret and for all
              activity on your account. We recommend enabling two-factor
              authentication.
            </li>
            <li>You may not impersonate another user or a real researcher.</li>
            <li>
              If you sign in with GitHub, you must also respect GitHub&apos;s
              own terms.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Publishing and reviewing</h2>
          <ul>
            <li>
              You may only publish content you wrote yourself or have the right
              to share. Plagiarism, fabricated data and copyright infringement
              are forbidden.
            </li>
            <li>
              Submitted articles go through a review process and may be
              approved or rejected. A rejected article is not published.
            </li>
            <li>
              Reviews must be honest, constructive and focused on the work, not
              on the author.
            </li>
            <li>
              Uploaded files (images and PDFs) must respect the allowed types
              and sizes and must not contain malicious code.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Chat, comments and community rules</h2>
          <p>When interacting with other users, you agree not to:</p>
          <ul>
            <li>Harass, threaten, insult or discriminate against anyone.</li>
            <li>Post hateful, violent, sexual or illegal content.</li>
            <li>Send spam, advertising or unsolicited bulk messages.</li>
            <li>Share another person&apos;s personal information without their consent.</li>
            <li>
              Try to break, overload or bypass the security of the platform,
              or access data that is not yours.
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual property</h2>
          <p>
            You keep the ownership of the articles, reviews, comments and
            files you publish. By publishing content, you allow OpenScholar to
            store it and display it to other users within the platform. You
            can remove your unpublished drafts at any time.
          </p>
        </section>

        <section>
          <h2>7. API usage</h2>
          <p>
            If you generate an API key, you are responsible for keeping it
            secret. The API is rate-limited, and abusive use may lead to the
            key being revoked.
          </p>
        </section>

        <section>
          <h2>8. Moderation and termination</h2>
          <p>
            We may remove content or suspend accounts that break these terms,
            without notice. You can stop using OpenScholar at any time and
            request the deletion of your account by writing to{" "}
            <a href="mailto:openscholar.team42@gmail.com">
              openscholar.team42@gmail.com
            </a>{" "}
            (see the <Link href="/privacy">Privacy Policy</Link>).
          </p>
        </section>

        <section>
          <h2>9. Liability</h2>
          <p>
            OpenScholar is a student project provided &quot;as is&quot;,
            without any warranty of availability or accuracy. Content published
            by users is the sole responsibility of its authors and does not
            represent the opinion of the OpenScholar team. We are not liable
            for any loss of data or damage resulting from the use of the
            platform.
          </p>
        </section>

        <section>
          <h2>10. Changes to these terms</h2>
          <p>
            We may update these terms as the platform evolves. The date at the
            top of this page shows when they were last changed. Continuing to
            use OpenScholar after a change means you accept the new terms.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
