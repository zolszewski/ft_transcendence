# API Reference

Base URL: `https://localhost:8444/api` (via Nginx, port published by `platform/docker-compose.yml`) or `http://localhost:4000/api` (direct, from inside the backend container).

`/health` and `/status` are not under `/api`: `https://localhost:8444/health`.

## Authentication

Two methods are accepted on protected routes:

- **Session cookie** (browser usage): obtained via `POST /auth/register`, `POST /auth/login` (or GitHub OAuth, see below), sent automatically by the browser afterwards.
- **API key** (script / third-party integration usage): header `Authorization: Bearer <key>`, obtained via `POST /auth/api-keys`. The raw key is shown only once, at creation time. Only its SHA-256 hash is stored server-side. The Bearer header is read only when the request has no session cookie.

```bash
curl -k https://localhost:8444/api/auth/me -H "Authorization: Bearer <your key>"
```

Routes marked "Auth required" accept either method. Routes marked "Owner only" additionally require the authenticated user to own the resource.

## Rate limiting

- Global, all `/api/*` routes: 300 requests / 15 min per IP in production (2000 outside production). `GET /api/uploads/:id` is not counted.
- `POST /auth/register`, `POST /auth/login`, `POST /auth/login/2fa`, `POST /users/me/2fa/enable` and `POST /users/me/2fa/disable`: 10 failed attempts / 15 min per IP. Successful requests do not count toward this quota.

Exceeding a limit returns `429 Too Many Requests`. The `RateLimit` / `RateLimit-Policy` headers show the remaining quota.

## Error format

Expected errors (validation, permissions, missing resource, etc.) return `{ "error": "message" }` with the matching HTTP status code. Any unexpected error returns `500 { "error": "Something went wrong" }`, with the technical detail logged server-side only.

## Auth

### `POST /auth/register`
Creates an account and opens a session. Rate limited.

Body: `{ "email": string, "name": string, "password": string (min 8 characters) }`

- `201` `{ id, email, name }`
- `400` Invalid fields
- `409` Email already in use

### `POST /auth/login`
Checks email and password. Rate limited.

Body: `{ "email": string, "password": string }`

- `200` No 2FA: opens a session, returns `{ id, email, name }`
- `200` 2FA enabled: no session yet, returns `{ requires2fa: true }`. Call `POST /auth/login/2fa` next, within 5 minutes.
- `400` Invalid fields
- `401` Invalid credentials (also returned for accounts created with GitHub, which have no password)

### `POST /auth/login/2fa`
Second step of a login for an account with 2FA enabled. Opens the session. Rate limited.

Body: `{ "code": string }` (6 digits, current TOTP code)

- `200` `{ id, email, name }`, session opened
- `400` Code is not 6 digits
- `401` No pending login, or pending login older than 5 minutes
- `401` Wrong code (`{ error: "Invalid code" }`)

### `GET /auth/oauth/github`
Starts the GitHub login. Stores a random `state` in the session (CSRF protection), then redirects to GitHub. No authentication required.

- `302` Redirect to GitHub's authorize page

### `GET /auth/oauth/github/callback`
Called by GitHub after the user approves. Query: `code`, `state` (set by GitHub). Do not call it by hand, it is the redirect target registered in the GitHub OAuth app (`GITHUB_CALLBACK_URL`).

Finds the user by GitHub id, or creates an account from the primary verified GitHub email. With 2FA enabled, redirects to `/authentication/login?pending2fa=1` instead of opening a session (then `POST /auth/login/2fa` finishes the login). Otherwise opens a session and redirects to `/`.

- `302` Success (to `/`), or 2FA required (to `/authentication/login?pending2fa=1`)
- `400` Missing or wrong `state` / `code` (`Invalid OAuth callback`), or GitHub exchange failed (`GitHub authentication failed`)
- `409` An account with the same email already exists and was created with a password. Log in with the password instead.

### `POST /auth/logout`
Closes the current session. Also removes the user from the online list and disconnects the user's open Socket.io connections of this session.

