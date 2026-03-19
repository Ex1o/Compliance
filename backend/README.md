# ComplianceWala Backend

Production-grade NestJS backend for the MSME Compliance Deadline Tracker.

## Architecture

```
src/
├── auth/                   # OTP login, JWT access + refresh tokens
├── business/               # Business profile (onboarding wizard data)
├── deadlines/              # Deadline rules engine + penalty calculator
│   └── engine/             # Core rules matching + date generation
├── notifications/          # WhatsApp (Interakt) + SMS (MSG91) delivery
│   ├── whatsapp/
│   └── sms/
├── payments/               # Razorpay subscriptions + webhook handler
├── ca/                     # CA partner dashboard and client management
├── health/                 # Compliance health score + improvement tips
├── queues/                 # BullMQ workers: reminders, generation, penalty update
├── prisma/                 # PrismaService (global)
├── common/
│   ├── decorators/         # @CurrentUser, @Public, @Roles
│   ├── guards/             # JwtAuthGuard, JwtRefreshGuard, RolesGuard
│   ├── filters/            # Global HTTP exception filter
│   ├── interceptors/       # Response wrapper + request logger
│   └── utils/              # AES-256-GCM encryption, GSTIN validator
└── config/                 # Zod env validation
```

## Quick Start

### 1. Prerequisites
- Node.js 20+
- PostgreSQL (via Supabase free tier)
- Redis (via Upstash free tier)

### 2. Install
```bash
npm install
cp .env.example .env
# Fill in all required env vars
```

### 3. Database setup
```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed 30 deadline rules
```

### 4. Run
```bash
npm run start:dev      # Development with hot reload
npm run build          # Production build
npm run start:prod     # Production
```

### 5. Swagger docs
http://localhost:3000/api/docs (development only)

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/otp/send | Send OTP to mobile |
| POST | /api/v1/auth/otp/verify | Verify OTP → get tokens |
| POST | /api/v1/auth/refresh | Refresh access token |
| POST | /api/v1/auth/logout | Revoke refresh token |
| GET  | /api/v1/auth/me | Current user info |

### Business
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/business/profile | Create/update business profile |
| GET  | /api/v1/business/profile | Get business profile |
| PUT  | /api/v1/business/profile | Update profile |
| GET  | /api/v1/business/notifications | Get notification prefs |
| PUT  | /api/v1/business/notifications | Update notification prefs |

### Deadlines
| Method | Path | Description |
|--------|------|-------------|
| GET  | /api/v1/deadlines/dashboard | Dashboard summary + upcoming |
| GET  | /api/v1/deadlines | All deadlines (filterable) |
| GET  | /api/v1/deadlines/calendar | Monthly calendar view |
| PATCH | /api/v1/deadlines/:id/file | Mark deadline as filed |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/payments/subscribe | Create Razorpay subscription |
| GET  | /api/v1/payments/subscription | Current subscription |
| POST | /api/v1/payments/webhook/razorpay | Razorpay webhook (public) |

### CA Partner
| Method | Path | Description |
|--------|------|-------------|
| GET  | /api/v1/ca/dashboard | All clients + summary |
| GET  | /api/v1/ca/clients/:businessId/deadlines | Client deadlines |
| PATCH | /api/v1/ca/clients/deadlines/:instanceId/file | File on behalf of client |
| POST | /api/v1/ca/clients | Add client by mobile |
| DELETE | /api/v1/ca/clients/:businessId | Remove client |

### Health Score
| Method | Path | Description |
|--------|------|-------------|
| GET  | /api/v1/health-score | Compliance health score + tips |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET  | /api/v1/notifications/history | Notification history |

## Security

- **OTP login** — mobile number + 6-digit OTP, max 5 attempts, 10-min expiry
- **JWT** — 15-min access tokens + 30-day refresh tokens in httpOnly cookies
- **PII encryption** — mobile numbers and GSTINs encrypted with AES-256-GCM at rest
- **Role-based access** — MSME_OWNER, CA_PARTNER, ADMIN roles enforced on all routes
- **Rate limiting** — OTP endpoint: 3 requests per 10 min. API: 60 req/min global
- **Helmet** — 11 secure HTTP headers set automatically
- **CORS** — restricted to FRONTEND_URL only

## Cron Jobs (via BullMQ)

| Schedule | Job | Description |
|----------|-----|-------------|
| 8:00 AM IST daily | whatsapp-reminders | Send 7d/3d/today reminders |
| Midnight IST daily | penalty-update | Mark overdue instances, update penalty amounts |
| On signup | deadline-generation | Generate 12-month calendar for new business |

## Deployment (Railway)

```bash
# Set environment variables in Railway dashboard
# Then deploy:
railway up

# Run migrations on deploy:
# Add to Railway start command:
# npx prisma migrate deploy && node dist/main
```

## Key Design Decisions

1. **BullMQ over node-cron** — Jobs persist in Redis across server restarts. Critical for WhatsApp reminders.
2. **AES-256-GCM for PII** — Mobile numbers and GSTINs are PII under India's DPDPA 2023. Encrypted at rest with authenticated encryption.
3. **Idempotent deadline generation** — `upsert` with unique constraint prevents duplicate instances on re-runs.
4. **httpOnly refresh token cookie** — Prevents XSS theft of refresh tokens. Access token in response body (short-lived).
5. **Zod env validation** — Fails fast on startup with clear error messages if any required env var is missing.
