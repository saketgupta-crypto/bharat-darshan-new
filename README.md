# Bharat Darshan 🇮🇳

**Discover India. Explore its heritage. Plan your journey with AI.**

Bharat Darshan is a full-stack Indian tourism platform that helps travellers explore destinations, discover hotels and local guides, and create personalised travel itineraries with an AI-powered planner.

<p align="center">
  <a href="https://bharat-darshan-bice.vercel.app/">Live Frontend Demo</a>
</p>

> 
---

## ✨ Features

### Traveller experience
- Browse Indian destinations and view destination details.
- Discover hotels and travel guides.
- Search and filter destinations, hotels, and guides.
- Generate personalised itineraries using AI.
- Save and manage favourite destinations.
- Manage trips, regenerate an itinerary day, and request AI modifications.
- Export itineraries as PDF and share trips using public share links.
- Submit and manage reviews.
- Manage profile and preferences.

### Role-based panels

| Role | Panel | Capabilities |
|---|---|---|
| Public visitor | `/` | Browse destinations, hotels, guides, contact page, and shared itineraries |
| `USER` | `/dashboard` | Dashboard, AI planner, trips, favourites, reviews, profile, and preferences |
| `GUIDE` | `/guide` | Manage guide profile, languages, pricing, availability, inquiries, and reviews |
| `ADMIN` | `/admin` | Manage only the sections permitted by assigned permissions |
| `SUPER_ADMIN` | `/super-admin` | Full administration, admin creation, permissions, activity logs, AI usage, security monitor, and system settings |

**Admin permissions:** `users:manage`, `destinations:write`, `hotels:write`, `guides:manage`, `reviews:moderate`, `contacts:manage`, and `analytics:view`.

Only a `SUPER_ADMIN` can grant admin permissions. The first `SUPER_ADMIN` is created through the seed script, not through public registration. Frontend route guards improve navigation and user experience; API authorization is enforced on the backend.

### AI itinerary planner
- Generates structured travel plans through OpenRouter.
- Supports full itinerary regeneration, single-day regeneration, and itinerary modification.
- Validates AI output before it is used by the application.
- Treats prices and travel times as estimates; it does not claim live booking availability.
- Applies a per-user AI request limit. The planner can also be disabled by a super admin.

---

## 🧰 Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling & UI | Tailwind CSS v4, shadcn/ui |
| API communication | Axios |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | JWT, refresh-token rotation, bcrypt |
| Validation | Zod |
| AI | OpenRouter |
| Email | Resend |
| Media uploads | Cloudinary |
| PDF generation | PDFKit |
| Security | Helmet, CORS allowlist, rate limiting |
| Testing | Vitest |
| Frontend deployment configuration | Vercel |
| Backend deployment configuration | Render |

---

## 📁 Project Structure

```text
bharat-darshan/
├── README.md
├── render.yaml
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vitest.config.ts
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── lib/
    │   ├── pages/
    │   ├── services/
    │   ├── styles/
    │   ├── types/
    │   └── utils/
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vercel.json
    └── vite.config.ts
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 20 or later
- npm
- MongoDB Atlas account or a local MongoDB instance

### 1. Clone the repository

```bash
git clone https://github.com/saketgupta-crypto/Bharat-darshan.git
cd Bharat-darshan
```

### 2. Configure and run the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and add the required values (see [Environment Variables](#-environment-variables)).

Run the checks and seed the database:

```bash
npm run typecheck
npm test
npm run seed
```

Start the development server:

```bash
npm run dev
```

The backend health endpoint is:

```text
http://localhost:5001/api/v1/health
```

### 3. Configure and run the frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

Set the frontend API URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

Start the frontend:

```bash
npm run dev
```

Vite normally serves the app at:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

Never commit real `.env` files, API keys, database credentials, or JWT secrets. Use `.env.example` as the template and configure production values in the hosting provider's environment settings.

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port (the project setup uses `5001`) |
| `NODE_ENV` | Runtime environment, such as `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Separate secret used to sign refresh tokens |
| `FRONTEND_URL` | Allowed frontend origin(s); use the format expected by the backend configuration |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI itinerary features |
| `OPENROUTER_MODEL` | OpenRouter model identifier |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend API key for email delivery |
| `EMAIL_FROM` | Verified sender address used for outgoing email |
| `SEED_SUPER_ADMIN_EMAIL` | Email for the initial super-admin account |
| `SEED_SUPER_ADMIN_PASSWORD` | Password for the initial super-admin account |