- `200` `{ success: true }`

### `POST /auth/api-keys`
Auth required. Generates a new API key for the authenticated account.

- `201` `{ apiKey: string }`. Shown in clear text once, save it.
- `401` Not authenticated

### `GET /auth/me`
Auth required. Returns the authenticated user's profile.

- `200` `{ id, email, name, faculty, specialization, avatarId, avatarUrl, createdAt }`
- `401` Not authenticated

## Articles

### Article object

Every article returned by these routes has the database fields (`id`, `title`, `content`, `abstract`, `status`, `authorId`, `miniatureId`, `documentId`, `miniatureFocusX`, `miniatureFocusY`, `createdAt`, ...) and these computed fields:

- `author`: `{ id, name }` (on list and detail routes).
- `miniatureUrl`: `/api/uploads/:id` if `miniatureId` is set, otherwise the placeholder `/default-article-thumbnail.jpg`.
- `documentUrl`: `/api/articles/:id/document` if the article has a PDF and the caller can view the article, otherwise `null`.
- `likeCount`: number of likes.
- `likedByMe`: `true` if the caller liked the article (always `false` for anonymous callers).

### `GET /articles/explore`
Lists published articles, paginated. Public.

Query: `search?` (title/content), `sort?` (`newest` by default, or `oldest`), `page?` (default 1), `limit?` (default 10, max 50), `createdFrom?` / `createdTo?` (ISO date, inclusive range on `createdAt`), `faculty?` (exact match on the author's faculty, case-insensitive). An invalid value is ignored, not rejected.

- `200` `{ articles: Article[], total, page, totalPages }`

### `GET /articles/submitted`
Auth required. Lists articles awaiting review: status `SUBMITTED`, excluding your own articles and articles you already reviewed. Same `search`/`sort`/`page`/`limit` as `/explore` (no date or faculty filter).

- `200` `{ articles: Article[], total, page, totalPages }`

### `GET /articles/mine`
Auth required. Lists your own articles, paginated. Optional `status` (one of `DRAFT`/`SUBMITTED`/`UNDER_REVIEW`/`APPROVED`/`REJECTED`/`PUBLISHED`) filters to that status; any other value returns all statuses. Same `search`/`sort`/`page`/`limit` as `/explore` (no date or faculty filter).

- `200` `{ articles: Article[], total, page, totalPages }`

### `GET /articles/:id`
Visibility depends on the article's status and who is asking:
- `PUBLISHED`: visible to everyone. If the caller is logged in, a view is recorded (used by recommendations).
- Any other status: visible to the author, and to any authenticated user if the status is `SUBMITTED` (for reviewing). Everyone else gets 404, so an article's existence is never revealed.

- `200` `Article`
- `404` Not found, or not visible to the caller

### `POST /articles`
Auth required. Creates an article (initial status `DRAFT`).

Body: `{ "title": string, "content": string, "abstract"?: string, "miniatureId"?: string, "documentId"?: string, "miniatureFocusX"?: number, "miniatureFocusY"?: number }`

- `miniatureId`: an upload you own, of an image type. Switched to `PUBLIC` visibility once attached.
- `documentId`: an upload you own, of type `application/pdf`. Attached to the article and served by `GET /articles/:id/document`.
- `miniatureFocusX` / `miniatureFocusY`: numbers from 0 to 100 (focus point of the thumbnail, default 50).

Responses:
- `201` `Article`
- `400` Invalid title/content, invalid focus, `miniatureId` is not an image, or `documentId` is not a PDF
- `401` Not authenticated
- `403` `miniatureId` or `documentId` does not belong to the caller
- `404` `miniatureId` or `documentId` does not exist

### `PUT /articles/:id`
Auth required, owner only. Updates your own article. Same body and rules as `POST /articles`. When `title` and `content` are sent, the embedding used by recommendations is recomputed.

- `200` Updated `Article`
- `400` Invalid title/content, invalid focus, `miniatureId` is not an image, or `documentId` is not a PDF
- `403` Not the author, or `miniatureId` / `documentId` does not belong to the caller
- `404` Article not found, or `miniatureId` / `documentId` does not exist

### `DELETE /articles/:id`
Auth required, owner only. Deletes your own article.

- `204` Deleted
- `403` Not the author
- `404` Article not found

### `POST /articles/:id/submit`
Auth required, owner only. Submits your own article (`DRAFT` to `SUBMITTED`) for review.

- `200` Updated `Article`
- `403` Not the author
- `404` Article not found
- `409` Not in `DRAFT` status

### `GET /articles/:id/document`
Serves the PDF attached to the article, with the same visibility as `GET /articles/:id`.

- `200` The PDF file
- `404` Article not visible to the caller, no document attached, or document missing

### `POST /articles/:id/like`
Auth required. Likes an article you can see. Idempotent: liking twice keeps one like.

- `204` Liked
- `403` You are the author (`You cannot like your own article`)
- `404` Article not found or not visible to the caller

### `DELETE /articles/:id/like`
Auth required. Removes your like. Idempotent: no error if there was no like.

- `204` Like removed (or there was none)
- `404` Article not found

### `POST /articles/:id/reviews`
Auth required. Submits a review on a `SUBMITTED` article. Not allowed on your own article, one review per reviewer per article.

Body: `{ "comment"?: string }`

- `201` `Review` (status `PENDING`)
- `403` Author of the article
- `404` Article not found
- `409` Not in `SUBMITTED` status, or already reviewed by this reviewer

### `GET /articles/:id/reviews`
Auth required. Restricted to the article's author and to reviewers who submitted a review on it.

- `200` `Review[]`
- `403` Neither the author nor a reviewer of this article
- `404` Article not found

### `POST /articles/:id/comments`
Auth required. Comments on a published article.

Body: `{ "content": string }`

- `201` `Comment`
- `400` Invalid content
- `404` Article not found or not published

### `GET /articles/:id/comments`
Lists an article's comments. Public.

- `200` `Comment[]`

## Reviews

### `GET /reviews/:id`
Auth required. Note: the `:id` here is the **article** id, not a review id. Returns the article so a reviewer can read it before deciding. Only for `SUBMITTED` articles, not your own.

- `200` `Article` (with the computed fields described above)
- `403` You are the author (`You cannot review your own article`)
- `404` Article not found, or not in `SUBMITTED` status

### `PATCH /reviews/:id`
Auth required, reviewer only. Decides a review you wrote (`PENDING` only), by review id. Also updates the article: `APPROVED` sets the article to `PUBLISHED`, `REJECTED` sets it to `REJECTED`.

Body: `{ "decision": "APPROVED" | "REJECTED" }`

- `200` Updated `Review`
- `400` Invalid decision
- `403` Not the reviewer of this review
- `404` Review not found
- `409` Already decided

## Comments

### `DELETE /comments/:id`
Auth required, owner only. Deletes your own comment.

- `204` Deleted
- `403` Not the author
- `404` Comment not found

## Recommendations

Both routes return articles as in `GET /articles/explore` (with `likeCount`, `likedByMe`, `documentUrl`, ...), at most 10 items.

The reader profile is built from the articles you viewed (weight 1), liked (2), commented on (2) or reviewed (3), excluding your own articles. Recommendations exclude the articles you already engaged with. Similarity is the cosine between embeddings (Transformers.js, `Xenova/all-MiniLM-L6-v2`, 384 dimensions) computed when the article is saved.

### `GET /recommendations/discover`
Auth required. Published articles close to what you read. Cold start (no engagement yet): the most recent published articles.

- `200` `Article[]` (may be empty if nothing is published)
- `401` Not authenticated

### `GET /recommendations/deepen`
Auth required. Published articles close to your own publications (average of your published articles' embeddings). Returns `[]` if you have no published article.

- `200` `Article[]`
- `401` Not authenticated

## Uploads

### `POST /uploads`
Auth required. Uploads a file (PNG, JPEG, WebP or PDF, 5 MB max). Content is validated against its real format (magic bytes), not only the declared type. `visibility` defaults to `PRIVATE`; any value other than exactly `"PUBLIC"` is treated as `PRIVATE`.

Body: `multipart/form-data`, field `file` (required), field `visibility`? (`"PUBLIC"` or `"PRIVATE"`)

- `201` `Upload`
- `400` No file provided, or invalid format
- `401` Not authenticated
- `413` File larger than 5 MB

### `GET /uploads/:id`
Serves the file if `PUBLIC`, or if the caller is the owner.

- `200` The file
- `403` `PRIVATE` and caller is not the owner
- `404` Not found

### `DELETE /uploads/:id`
Auth required, owner only.

- `204` Deleted
- `403` Not the owner
- `404` Not found

## Users

### `GET /users`
Auth required. Lists all other users, sorted by name.

- `200` `[{ id, email, name }]`
- `401` Not authenticated

### `GET /users/search?q=<text>`
Auth required. Case-insensitive search on names, excluding yourself, 20 results at most. Empty or missing `q` returns `[]`.

- `200` `[{ id, name, avatarUrl }]`
- `401` Not authenticated

### `GET /users/me`
Auth required. Your profile.

- `200` `{ id, email, name, faculty, specialization, avatarId, avatarUrl, createdAt }`
- `401` Not authenticated

### `PATCH /users/me`
Auth required. Updates your profile. Every field is optional.

Body: `{ "name"?: string, "email"?: string, "faculty"?: string | null, "specialization"?: string | null, "avatarId"?: string }`

`avatarId` must be an image upload you own. It becomes `PUBLIC` once attached.

- `200` Updated profile (same shape as `GET /users/me`)
- `400` Invalid name or email, invalid `faculty` / `specialization` / `avatarId` type, or `avatarId` is not an image
- `401` Not authenticated
- `403` `avatarId` belongs to someone else
- `404` `avatarId` upload not found
- `409` Email already used by another account

### `PUT /users/me/avatar`
Auth required. Sets the avatar from an upload you own.

Body: `{ "uploadId": string }`

- `200` Updated profile
- `400` Missing `uploadId`, or not an image
- `403` Upload belongs to someone else
- `404` Upload not found

### `GET /users/:id`
Public. Public profile, without email.

- `200` `{ id, name, faculty, specialization, avatarUrl, createdAt }`
- `404` User not found

## Two-factor authentication (TOTP)

Uses any authenticator app (Google Authenticator, Aegis, ...). Setup flow: `setup` returns a QR code, `enable` confirms with a valid code.

### `POST /users/me/2fa/setup`
Auth required. Starts the setup and returns the secret as an `otpauth://` URL and a QR code (data URL).

- `200` `{ otpauthUrl, qrCode }`
- `401` Not authenticated
- `409` 2FA already enabled

### `POST /users/me/2fa/enable`
Auth required. Confirms the setup with a code from the app.

Body: `{ "code": string }` (6 digits)

- `200` `{ twoFactorEnabled: true }`
- `400` Invalid code format, setup not started, or wrong code
- `409` 2FA already enabled

### `POST /users/me/2fa/disable`
Auth required. Turns 2FA off. Asks for the current password (if the account has one) and a valid code.

Body: `{ "password"?: string, "code": string }`

- `200` `{ twoFactorEnabled: false }`
- `400` Invalid code format, 2FA not enabled, or wrong code
- `401` Wrong password

## Friends

Friendship is symmetric: a request becomes a friendship once accepted. Socket events are sent to both users (see the Socket.io section).

`status` values returned by `GET /friends/status/:userId` and `POST /friends/:userId`: `none`, `pending_outgoing`, `pending_incoming`, `friends`.

### `GET /friends`
Auth required. Your accepted friends.

- `200` `[{ id, name, faculty, avatarUrl }]`

### `GET /friends/requests`
Auth required. Incoming pending requests.

- `200` `[{ id, createdAt, from: { id, name, faculty, avatarUrl } }]`

### `GET /friends/status/:userId`
Auth required. Relation between you and another user.

- `200` `{ status }`

### `POST /friends/:userId`
Auth required. Sends a friend request. If that user had already sent you one, the two requests become a friendship immediately.

- `200` Became friends at once: `{ status: "friends" }`
- `201` Request sent: `{ status: "pending_outgoing" }`
- `400` You are the target (`You cannot add yourself`)
- `404` User not found
- `409` Already friends, or request already sent

### `PUT /friends/:userId`
Auth required. Accepts an incoming request from that user.

- `200` `{ status: "friends" }`
- `404` No pending request from that user

### `DELETE /friends/:userId`
Auth required. Removes a friendship, or cancels/declines a pending request.

- `204` Removed
- `404` No friendship or request found

## Chat

Private messages between two users. One conversation per pair of users, messages sorted oldest first.

### `GET /chat/:userId`
Auth required. Messages between you and that user.

- `200` `[{ id, content, conversationId, senderId, createdAt, readAt }]`
- `400` You are the target (`You cannot chat with yourself`)
- `404` User not found

### `POST /chat/:userId`
Auth required. Sends a message.

Body: `{ "content": string }` (1 to 2000 characters after trimming)

- `201` Message object (same fields as above)
- `400` Empty or too long content, or you are the target (`You cannot message yourself`)
- `404` User not found

On success, the server emits `message:new` (see below) to the recipient and to all of the sender's open tabs, with an extra `recipientId` field.

## Dashboard

### `GET /dashboard`
Auth required. Activity stats for the authenticated user.

- `200` `{ articleCounts: { DRAFT, SUBMITTED, REJECTED, PUBLISHED }, reviewCounts: { PENDING, APPROVED, REJECTED }, approvalRate, daysSinceJoined }`
- `401` Not authenticated

`articleCounts` and `reviewCounts` always include all their keys, defaulting to `0`. `approvalRate` is a rounded percentage (`published / (published + rejected)` among your own decided articles), or `null` if none has been decided yet.

## Health

Outside the `/api` prefix. Nginx forwards `/health` and `/status` to the backend.

### `GET /health`
Checks the backend, PostgreSQL (`SELECT 1`) and Redis (`PING`). Each check has a 2-second timeout.

- `200` All services respond: `{ status: "ok", services: { backend, postgres, redis }, checkedAt }`
- `503` At least one of PostgreSQL or Redis is down: `{ status: "degraded", ... }`

Each service entry is `{ status: "ok" | "down", latencyMs, error? }`. `error` is present only when the service is down.

### `GET /status`
Same check, rendered as an HTML page that refreshes every 30 seconds. Same status codes as `/health`.

## Socket.io

Served on the same host, path `/socket.io/` (Nginx does not apply the WAF to this path, see the README).

Events sent by the server:

| Event | Payload | Sent to |
|---|---|---|
| `message:new` | Message object + `recipientId` | Recipient and all of the sender's tabs |
| `friend:request` | `{ userId, otherUserId }` | Target of a new request |
| `friend:accepted` | `{ userId, otherUserId }` | Both users |

## Public API module

The CRUD endpoints on `/articles` can be used without a browser session, with an API key:

| Operation | Endpoint | Auth |
|---|---|---|
| Read a list | `GET /articles/explore` | None (optional key) |
| Read one | `GET /articles/:id` | Key needed for your own drafts |
| Create | `POST /articles` | Key required |
| Update | `PUT /articles/:id` | Key, owner only |
| Delete | `DELETE /articles/:id` | Key, owner only |

Example (replace `<key>`; `-k` skips the local self-signed certificate check, same header for all 5 operations):

```bash
curl -k -X POST https://localhost:8444/api/articles \
  -H "Authorization: Bearer <key>" -H "Content-Type: application/json" \
  -d '{"title": "My article", "content": "Article body"}'
```

The key is created once with a logged-in session (`POST /auth/api-keys`). Rate limits and error format are the same as for the browser.
