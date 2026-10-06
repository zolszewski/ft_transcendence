
*This project has been created as part of the 42 curriculum by zoolszew, rlaigle and kaizatov.*

## Description

**OpenScholar** is an academic publishing platform.

Users can:
- Create and publish articles
- Submit articles for peer review
- Search, comment and like articles
- Get personalized article recommendations
- Add friends and chat in real time
- Sign in with GitHub or enable 2FA

The project also includes a public API, security features, backups and monitoring.

## Installation

### Requirements

- Docker + Docker Compose v2
- GNU Make
- A GitHub OAuth application

### Setup

First, run:

```bash
make
```

This creates `platform/.env` from `platform/.env.example`.

Edit `platform/.env` and configure:

- PostgreSQL credentials
- `DATABASE_URL`
- `REDIS_URL`
- `BACKEND_URL`
- `SESSION_SECRET`
- GitHub OAuth credentials
- `GITHUB_CALLBACK_URL`
- `BACKUP_INTERVAL`
- `BACKUP_KEEP`

You can generate a session secret with:

```bash
openssl rand -hex 32
```

Then run:

```bash
make
```

Open:

**https://localhost:8444**

The HTTPS certificate is self-signed, so your browser may display a warning.

### Useful commands

```bash
make        # Build and start the project
make down   # Stop the project
make logs   # Show logs
make re     # Rebuild and restart
make clean  # Remove containers and volumes
```

More information about backups, restore, WAF and Vault:

`docs/infrastructure.md`

---

## Main Features

| Feature | Description |
|---      |---|
| Authentication | Email/password, GitHub OAuth and 2FA |
| Articles       | Create, edit and submit articles for review |
| Peer review    | Approve or reject articles |
| Search          | Search, sorting and pagination |
| Recommendations | ML-based article recommendations |
| Social          | Profiles, friends, likes and comments |
| Chat            | Real-time private messaging with Socket.IO |
| Public API      | API keys, rate limiting and documentation |
| Dashboard | User activity statistics |
| File uploads | Images and PDF documents |
| Security | WAF, Vault, rate limiting and secure sessions |
| Infrastructure | Health checks and automatic backups |

## Technical Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Socket.IO Client

### Backend

- Express 5
- TypeScript
- Socket.IO
- Prisma
- PostgreSQL
- Redis
- Hugging Face Transformers

### Infrastructure

- Docker Compose
- Nginx
- ModSecurity + OWASP CRS
- HashiCorp Vault

### Architecture

The project is split into a **Next.js frontend** and an **Express API**.

PostgreSQL stores the main application data, while Redis is used for sessions. Socket.IO provides real-time communication for the chat and online status.

The recommendation system uses article embeddings generated with `all-MiniLM-L6-v2`.

---

## Project Structure

```text
.
├── platform/
│   ├── app/          # Next.js frontend
│   ├── backend/      # Express API
│   └── ...
├── docs/
│   └── infrastructure.md
└── Makefile
```

## Team

| Member | Main responsibilities |
|---|---|
| **zoolszew** | User management, architecture, code reviews |
| **kaizatov** | Real-time chat, planning, documentation |
| **rlaigle** | Public API, backlog, testing |

All members also contributed to authentication, articles, reviews, search, recommendations and infrastructure.

## 42 Modules

| Module | Type | Points |
|---|---|---:|
| Frontend + Backend Frameworks | Major | 2 |
| WebSockets | Major | 2 |
| User Interaction | Major | 2 |
| Public API | Major | 2 |
| Standard User Management | Major | 2 |
| ML Recommendation System | Major | 2 |
| WAF + Vault | Major | 2 |
| ORM (Prisma) | Minor | 1 |
| Advanced Search | Minor | 1 |
| File Upload | Minor | 1 |
| Design System | Minor | 1 |
| OAuth 2.0 | Minor | 1 |
| 2FA | Minor | 1 |
| Analytics Dashboard | Minor | 1 |
| Additional Browsers | Minor | 1 |
| Health Check + Backups | Minor | 1 |
| **Total** | **7 Major + 9 Minor** | **23** |

## Individual Contributions

### zoolszew

**User management**
- Profiles and avatars
- Friends system
- Online status
- Architecture and code reviews

**Main challenge:** keeping online status correct when a user has multiple tabs open.

### rlaigle

**Public API**
- API keys
- Rate limiting
- API documentation
- Testing and backlog management

**Main challenge:** securely storing API keys and choosing appropriate rate limits.

### kaizatov

**Real-time chat**
- Socket.IO
- Conversations and messages
- Chat UI
- Planning and documentation

**Main challenge:** keeping messages and unread counters synchronized in real time.


## Resources

- Next.js: https://nextjs.org/docs
- Express: https://expressjs.com
- Prisma: https://www.prisma.io/docs
- Socket.IO: https://socket.io/docs/v4/
- Tailwind CSS: https://tailwindcss.com/docs
- GitHub OAuth: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- OWASP CRS: https://coreruleset.org/docs/
- HashiCorp Vault: https://developer.hashicorp.com/vault/docs
- Transformers.js: https://huggingface.co/docs/transformers.js

## Use of AI

AI was used for:
- Drafting the Privacy Policy and Terms of Service
- Drafting and translating documentation
- Explaining errors
- Reviewing code
