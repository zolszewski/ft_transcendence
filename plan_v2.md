PLAN 2.0 — PROPOSAL
===================================================================

Context:
- Days 1-13 of the current PLAN.md remain unchanged, already done and
  tested (auth, article CRUD+submission, reviews+decisions, comments,
  search/sort/pagination). This document only picks up from Day 14.
- Goal: align the plan with the 24 points we're targeting. Several
  target modules had no day allocated in the current plan at all
  (Websocket, half of User Management, WAF/Vault) - Plan 2.0 is
  therefore longer (39 days instead of 30), not just reorganized.
- Chat removed from the plan. But the underlying need for real-time
  stays (User Management requires seeing friends' online status),
  hence a separate "WebSocket foundation" day, designed so chat can
  plug into it without redefining anything.


DAY 14 — REDIS (unchanged)
---------------------------
Developer A: cache on the article listing, invalidation on write.
Developer B: loading indicators while cached data refreshes, and
showing slightly outdated data gracefully in the meantime rather than
a blank screen.


DAY 15 — API QUALITY (unchanged)
----------------------------------
Developer A: centralized errors, request validation, structured logs,
standardized responses.
Developer B: same on the frontend (error messages, loading/empty states).


DAY 16 — SECURITY BASELINE (unchanged)
-----------------------------------------
Developer A: CORS (lighter given Nginx already handles same-origin),
security headers, rate limiting, auth review, protect endpoints.
Developer B: XSS review (make sure user-submitted content like
comments/titles is always displayed as plain text, never executed as
code - React does this by default, just double-check nothing bypasses
it), protected pages (re-verify that login-only pages like
/explore, /publish, /review truly block logged-out visitors, including
by typing the URL directly).
Note: the rate limiting done here also serves the Public API module (Day 17).


DAY 17 — API CONTRACT + PUBLIC API (extended)
------------------------------------------------
Developer A: document all endpoints, request/response formats, initial
integration tests, + secured API key authentication (addition to the
original plan, closes the Public API module).
Developer B: typed API client (one central place in the frontend code
that knows how to call each backend endpoint correctly) + shared TS
interfaces, so front and back agree on the exact shape of the data.
POINTS: Public API (Major, +2)


DAY 18 — FILE UPLOAD (new)
-----------------------------
Developer A: generic upload endpoint (multer), type/size validation,
secure storage, file deletion.
Developer B: reusable upload component.
POINTS: File upload (Minor, +1)
Why here: technical prerequisite for the avatar (Day 19).


DAY 19 — PROFILE + AVATAR (new)
-----------------------------------
Developer A: update-profile endpoint, avatar endpoint (reuses Day 18).
Developer B: profile page, edit form, avatar upload.
Integration: a user can update their info and avatar.
(Contributes to the User Management Major, not complete yet at this stage.)


DAY 20 — WEBSOCKET FOUNDATION (new)
---------------------------------------
Developer A: session-authenticated WebSocket server (reuses the
existing session cookie), clean connect/disconnect handling, online
status tracking. Designed so chat can plug directly into it (same WS
server, same auth), without building chat itself.
Developer B: "online" indicator in the UI.
POINTS: Websocket (Major, +2)


DAY 21 — FRIENDS SYSTEM (new)
---------------------------------
Developer A: add/remove friend, friends list, uses the online status
from Day 20.
Developer B: friends list UI, add/remove buttons.
Integration: a user manages their friends list and sees who's online.
POINTS: closes the User Management Major (+2) — profile (Day19) +
avatar (Day19) + friends/online status (Day21) + auth (already done)
= complete module.


DAY 22 — DASHBOARD (unchanged, moved)
-----------------------------------------
Developer A: aggregation endpoints (articles/reviews/activity).
Developer B: student dashboard page, showing a user their own
articles/reviews/activity at a glance.


DAY 23 — RECOMMENDATION FOUNDATION (unchanged, moved)
----------------------------------------------------------
Developer A: architecture, service, scoring interface (how an article
gets a relevance score for a given reader).
Developer B: recommendation UI (cards/carousel showing suggested
articles to the reader).


DAY 24 — BASIC RECOMMENDATIONS (unchanged, moved)
---------------------------------------------------------
Developer A: simple algorithm, metadata/content signals.
Developer B: integration, loading/empty states.
POINTS: completes Recommendation Sys (Major, +2 - finalized here)


DAY 25 — OAUTH + 2FA (new, grouped)
---------------------------------------
Developer A: OAuth integration (Google/GitHub/42), complete 2FA system.
Developer B: OAuth buttons, 2FA code entry screen.
POINTS: OAuth (Minor, +1) + 2FA (Minor, +1)
Why grouped: same area of code (auth), similar moderate complexity.


DAY 26 — I18N + RTL (new, grouped)
--------------------------------------
Developer B (almost entirely frontend): i18n system, at least 3
complete languages, language switcher, RTL support (at least 1
language, full layout mirroring, not just text direction).
POINTS: Languages (Minor, +1) + RTL (Minor, +1)
Why grouped: RTL depends on i18n already existing.


DAY 27 — DATABASE OPTIMIZATION (unchanged, moved)
---------------------------------------------------------
Developer A: slow queries, database indexes (speed up lookups on
frequently-searched fields), optimized Prisma queries.
Developer B: fewer unnecessary requests, rendering performance.


DAY 28 — DOCKER HARDENING + STATUS PAGE (extended)
------------------------------------------------------
Developer A: improved Dockerfile, extended healthchecks (Postgres
already done), status page, automated backups.
Developer B: Next.js Docker config, dev volumes.
POINTS: Health check/status page (Minor, +1)


DAY 29 — NGINX (already done!)
-----------------------------------
Already in place: reverse proxy, HTTPS with self-signed certificate,
/api routing to the backend. Just needs a final production config check.


DAY 30 — BACKEND TESTING (unchanged, moved)
-------------------------------------------------
Developer A: tests for auth, articles, reviews, comments, authorization
failures.
Developer B: frontend acceptance scenarios (scripted checks of key
user flows - register, publish, review, comment - confirmed working
end-to-end from a user's point of view).


DAY 31 — FAILURE HANDLING (unchanged, moved)
--------------------------------------------------
Developer A: Postgres/Redis unavailable, invalid auth, malformed requests.
Developer B: improved loading/retry/error states.


DAY 32 — WAF + VAULT (new, dedicated)
-------------------------------------------
Developer A: hardened ModSecurity/WAF in front of Nginx, HashiCorp
Vault for secrets management (API keys, credentials, environment
variables).
POINTS: WAF/Vault (Major, +2)
The biggest remaining piece of infra, deserves its own dedicated day.


DAY 33 — SECURITY REVIEW (unchanged, moved)
--------------------------------------------------
Developer A: secrets, dependencies, authorization, Prisma/SQL
injection, API exposure (includes WAF/Vault review).
Developer B: XSS, protected pages, client-side validation.


DAY 34 — GDPR (new)
------------------------
Developer A: user data export, account deletion with confirmation.
Developer B: "my data" screen (export/deletion).
POINTS: GDPR compliance (Minor, +1)


DAY 35 — BROWSER COMPATIBILITY (new)
-----------------------------------------
Developer B (almost entirely): testing and fixes on 2 additional
browsers (Firefox/Safari/Edge), documentation of known limitations.
POINTS: Compatibility (Minor, +1)


DAY 36 — DEPLOYMENT PREPARATION (unchanged, moved)
---------------------------------------------------------
Developer A: migration docs, environment variables, seed/reset
(scripts to populate/reset the database with test data).
Developer B: responsive, accessibility, visual consistency.


DAY 37 — FEATURE FREEZE (unchanged, moved)
--------------------------------------------------
Full integration tests, only critical bugs after this point.


DAY 38 — RELEASE CANDIDATE (unchanged, moved)
-------------------------------------------------
Bug fixes, clean rebuild, production config check.


DAY 39 — FINAL DEMO (unchanged, moved)
-------------------------------------------
Final verification, technical and user demo, known limitations
documented.


===================================================================
POINTS SUMMARY

Already acquired (Days 1-13):
- ORM (Minor, +1)
- Search/filter/pagination (Minor, +1)

Targeted by Plan 2.0:
- Public API (Major, +2) — Day 17
- File upload (Minor, +1) — Day 18
- User Management (Major, +2) — Days 19+21
- Websocket (Major, +2) — Day 20
- OAuth (Minor, +1) + 2FA (Minor, +1) — Day 25
- i18n (Minor, +1) + RTL (Minor, +1) — Day 26
- Health check/status page (Minor, +1) — Day 28
- WAF/Vault (Major, +2) — Day 32
- GDPR (Minor, +1) — Day 34
- Compatibility (Minor, +1) — Day 35
- Recommendation Sys (Major, +2) — Days 23-24
- Framework (Major, +2) — already largely in place

TOTAL TARGETED: 24 points (14 required + 10 margin)


IF TIME RUNS SHORT, CUT THESE FIRST (no domino effect):
- GDPR (+1) - Day 34
- Health check/status page (+1) - Day 28
- Compatibility (+1) - Day 35
These 3 are independent of the rest, no other module depends on them.

DO NOT CUT WITHOUT THINKING TWICE (structural, either lose several
points at once or break the coherence of other modules):
- Websocket (Day 20) - blocks User Management (online status) and chat
- User Management (Days 19+21) - half already built (auth), abandoning
  it wastes that work (the subject's "all or nothing" rule)
- WAF/Vault (Day 32) - big chunk but nothing else depends on it, so
  cuttable as a last resort if truly necessary
