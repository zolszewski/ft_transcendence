import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";

export const metadata: Metadata = {
  title: "Privacy Policy - OpenScholar",
  description: "How OpenScholar collects, uses and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <PageShell width="default" offset="sm">
      <PageHeading
        title="Privacy Policy"
        description="Last updated: October 6, 2026"
      />

      <div className="legal-content">
        <section>
          <h2>1. Who we are</h2>
          <p>
            OpenScholar is an academic publishing platform built by a team of
            students as part of the 42 curriculum (ft_transcendence project).
            It lets researchers and students publish articles, review the work
            of others, comment, add friends and chat in real time. This policy
            explains which personal data we process when you use OpenScholar,
            why we process it and what rights you have over it.
          </p>
        </section>

        <section>
          <h2>2. Data we collect</h2>
          <h3>Account data</h3>
          <ul>
            <li>Your email address and display name.</li>
            <li>
              Your password, which is never stored in clear text: it is hashed
              and salted with bcrypt before being saved.
            </li>
            <li>
              If you sign in with GitHub (OAuth 2.0): the identifier of your
              GitHub account, your public name and your email address as
              provided by GitHub. We never receive your GitHub password.
            </li>
            <li>
              If you enable two-factor authentication: the secret used to
              generate your one-time codes.
            </li>
          </ul>

          <h3>Profile data</h3>
          <ul>
            <li>Your avatar, if you upload one (a default avatar is used otherwise).</li>
            <li>Your faculty and specialization, if you choose to fill them in.</li>
            <li>The date your account was created.</li>
          </ul>

          <h3>Content you create</h3>
          <ul>
            <li>
              Articles (title, abstract, content), their thumbnail image and
              attached PDF files.
            </li>
            <li>Reviews and comments you write on articles.</li>
            <li>Uploaded files and their metadata (name, type, size).</li>
          </ul>

          <h3>Reading activity</h3>
          <ul>
            <li>The articles you open (each article is recorded once per user).</li>
            <li>The articles you like.</li>
          </ul>

          <h3>Social and chat data</h3>
          <ul>
            <li>Your friend requests and friends list.</li>
            <li>
              Your private chat messages, the conversations you take part in,
              and whether a message has been read.
            </li>
            <li>
              Your online status, which is computed from your active
              connection and is not stored permanently.
            </li>
          </ul>

          <h3>Technical data</h3>
          <ul>
            <li>
              A session cookie (<code>connect.sid</code>) that keeps you logged
              in. It is strictly necessary for the service to work.
            </li>
            <li>API keys you generate, which are only stored as a hash.</li>
          </ul>
        </section>

        <section>
          <h2>3. How we use your data</h2>
          <ul>
            <li>To create and secure your account and authenticate you.</li>
            <li>To display your profile and your published work to other users.</li>
            <li>
              To run the review process, comments, friends system and real-time
              chat.
            </li>
            <li>To show your friends whether you are online.</li>
            <li>
              To recommend articles you may like: the articles you open, like,
              comment on or review are compared with other articles by an
              algorithm that runs on our own server. No data is sent to a third
              party for this.
            </li>
            <li>To prevent abuse and keep the platform secure.</li>
          </ul>
          <p>
            We do not sell your data, we do not use it for advertising and we
            do not use tracking or analytics cookies.
          </p>
        </section>

        <section>
          <h2>4. Who can see your data</h2>
          <ul>
            <li>
              <strong>Public:</strong> your name, avatar, faculty,
              specialization, published articles, reviews and comments are
              visible to other users.
            </li>
            <li>
              <strong>Restricted:</strong> drafts and unpublished articles are
              only visible to you (and to reviewers once submitted). Private
              files are only accessible to their owner.
            </li>
            <li>
              <strong>Private:</strong> chat messages are only visible to the
              participants of the conversation. Your email address, password
              hash and two-factor secret are never shown to other users.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Cookies</h2>
          <p>
            OpenScholar only uses one session cookie, required to keep you
            logged in. It expires after 7 days or when you log out. No
            third-party, advertising or tracking cookies are used.
          </p>
        </section>

        <section>
          <h2>6. Security</h2>
          <p>
            All connections between your browser and OpenScholar use HTTPS.
            Passwords are hashed and salted, API keys are hashed, and access
            to private resources is checked on the server. Optional two-factor
            authentication adds an extra layer of protection to your account.
            When you log out, your session and real-time connections are
            closed.
          </p>
        </section>

        <section>
          <h2>7. Data retention</h2>
          <p>
            Your data is kept as long as your account exists. Session data is
            deleted when you log out or when the session expires. If your
            account is deleted, your personal data, friendships and
            conversations are removed; content that was publicly published may
            be kept in an anonymized form to preserve the integrity of
            discussions and reviews.
          </p>
        </section>

        <section>
          <h2>8. Your rights</h2>
          <p>
            You can view and update most of your personal information directly
            from your dashboard. If you want your account and personal data to
            be deleted, or if you have any question about your data, contact
            the OpenScholar team at{" "}
            <a href="mailto:openscholar.team42@gmail.com">
              openscholar.team42@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2>9. Changes to this policy</h2>
          <p>
            We may update this policy as the platform evolves. The date at the
            top of this page shows when it was last changed. Please also read
            our <Link href="/terms">Terms of Service</Link>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