Use different, randomly generated secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Each must meet the minimum length required by the backend environment validator.

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

Only expose values intended to be public in frontend environment variables. Never put private API keys or database credentials in `VITE_*` variables.

### Optional service behaviour
- Without Resend credentials, development email behaviour follows the backend email service configuration; production email delivery requires valid provider configuration.
- Image uploads require valid Cloudinary credentials.
- AI itinerary generation requires a valid OpenRouter API key and model configuration.

---

## 🔌 API Overview

Base path: `/api/v1`

| Endpoint group | Main functionality |
|---|---|
| `auth/` | Registration, email verification, login, refresh, logout, forgot password, reset password, and current user |
| `users/` | Profile, password changes, dashboard, and favourites |
| `destinations/` | Destination listing, filters, featured/popular destinations, states, details, and admin management |
| `hotels/` | Hotel listing, filters, details, and admin management |
| `guides/` | Guide listing, filters, details, and guide self-service routes |
| `reviews/` | List, create, update, and delete reviews according to ownership rules |
| `contacts/` | Contact form submission |
| `itineraries/` | Saved itineraries, updates, deletion, PDF export, sharing, and shared itinerary access |
| `ai/` | Itinerary generation, full/day regeneration, and AI modification |
| `admin/` | Admin panel operations subject to assigned permissions |
| `super-admin/` | Super-admin operations and system management |

Successful responses use the following general shape:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error responses use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "A readable error message"
  }
}
```

---

## 🚀 Deployment

### Frontend — Vercel
1. Import the GitHub repository into Vercel.
2. Set the project root directory to `frontend`.
3. Add the environment variable:

   ```env
   VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api/v1
   ```

4. Deploy. The `frontend/vercel.json` file contains the SPA rewrite configuration.

### Backend — Render
1. Create a new Render web service from the GitHub repository.
2. Use the repository's `render.yaml` configuration.
3. Add all required backend environment variables in the Render dashboard.
4. Set `FRONTEND_URL` to the deployed frontend origin.
5. Ensure MongoDB Atlas Network Access permits connections from the deployed backend.
6. Run the seed script once against the intended production database:

   ```bash
   npm run seed
   ```

   Run it from the backend service context or locally with the production database URI, as appropriate.

7. Verify the health endpoint:

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/api/v1/health
   ```

**Production note:** The frontend and backend must use matching origins, CORS settings, and cookie settings. Test registration, email verification, login, refresh, and logout in the deployed browser environment. Cross-site cookie restrictions can affect refresh-token sessions when the frontend and API use unrelated domains.

---

## 🛡️ Security

The backend includes:
- Password hashing with bcrypt.
- Short-lived access tokens and refresh-token rotation.
- Refresh-token reuse detection and session-family revocation.
- Email OTP verification and single-use password-reset links.
- Rate limiting on sensitive authentication and AI endpoints.
- Helmet security headers and a configured CORS allowlist.
- Zod validation for write operations.
- Escaped search patterns and strict profile updates.
- Server-side role and permission checks.
- Upload type and file-signature checks with a 5 MB limit.
- Centralised error handling that avoids exposing stack traces in production.

**Known security scope:** The current project documentation does not claim 2FA, malware scanning for uploads, or a separate CSRF-token mechanism. Review the authentication and cookie configuration before production use.

---

## ⚠️ Known Limitations

- Hotel and guide discovery currently uses enquiry flows; live booking, availability checks, and payments are not included.
- Contact-page phone number, address, and business hours are placeholder content and should be replaced with verified details.
- Privacy Policy and Terms pages are templates and require appropriate legal review.
- AI-generated prices and travel times are estimates, not live quotes.
- Production functionality depends on correctly configured database and third-party service credentials.

---

## 🧪 Testing

Run backend checks from the `backend` directory:

```bash
npm run typecheck
npm test
npm run build
```

Run frontend checks using the scripts available in `frontend/package.json`.

---

<p align="center">
  <strong>Bharat Darshan</strong><br/>
  Explore the beauty, culture, and heritage of India. 🇮🇳
</p>
</p>
