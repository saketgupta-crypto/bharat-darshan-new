# Bharat Darshan

Full-stack Indian tourism platform: React + Vite frontend, Express + TypeScript + MongoDB backend, AI itinerary planner via OpenRouter.

```
frontend/   React 19, TS, Vite, Tailwind v4, shadcn/ui, Axios (original design preserved)
backend/    Express, TS, Mongoose, JWT, Zod, Helmet, Resend, Cloudinary, PDFKit, Vitest
render.yaml (backend deploy)   frontend/vercel.json (SPA rewrites)
```

## Panels and roles
| Role | Home | What it does |
|---|---|---|
| public | `/` | destinations, hotels, guides, planner (login needed to generate), contact, shared itineraries `/shared/:token` |
| USER | `/dashboard` | overview, AI planner, My Trips (PDF, share, regenerate day, AI modify), favourites, reviews, profile and preferences |
| GUIDE | `/guide` | profile, languages, pricing, availability, inquiries, reviews. Self-registers, **inactive until an admin approves** |
| ADMIN | `/admin` | only the sections their granted permissions allow |
| SUPER_ADMIN | `/super-admin` | everything, plus admin creation, permissions, activity logs, AI usage, security monitor, system settings |

Admin permissions: `users:manage destinations:write hotels:write guides:manage reviews:moderate contacts:manage analytics:view`. Only SUPER_ADMIN can grant them. The first SUPER_ADMIN is created by the seed script, never through the API. Frontend route guards are for UX only; every API route is authorised on the server.

## Setup
Requirements: Node 20+, a MongoDB Atlas (or local) database.

```bash
# backend
cd backend
cp .env.example .env        # fill values (see below)
npm install
npm run typecheck && npm test
npm run seed                # imports the 4 destinations / 3 hotels / 2 guides, creates super admin
npm run dev                 # http://localhost:5001/api/v1/health

# frontend
cd ../frontend
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:5001/api/v1
npm install && npm run typecheck && npm run dev
```

### Environment (backend/.env)
`MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (each 32+ random chars, different), `FRONTEND_URL` (comma-separated allowlist), `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `CLOUDINARY_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD`.
Without Resend keys, OTP and reset emails are printed to the server console in development (and fail in production). Without Cloudinary keys, uploads return a clear 503. Without OpenRouter keys the planner returns 503.

### AI planner
Set `OPENROUTER_MODEL` to a model id currently listed at https://openrouter.ai/models (not hardcoded, so it never goes stale). The key stays on the server. Output is validated with Zod; malformed JSON is retried once, then returns 502. Prices and travel times are labelled as estimates, and the prompt forbids inventing live availability, hotel prices, opening hours or schedules. Per-user limit: 15 AI calls/hour. Super admins can switch the planner off.

### Auth design
bcrypt (cost 12), 15-minute access token held in memory only, 7-day refresh token in an httpOnly cookie, rotated on every refresh; re-use of a rotated token revokes the whole session family. OTP email verification (10 min, 5 attempts). Reset links are single-use, 30 min, and sign out all sessions. Login/OTP/reset are rate limited, and accounts are never enumerable.

## API (`/api/v1`)
`auth/` register, verify-email, resend-otp, login, refresh, logout, forgot-password, reset-password, me
`users/` profile (GET/PATCH), change-password, dashboard, favorites/:destinationId
`destinations/` list (q, state, category, minBudget, maxBudget, sort, page, limit), featured, popular, states, :slug, :slug/related, + admin POST/PATCH/DELETE, :id/status, :id/images
`hotels/` list (q, location, destination, minPrice, maxPrice, minRating, amenities, sort), :id, + admin CRUD and images
`guides/` list (q, location, destination, language, minExperience, maxPrice, available), :id, `me/*` for the guide panel
`reviews/` list, mine, POST, PATCH/DELETE own (one review per user per target)
`contacts/` POST (rate limited, honeypot, confirmation email)
`itineraries/` list, :id, PATCH, DELETE, :id/pdf, :id/share, shared/:token
`ai/` generate-itinerary, regenerate-itinerary (whole or a single `day`), modify-itinerary
`admin/*` and `super-admin/*` as used by the panels.
Responses: `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details? } }`.

## Deployment
**Backend (Render):** `render.yaml` builds `backend/` (`npm ci --include=dev && npm run build`, start `npm start`, health `/api/v1/health`). Set the `sync: false` variables in the dashboard, then run `npm run seed` once (Render shell or locally with the production URI). Set `FRONTEND_URL` to your Vercel URL.
**Frontend (Vercel):** root directory `frontend`, env `VITE_API_BASE_URL=https://<render-app>.onrender.com/api/v1`. `vercel.json` handles SPA rewrites.
**Cookies:** in production the refresh cookie is `Secure; SameSite=None`. Browsers increasingly block third-party cookies, so for reliable sessions put both apps on subdomains of one domain (e.g. `app.example.com` and `api.example.com`).
**Atlas:** allow Render's outbound IPs (or 0.0.0.0/0 with a strong password) in Network Access.

