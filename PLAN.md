DAY 01 — ARCHITECTURE
---------------------
Developer A:
- Finalize Express backend structure #ZOE : is it ok ? 
- Configure environment variables.
- *Create backend health endpoint*. API ? #RAPH
- Verify Docker networking.

Developer B:
- Audit Next.js structure.
- Define page/routing structure.
- Define shared UI components and layout.

Integration:
- Both services start correctly with Docker.
- Agree on API conventions and Git workflow.


DAY 02 — DATABASE MODEL
-----------------------
Developer A:
- Finalize Prisma schema.
- Define User, Article, Review and Comment models.
- Define enums and relationships.
- Review indexes and constraints.

Developer B:
- Review database model from frontend perspective.
- Define required frontend TypeScript types.

Integration:
- Freeze the initial database model.


DAY 03 — PRISMA SETUP
---------------------
Developer A:
- Configure Prisma 7.
- Configure prisma.config.ts.
- Generate Prisma Client.
- Create first migration.
- *Configure Prisma singleton.*   #ZOE
- Verify PostgreSQL connectivity.

Developer B:
- Prepare frontend data layer structure.
- Create API client foundation.

Integration:
- Verify database migration from a clean environment.


DAY 04 — USER MODEL
-------------------
Developer A:
- Implement User repository/service. #FIRST ACTION FOR RAPH - What does it mean ? 
- Add user validation.
- Add database error handling.

Developer B:
- Build registration page.
- Build reusable form/input components.
- Add client-side validation.

Integration:
- Registration request reaches backend and creates a user.


DAY 05 — AUTHENTICATION
-----------------------
Developer A:
- Implement registration API.
- Implement password hashing.
- Implement login API.
- Define authentication strategy.

Developer B:
- Build login page.
- Build authentication state.
- Build logout flow.

Integration:
- User can register, login and logout.  #HERE -> MEETING 


DAY 06 — AUTHORIZATION
----------------------
Developer A:
- Implement authentication middleware.
- Implement authorization helpers. # RAPH
- Protect private API endpoints.

Developer B:
- Protect dashboard routes.
- Handle unauthenticated users.
- Add authenticated navigation.

Integration:
- Protected frontend and backend routes work correctly.


DAY 07 — ARTICLE READ API
-------------------------
Developer A:
- Implement Article service.
- Implement article listing endpoint.
- Implement article detail endpoint.
- Add author relations.

Developer B:
- Build article listing page.
- Build article detail page.

Integration:
- Frontend successfully retrieves articles from Express API.


DAY 08 — ARTICLE CREATION
-------------------------
Developer A:
- Implement article creation endpoint.
- Implement article update endpoint.
- Implement article deletion endpoint.
- Add ownership checks.

Developer B:
- Build article editor.
- Build create/edit forms.
- Add draft UI.

Integration:
- Authenticated users can create and edit drafts.


DAY 09 — ARTICLE SUBMISSION
---------------------------
Developer A:
- Implement article status transitions.
- Add submission endpoint.
- Prevent unauthorized transitions.

Developer B:
- Add submit-for-review UI.
- Add article status indicators.

Integration:
- DRAFT -> SUBMITTED workflow works.


DAY 10 — REVIEW SYSTEM
----------------------
Developer A:
- Implement Review model services.
- Implement review creation/listing endpoints.
- Implement reviewer authorization.

Developer B:
- Build review queue.
- Build review detail interface.

Integration:
- Reviewer can access submitted articles.


DAY 11 — REVIEW DECISIONS
-------------------------
Developer A:
- Implement approve/reject endpoints.
- Enforce valid review transitions.
- Update article status appropriately.
- Filter public article listing/detail endpoints to only return PUBLISHED articles (delay from Day 7 for easier testing while no article was PUBLISHED yet). #RAPH

Developer B:
- Build approve/reject controls.
- Build review form.
- Display review status.

Integration:
- Complete peer-review workflow works end-to-end.


