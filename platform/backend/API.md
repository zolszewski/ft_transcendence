# API Reference

Base URL: `https://<host>:8443/api` (via Nginx) or `http://localhost:4000/api` (direct, from the backend container).

## Authentication

Two methods are accepted, interchangeably, on every protected route:

- **Session cookie** (browser usage): obtained via `POST /auth/register` or `POST /auth/login`, sent automatically by the browser afterwards.
- **API key** (script / third-party integration usage): header `Authorization: Bearer <key>`, obtained via `POST /auth/api-keys`. The raw key is shown only once, at creation time. Only its SHA-256 hash is stored server-side, it is never stored in clear text.

```bash
curl https://<host>:8443/api/articles/<id> -H "Authorization: Bearer <your key>"
```

## Rate limiting

- Global, all `/api/*` routes: 100 requests / 15 min per IP.
- `POST /auth/login` and `POST /auth/register`: 10 failed attempts / 15 min per IP (successful requests do not count toward this quota).

Exceeding the limit returns `429 Too Many Requests`, with `RateLimit`/`RateLimit-Policy` headers showing the remaining quota.

## Error format

Every expected error (validation, permissions, missing resource, etc.) returns `{ "error": "message" }` with the matching HTTP status code (`400`/`401`/`403`/`404`/`409`). Any unexpected error returns `500 { "error": "Something went wrong" }`, with the technical detail logged server-side only.

Routes marked "Auth required" accept either authentication method above. Routes marked "Owner only" additionally require the authenticated identity to own the resource.

---

## Auth

### `POST /auth/register`
Creates an account and opens a session. Rate limited.

Body: `{ "email": string, "name": string, "password": string (min 8 characters) }`

| Code | Case |
|---|---|
| 201 | `{ id, email, name }` |
| 400 | Invalid fields |
| 409 | Email already in use |

### `POST /auth/login`
Opens a session on an existing account. Rate limited.

Body: `{ "email": string, "password": string }`

| Code | Case |
|---|---|
| 200 | `{ id, email, name }` |
| 400 | Invalid fields |
| 401 | Invalid credentials |

### `POST /auth/logout`
Closes the current session.

| Code | Case |
|---|---|
| 200 | `{ success: true }` |

### `POST /auth/api-keys`
Auth required. Generates a new API key for the authenticated account.

| Code | Case |
|---|---|
| 201 | `{ apiKey: string }`. The key is shown in clear text once, save it, it will not be shown again. |
| 401 | Not authenticated |

### `GET /auth/me`
Auth required. Returns the identity of the authenticated user.

| Code | Case |
|---|---|
| 200 | `{ id, email, name }` |
| 401 | Not authenticated |

---

## Articles

Every article object returned by these routes includes a computed `miniatureUrl`: a link to the attached upload (`/api/uploads/:id`) if `miniatureId` is set, otherwise a fixed placeholder path (`/default-article-thumbnail.png`) so a client can always render something.

### `GET /articles/explore`
Lists published articles, paginated. Public, no authentication required.

Query: `search?` (title/content), `sort?` (`newest` by default, or `oldest`), `page?` (default 1), `limit?` (default 10, max 50)

| Code | Case |
|---|---|
| 200 | `{ articles: Article[], total, page, totalPages }` |

### `GET /articles/submitted`
Auth required. Lists articles awaiting review: status `SUBMITTED`, excluding your own articles and articles you already reviewed. Same query params as `/explore`.

| Code | Case |
|---|---|
| 200 | `{ articles: Article[], total, page, totalPages }` |

### `GET /articles/:id`
Visibility depends on the article's status and who is asking:
- `PUBLISHED`: visible to everyone.
- Any other status: visible to the article's author, and also to any authenticated user if the status is `SUBMITTED` (for reviewing). Everyone else gets 404, including anonymous visitors, so an article's existence is never revealed to someone who can't see it.

| Code | Case |
|---|---|
| 200 | `Article` |
| 404 | Not found, or not visible to the current caller |

