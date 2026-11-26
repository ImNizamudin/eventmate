# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React JS (Vite) with React Router DOM, Tailwind CSS, and Supabase (Auth, PostgreSQL with Row Level Security, Realtime, and Storage), replacing the single-file browser-local prototype in `eventmate_v6_payment_safety.html`.

## Users

Primary users are university students and young collaborators in Indonesia operating in two switchable roles inside one account:

- **Team Seeker**: searches for competitions, volunteer programs, research groups, creative projects, seminars, or student organizations, submits join requests, responds to team invitations, and tracks application statuses.
- **Team Creator**: publishes team opportunities with needed headcount and skills, searches individual profiles, sends invitations, reviews incoming join requests, manages accepted members, and posts team announcements.

## Product Purpose

EventMate connects students and young builders with complementary skills into verified, active teams without relying on scattered chat groups or unverified social media posts. Success means a registered user can verify their email, publish or discover up-to-date teams and individuals across separate accounts, coordinate join requests and invitations with real-time status updates, share approved contact details safely after acceptance, and record post-collaboration ratings and reviews.

## Positioning

A structured team formation and collaboration directory for student events and projects, where contact information stays private until an application or invitation is accepted and members retain control over which contact channels they share, with built-in reporting and blocking for safety.

## Operating Context

- Multi-account web application accessed on desktop laptops and mobile phones across campuses in Indonesia (with region and delivery-mode filters such as Online, Offline, and Hybrid).
- Every account holds private workspace data (credentials, notifications, blocks, contact consent) alongside public discovery fields (profile, skills, interests, experience, ratings, and published teams).
- Trial and membership status (30-day free trial and Rp15.000/month EventMate Plus information) is tracked transparently without simulated or client-side payment bypasses.

## Capabilities and Constraints

- **Authentication and Email Notifications**: independent Sign Up, Sign In, email confirmation after registration, resend verification email, and Forgot/Reset Password recovery via Supabase Auth.
- **Multi-Account Synchronization**: profiles, teams, member counts, requests, invitations, announcements, notifications, blocks, and reviews persisted in Supabase PostgreSQL and updated across sessions.
- **Two-Way Matching**: Team Seekers request to join teams; Team Creators invite individuals from the People Directory; both sides can accept or reject, syncing status and member counts.
- **Team Workspace (replaces Group Chat)**:
  - **Application Status**: tracks Pending, Accepted, and Rejected requests and invitations.
  - **Contact Information**: displays shared contact channels only after request/invitation acceptance and only for non-blocked users.
  - **Member Directory**: lists accepted team members with their role, skills, and consented contact details.
  - **Announcement**: Team Creator broadcasts updates readable by accepted team members.
  - **Report & Block**: members can report abuse and block specific users to revoke contact visibility and interaction.
- **Rating & Review**: teammates who share an accepted team can rate (1-5) and review each other; ratings appear on user profiles.
- **Payment Safety Constraint**: live payment gateway integration is out of scope; membership activation never occurs via client-side simulation.

## Brand Commitments

- **Name**: EventMate ("Find Your Team, Create Your Moment").
- **Logo**: `public/eventmate-logo.png` extracted from `eventmate_v6_payment_safety.html`.
- **Visual World**: Preserves the EventMate Brand Refresh identity (Deep Violet `#5425a7`, Rose Magenta accent `#c42871`/`#e74791`, warm lavender-tinted paper `#fbf9fd`, `Manrope` + `DM Sans`) refined for WCAG AA legibility and Operate-mode clarity.
- **Language**: Indonesian (`id`) primary UI copy.

## Evidence on Hand

- Reference prototype: `eventmate_v6_payment_safety.html` containing domain categories (`Kompetisi`, `Volunteer`, `Seminar`, `Penelitian`, `Proyek Kreatif`, `Organisasi`), regions (`Jawa Timur`, `DKI Jakarta`, `Jawa Barat`, `Jawa Tengah`, `Seluruh Indonesia`), starter team structure, onboarding flow, and payment safety notice.
- No live customer metrics, testimonials, or verified payment merchant credentials exist yet; UI must never fabricate user counts, reviews, or payment receipts.

## Product Principles

1. **Multi-Account Truth Over Local Illusion**: every profile, team slot, request, and review comes from the database, never local demo placeholders.
2. **Consent Before Contact**: personal contact channels stay hidden until mutual acceptance and respect explicit per-user sharing and block rules.
3. **Clear State Over Silent Action**: pending, accepted, rejected, unverified email, loading, empty, and error states always name what happened and the next step.
4. **Honest Boundaries**: unconfigured integrations (like live payment gateway checkout) are stated plainly without fake confirmation states.

## Accessibility & Inclusion

- WCAG 2.2 AA text contrast (>= 4.5:1 normal text, >= 3:1 large text and UI boundaries) across all surfaces.
- Full keyboard navigation, visible focus indicators, modal Escape handling, and >= 44px touch targets on mobile viewports.