DAY 12 — COMMENTS
-----------------
Developer A:
- Implement Comment API.
- Add create/delete permissions.
- Validate comment input.

Developer B:
- Build comments list.
- Build comment composer.
- Add delete controls where authorized.

Integration:
- Users can comment on articles.


DAY 13 — SEARCH AND FILTERING
-----------------------------
Developer A:
- Add article search/filter parameters.
- Add sorting.
- Add pagination.

Developer B:
- Add search UI.
- Add filters and sorting controls.
- Add pagination controls.

Integration:
- Users can efficiently find articles.


DAY 14 — REDIS
-------------
Developer A:
- Integrate Redis.
- Define caching strategy.
- Add rate-limit foundation or session/cache support.

Developer B:
- Integrate frontend behavior with cached API endpoints.
- Verify loading and stale-data behavior.

Integration:
- Redis provides a meaningful backend function.


DAY 15 — API QUALITY
--------------------
Developer A:
- Centralize API errors.
- Add request validation.
- Add structured logging.
- Standardize API responses.

Developer B:
- Improve form validation.
- Improve API error messages.
- Add loading/empty/error states.

Integration:
- Consistent API contract and UX.


DAY 16 — SECURITY BASELINE
--------------------------
Developer A:
- Configure CORS.
- Add security headers.
- Add rate limiting.
- Review authentication security.
- Protect sensitive endpoints.

Developer B:
- Protect frontend routes.
- Review XSS risks.
- Review unsafe rendering and user input.

Integration:
- First security review completed.


DAY 17 — API CONTRACT
---------------------
Developer A:
- Document all API endpoints.
- Define request/response formats.
- Add initial integration tests.

Developer B:
- Create typed frontend API client.
- Define shared TypeScript interfaces.
- Remove duplicated API assumptions.

Integration:
- Frontend/backend contract is stable.


DAY 18 — DASHBOARD
------------------
Developer A:
- Implement dashboard aggregation endpoints.
- Return article/review/activity data.
- Add a way for an author to see their own non-PUBLISHED articles (draft/submitted/rejected). Since Day 11, GET /api/articles/:id only returns PUBLISHED articles for everyone, including the author - authors currently have no way to view their own unpublished work. #RAPH

Developer B:
- Build student dashboard.
- Show articles, statuses, reviews and activity.

Integration:
- Authenticated user has a functional dashboard.


DAY 19 — RECOMMENDATION FOUNDATION
----------------------------------
Developer A:
- Define recommendation architecture.
- Create recommendation service.
- Define scoring interface.

Developer B:
- Build recommendation cards/components.
- Add recommendation section to dashboard/discovery.

Integration:
- Recommendation API contract is established.


DAY 20 — BASIC RECOMMENDATIONS
------------------------------
Developer A:
- Implement simple recommendation algorithm.
- Use article metadata/content signals.
- Expose recommendation endpoint.

Developer B:
- Integrate recommendation endpoint.
- Add loading and empty states.

Integration:
- Users receive basic article recommendations.


DAY 21 — DATABASE OPTIMIZATION
-----------------------------
Developer A:
- Review slow queries.
- Add useful indexes.
- Optimize Prisma queries.
- Verify relational queries.
- Move the PUBLISHED filter on GET /api/articles from an in-app .filter() (added Day 11) into the Prisma query itself (where: { status: "PUBLISHED" }) - fetches only what's needed instead of everything. #RAPH

Developer B:
- Review frontend request patterns.
- Reduce unnecessary requests.
- Improve rendering performance.

Integration:
- Establish a basic performance baseline.


DAY 22 — DOCKER HARDENING
-------------------------
Developer A:
- Improve backend Dockerfile.
- Add health checks.
- Verify PostgreSQL and Redis startup.
- Verify migrations in clean environments.

Developer B:
- Improve Next.js Docker configuration.
- Verify development volumes.
- Verify production build configuration.