### `POST /articles`
Auth required. Creates an article (initial status `DRAFT`). `miniatureId` must reference an upload owned by the caller, of an image type; it is switched to `PUBLIC` visibility automatically once attached.

Body: `{ "title": string, "content": string, "abstract"?: string, "miniatureId"?: string }`

| Code | Case |
|---|---|
| 201 | `Article` |
| 400 | Invalid title/content, or `miniatureId` is not an image |
| 401 | Not authenticated |
| 403 | `miniatureId` does not belong to the caller |
| 404 | `miniatureId` does not exist |

### `PUT /articles/:id`
Auth required, owner only. Updates your own article. Same `miniatureId` rules as `POST /articles`.

Body: `{ "title": string, "content": string, "abstract"?: string, "miniatureId"?: string }`

| Code | Case |
|---|---|
| 200 | Updated `Article` |
| 400 | Invalid title/content, or `miniatureId` is not an image |
| 403 | Not the author, or `miniatureId` does not belong to the caller |
| 404 | Article not found, or `miniatureId` does not exist |

### `DELETE /articles/:id`
Auth required, owner only. Deletes your own article.

| Code | Case |
|---|---|
| 204 | Deleted |
| 403 | Not the author |
| 404 | Article not found |

### `POST /articles/:id/submit`
Auth required, owner only. Submits your own article (`DRAFT` to `SUBMITTED`) for review.

| Code | Case |
|---|---|
| 200 | Updated `Article` |
| 403 | Not the author |
| 404 | Article not found |
| 409 | Not in `DRAFT` status |

### `POST /articles/:id/reviews`
Auth required. Submits a review on a `SUBMITTED` article (not allowed on your own article, one review per reviewer per article).

Body: `{ "comment"?: string }`

| Code | Case |
|---|---|
| 201 | `Review` (status `PENDING`) |
| 403 | Author of the article |
| 404 | Article not found |
| 409 | Not in `SUBMITTED` status, or already reviewed by this reviewer |

### `GET /articles/:id/reviews`
Auth required. Restricted to the article's author and reviewers who contributed a review on it.

| Code | Case |
|---|---|
| 200 | `Review[]` |
| 403 | Neither the author nor a reviewer of this article |
| 404 | Article not found |

### `POST /articles/:id/comments`
Auth required. Comments on a published article.

Body: `{ "content": string }`

| Code | Case |
|---|---|
| 201 | `Comment` |
| 400 | Invalid content |
| 404 | Article not found or not published |

### `GET /articles/:id/comments`
Lists an article's comments. Public.

| Code | Case |
|---|---|
| 200 | `Comment[]` |

---

## Reviews

### `PATCH /reviews/:id`
Auth required, owner only. Decides a review you wrote yourself (`PENDING` only). Also updates the article's status (`APPROVED` sets the article to `PUBLISHED`, `REJECTED` sets it to `REJECTED`).

Body: `{ "decision": "APPROVED" | "REJECTED" }`

| Code | Case |
|---|---|
| 200 | Updated `Review` |
| 400 | Invalid decision |
| 403 | Not the author of the review |
| 404 | Review not found |
| 409 | Already decided |

---

## Comments

### `DELETE /comments/:id`
Auth required, owner only. Deletes your own comment.

| Code | Case |
|---|---|
| 204 | Deleted |
| 403 | Not the author |
| 404 | Comment not found |

---

## Health

### `GET /health`
Service availability check. Outside the `/api` prefix.

| Code | Case |
|---|---|
| 200 | `{ status: "ok", service: "backend" }` |

---

## Public API module

The 5 CRUD endpoints on `/articles` (`GET /articles/explore`, `GET /articles/:id`, `POST /articles`, `PUT /articles/:id`, `DELETE /articles/:id`) cover GET/POST/PUT/DELETE, all usable through an API key (`Authorization: Bearer`), with the rate limiting and documentation described above.