## Security notes
Helmet, CORS allowlist, Zod validation on every write, escaped regex search, strict profile schema (no role escalation), DB-backed account status on every request (disabling an account takes effect immediately), upload type + magic-byte checks and 5 MB limit, central error handler with no stack traces in production. Not included: CSRF tokens (the API uses bearer tokens; the cookie is only usable on `/auth/*`), 2FA, malware scanning of uploads.

## Known limitations
No booking or payments (hotels and guides use "Enquire"; no live availability). The phone, address and hours on the Contact page are the original placeholder text; replace them with real details. Privacy and Terms pages are templates and need legal review.

```
bharat-darshan-complete
├─ README.md
├─ backend
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ app.ts
│  │  ├─ config
│  │  │  ├─ db.ts
│  │  │  └─ env.ts
│  │  ├─ controllers
│  │  │  ├─ admin.controller.ts
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ contact.controller.ts
│  │  │  ├─ destination.controller.ts
│  │  │  ├─ guide.controller.ts
│  │  │  ├─ hotel.controller.ts
│  │  │  ├─ itinerary.controller.ts
│  │  │  ├─ review.controller.ts
│  │  │  └─ user.controller.ts
│  │  ├─ middleware
│  │  │  ├─ auth.ts
│  │  │  ├─ error.ts
│  │  │  ├─ rateLimit.ts
│  │  │  ├─ upload.ts
│  │  │  └─ validate.ts
│  │  ├─ models
│  │  │  ├─ ActivityLog.ts
│  │  │  ├─ AiUsage.ts
│  │  │  ├─ Contact.ts
│  │  │  ├─ Destination.ts
│  │  │  ├─ Guide.ts
│  │  │  ├─ Hotel.ts
│  │  │  ├─ Itinerary.ts
│  │  │  ├─ RefreshToken.ts
│  │  │  ├─ Review.ts
│  │  │  ├─ Setting.ts
│  │  │  └─ User.ts
│  │  ├─ routes
│  │  │  ├─ admin.routes.ts
│  │  │  ├─ auth.routes.ts
│  │  │  ├─ content.routes.ts
│  │  │  ├─ index.ts
│  │  │  ├─ itinerary.routes.ts
│  │  │  └─ user.routes.ts
│  │  ├─ scripts
│  │  │  └─ seed.ts
│  │  ├─ server.ts
│  │  ├─ services
│  │  │  ├─ activity.service.ts
│  │  │  ├─ ai.service.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ cloudinary.service.ts
│  │  │  ├─ email.service.ts
│  │  │  ├─ pdf.service.ts
│  │  │  └─ review.service.ts
│  │  ├─ types
│  │  │  └─ index.ts
│  │  ├─ utils
│  │  │  ├─ AppError.ts
│  │  │  ├─ asyncHandler.ts
│  │  │  ├─ pagination.ts
│  │  │  ├─ response.ts
│  │  │  ├─ text.ts
│  │  │  └─ tokens.ts
│  │  └─ validators
│  │     ├─ auth.validators.ts
│  │     └─ content.validators.ts
│  ├─ tests
│  │  ├─ access.test.ts
│  │  ├─ ai.test.ts
│  │  ├─ auth.test.ts
│  │  ├─ helpers.ts
│  │  └─ setup.ts
│  ├─ tsconfig.json
│  └─ vitest.config.ts
├─ frontend
│  ├─ components.json
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ 111.jpg
│  │  ├─ 123.jpg
│  │  ├─ Taj.jpeg
│  │  ├─ beautiful-indian-landscape-taj-mahal-golden-hour.jpg
│  │  ├─ contact.jpg
│  │  ├─ contact2.jpg
│  │  ├─ desert.jpeg
│  │  ├─ guides.jpg
│  │  ├─ hawa.jpeg
│  │  ├─ hotel.jpg
│  │  ├─ itinerary.jpg
│  │  ├─ kashi-ghat.jpeg
│  │  ├─ kerala.jpeg
│  │  ├─ kumarakom-lake-resort.jpg
│  │  ├─ man.jpg
│  │  ├─ man2.webp
│  │  ├─ oberoi.webp
│  │  ├─ suryagarh.avif
│  │  └─ varanasi.jpeg
│  ├─ src
│  │  ├─ App.tsx
│  │  ├─ components
│  │  │  ├─ CrudManager.tsx
│  │  │  ├─ DataState.tsx
│  │  │  ├─ DestinationCard.tsx
│  │  │  ├─ Footer.tsx
│  │  │  ├─ GuideCard.tsx
│  │  │  ├─ Header.tsx
│  │  │  ├─ HotelCard.tsx
│  │  │  ├─ ItineraryCard.tsx
│  │  │  ├─ ItineraryView.tsx
│  │  │  ├─ Pager.tsx
│  │  │  ├─ PanelLayout.tsx
│  │  │  ├─ RequireAuth.tsx
│  │  │  ├─ ReviewsSection.tsx
│  │  │  ├─ theme-provider.tsx
│  │  │  └─ ui
│  │  │     ├─ accordion.tsx
│  │  │     ├─ alert-dialog.tsx
│  │  │     ├─ alert.tsx
│  │  │     ├─ aspect-ratio.tsx
│  │  │     ├─ avatar.tsx
│  │  │     ├─ badge.tsx
│  │  │     ├─ breadcrumb.tsx
│  │  │     ├─ button.tsx
│  │  │     ├─ calendar.tsx
│  │  │     ├─ card.tsx
│  │  │     ├─ carousel.tsx
│  │  │     ├─ chart.tsx
│  │  │     ├─ checkbox.tsx
│  │  │     ├─ collapsible.tsx
│  │  │     ├─ command.tsx
│  │  │     ├─ context-menu.tsx
│  │  │     ├─ dialog.tsx
│  │  │     ├─ drawer.tsx
│  │  │     ├─ dropdown-menu.tsx
│  │  │     ├─ form.tsx
│  │  │     ├─ hover-card.tsx
│  │  │     ├─ input-otp.tsx
│  │  │     ├─ input.tsx
│  │  │     ├─ label.tsx
│  │  │     ├─ menubar.tsx
│  │  │     ├─ navigation-menu.tsx
│  │  │     ├─ pagination.tsx
│  │  │     ├─ popover.tsx
│  │  │     ├─ progress.tsx
│  │  │     ├─ radio-group.tsx
│  │  │     ├─ resizable.tsx
│  │  │     ├─ scroll-area.tsx
│  │  │     ├─ select.tsx
│  │  │     ├─ separator.tsx
│  │  │     ├─ sheet.tsx
│  │  │     ├─ sidebar.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ slider.tsx
│  │  │     ├─ sonner.tsx
│  │  │     ├─ switch.tsx
│  │  │     ├─ table.tsx
│  │  │     ├─ tabs.tsx
│  │  │     ├─ textarea.tsx
│  │  │     ├─ toast.tsx
│  │  │     ├─ toaster.tsx
│  │  │     ├─ toggle-group.tsx
│  │  │     ├─ toggle.tsx
│  │  │     ├─ tooltip.tsx
│  │  │     ├─ use-mobile.tsx
│  │  │     └─ use-toast.ts
│  │  ├─ context
│  │  │  └─ AuthContext.tsx
│  │  ├─ globals.css
│  │  ├─ hooks
│  │  │  ├─ use-mobile.ts
│  │  │  ├─ use-toast.ts
│  │  │  └─ useAsync.ts
│  │  ├─ lib
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ ContactPage.tsx
│  │  │  ├─ DashboardPage.tsx
│  │  │  ├─ DestinationDetailPage.tsx
│  │  │  ├─ DestinationsPage.tsx
│  │  │  ├─ GuidesPage.tsx
│  │  │  ├─ HomePage.tsx
│  │  │  ├─ HotelDetailPage.tsx
│  │  │  ├─ HotelsPage.tsx
│  │  │  ├─ ItineraryPage.tsx
│  │  │  ├─ ProfilePage.tsx
│  │  │  ├─ SharedItineraryPage.tsx
│  │  │  ├─ StaticPages.tsx
│  │  │  ├─ admin
│  │  │  │  └─ AdminPages.tsx
│  │  │  ├─ auth
│  │  │  │  ├─ ForgotPasswordPage.tsx
│  │  │  │  ├─ LoginPage.tsx
│  │  │  │  ├─ ResetPasswordPage.tsx
│  │  │  │  ├─ SignupPage.tsx
│  │  │  │  └─ VerifyEmailPage.tsx
│  │  │  ├─ guide
│  │  │  │  └─ GuidePages.tsx
│  │  │  ├─ superadmin
│  │  │  │  └─ SuperAdminPages.tsx
│  │  │  └─ user
│  │  │     ├─ FavoritesPage.tsx
│  │  │     ├─ MyReviewsPage.tsx
│  │  │     ├─ MyTripsPage.tsx
│  │  │     └─ TripDetailPage.tsx
│  │  ├─ services
│  │  │  ├─ admin.service.ts
│  │  │  ├─ api.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ destination.service.ts
│  │  │  ├─ guide.service.ts
│  │  │  ├─ hotel.service.ts
│  │  │  ├─ itinerary.service.ts
│  │  │  ├─ misc.service.ts
│  │  │  └─ user.service.ts
│  │  ├─ styles
│  │  ├─ types
│  │  │  └─ index.ts
│  │  ├─ utils
│  │  ├─ vite-env.d.ts
│  │  └─ {services,context,types,utils}
│  ├─ tsconfig.json
│  ├─ vercel.json
│  └─ vite.config.ts
└─ render.yaml

```