Integration:
- Full stack starts reliably from Docker Compose.


DAY 23 — NGINX
-------------
Developer A:
- Configure Nginx reverse proxy.
- Route frontend and API traffic.
- Configure HTTPS/dev routing.

Developer B:
- Verify frontend requests through Nginx.
- Fix absolute/relative API URL issues.
- Test browser behavior.

Integration:
- Nginx becomes the single external entry point.


DAY 24 — BACKEND TESTING
------------------------
Developer A:
- Add tests for authentication.
- Add article tests.
- Add review tests.
- Add comment tests.
- Test authorization failures.

Developer B:
- Define frontend acceptance scenarios.
- Test critical pages and user flows.

Integration:
- Core functionality has automated/structured coverage.


DAY 25 — FAILURE HANDLING
-------------------------
Developer A:
- Test PostgreSQL unavailable.
- Test Redis unavailable.
- Test invalid authentication.
- Test malformed API requests.
- Improve backend recovery/errors.

Developer B:
- Improve loading states.
- Improve retry behavior.
- Improve error notifications.
- Improve empty states.

Integration:
- Application fails gracefully.


DAY 26 — SECURITY REVIEW
------------------------
Developer A:
- Review secrets management.
- Review dependency vulnerabilities.
- Review authorization.
- Review SQL/Prisma input handling.
- Review API exposure.

Developer B:
- Review XSS.
- Review protected pages.
- Review client-side validation.
- Review sensitive information displayed in UI.

Integration:
- Fix all high-priority security findings.


DAY 27 — DEPLOYMENT PREPARATION
------------------------------
Developer A:
- Document database migration process.
- Document environment variables.
- Document seed/reset process.
- Prepare deployment configuration.

Developer B:
- Responsive UI pass.
- Accessibility pass.
- Visual consistency pass.
- Final navigation review.

Integration:
- Deployment documentation is complete.


DAY 28 — FEATURE FREEZE
-----------------------
Developer A:
- Run full backend integration tests.
- Verify Prisma migrations.
- Verify Redis.
- Verify Docker rebuild from clean state.

Developer B:
- Run full frontend regression test.
- Test authentication.
- Test article workflow.
- Test review workflow.
- Test comments/dashboard.

Integration:
- Feature freeze.
- Only bugs and critical improvements after this point.


DAY 29 — RELEASE CANDIDATE
--------------------------
Developer A:
- Fix backend bugs.
- Clean Docker rebuild.
- Verify database state.
- Verify migrations.
- Verify production configuration.

Developer B:
- Fix frontend bugs.
- Browser testing.
- Final UX polish.
- Verify responsive layouts.

Integration:
- Release candidate build.


DAY 30 — FINAL INTEGRATION AND DEMO
-----------------------------------
Developer A:
- Final backend verification.
- Security verification.
- Performance verification.
- Prepare technical demo.

Developer B:
- Final frontend verification.
- Prepare user demo flow.
- Prepare screenshots/documentation.

Integration:
- Final MVP release.
- Full demo.
- Architecture presentation.
- Known limitations documented.


RESPONSIBILITY SUMMARY
----------------------

DEVELOPER A
-----------
Primary ownership:
- Express API
- Prisma
- PostgreSQL
- Redis
- Authentication backend
- Authorization
- Business logic
- API validation
- Security backend
- Docker backend
- Nginx/infrastructure
- Backend tests
- Migrations/deployment

DEVELOPER B
-----------
Primary ownership:
- Next.js
- React components
- Pages and routing
- Authentication UI
- Article UI
- Review UI
- Dashboard
- Search/filter UI
- Recommendation UI
- UX/accessibility
- Frontend tests
- Frontend performance

BOTH DEVELOPERS
---------------
- Database schema decisions
- API contracts
- Security reviews
- Integration testing
- Git/code reviews
- Docker integration
- Final deployment
- Documentation


MILESTONES
----------
