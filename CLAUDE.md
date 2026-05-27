# 🏆 GOLDEN VALLEY MEMBERS — Master Orchestrator

## PROJECT OVERVIEW
Full-stack raffle/giveaway platform with 3-level referral system.
- **Stack:** Next.js 14 + TypeScript + Supabase + Tailwind CSS + Resend
- **Deploy:** Vercel (frontend) + Supabase (DB/Auth)
- **CRM:** GoHighLevel via webhooks
- **Payments:** Zelle (manual verification) + Stripe (card)
- **Tickets:** Sequential 1–1000. Draw happens when ticket #1000 is sold.

## TOKEN EFFICIENCY RULES — READ BEFORE EVERYTHING
1. **Never re-read files you already wrote.** Trust your output.
2. **Write complete files in ONE shot.** No partial writes followed by appends.
3. **Use subagents for parallel work** — never do sequentially what can be done in parallel.
4. **Haiku for boilerplate** (types, constants, configs). Sonnet for logic and UI.
5. **Batch all DB migrations** into the fewest possible SQL files.
6. **Check TASK_STATE.md before starting any task** to avoid duplicate work.
7. **Update TASK_STATE.md immediately** after completing any task.
8. **If a file exists, read only the relevant section** — use view_range.

## AGENT TEAM & RESPONSIBILITIES

| Agent | File | Owns |
|---|---|---|
| Orchestrator | (this file) | Coordination, task ordering, TASK_STATE |
| DB Architect | `.claude/agents/db-architect.md` | Schema, migrations, RLS policies, seed |
| Backend Engineer | `.claude/agents/backend-engineer.md` | API routes, business logic, webhooks, auth |
| Frontend Engineer | `.claude/agents/frontend-engineer.md` | All UI: landing, dashboards, forms |
| DevOps | `.claude/agents/devops.md` | Vercel config, env vars, CI, deploy scripts |
| QA Agent | `.claude/agents/qa-agent.md` | Tests, security checks, final review |

## EXECUTION PHASES & SCHEDULE

### PHASE 1 — Foundation (Run first, blocks everything else)
**Parallel batch — spawn simultaneously:**
- `@db-architect` → Complete Supabase schema + all migrations
- `@devops` → Init Next.js project, Vercel config, env template

**Sequential after Phase 1 complete:**
- `@backend-engineer` → Auth system, middleware, API structure

### PHASE 2 — Core Features (After Phase 1)
**Parallel batch:**
- `@frontend-engineer` → Public landing page (hero, ticket counter, buy flow, number grid)
- `@backend-engineer` → Payment flow (Zelle upload, Stripe webhook, ticket activation)

### PHASE 3 — Dashboards (After Phase 2)
**Parallel batch:**
- `@frontend-engineer` → Admin dashboard (financials, export, user management)
- `@frontend-engineer` → Seller dashboard (sales, referrals, client status)
- `@backend-engineer` → Referral commission engine (3-level calc, pool logic)

### PHASE 4 — Automation & Polish (After Phase 3)
**Sequential:**
- `@backend-engineer` → Email automations (receipt, confirmation, reminders)
- `@backend-engineer` → GHL CRM webhook integration
- `@frontend-engineer` → Public ticket number grid (real-time available numbers)
- `@qa-agent` → Security audit, test suite, final review

### PHASE 5 — Deploy
- `@devops` → Production deploy, DNS, SSL, monitoring

## COMMISSION MATH (Source of truth — never recalculate)
```
Ticket price: $500
├── Company keeps:     $350 (always)
├── Seller L1 (sold):  $100 (direct seller)
├── Seller L2 (referred L1): $25 (recruiter of L1)
└── Prize pool:        $25 (top seller rewards, accumulated)

If no L2 exists: the $25 goes to company ($375 total)
If no L1 referrer: ticket was direct, company gets $350 + $25 pool still accumulates
Max depth: 3 levels. No commissions beyond level 2 salesperson.
```

## CRITICAL BUSINESS RULES
- Tickets are numbered 1–1000 sequentially, assigned on payment CONFIRMATION (not on purchase intent)
- A ticket number is ONLY reserved after Zelle is manually verified by admin OR Stripe webhook fires
- The draw is triggered automatically when ticket #1000 is confirmed
- Sellers are created by Admin only — no self-registration for sellers
- Customers can self-register on public landing page
- All documents/signatures must be stored in Supabase Storage with timestamp + IP
- Send receipt email immediately on ticket confirmation with: ticket number, buyer name, draw date, terms summary

## FOLDER STRUCTURE TO CREATE
```
golden-valley/
├── CLAUDE.md                    ← This file (orchestrator)
├── TASK_STATE.md                ← Live task tracker (update constantly)
├── .claude/agents/              ← Subagent definitions
├── src/
│   ├── app/                     ← Next.js App Router
│   │   ├── (public)/            ← Landing, ticket grid, buy flow
│   │   ├── (auth)/              ← Login page
│   │   ├── admin/               ← Admin dashboard
│   │   ├── seller/              ← Seller dashboard
│   │   └── api/                 ← API routes
│   ├── components/
│   │   ├── ui/                  ← shadcn/ui base components
│   │   ├── landing/             ← Landing page sections
│   │   ├── admin/               ← Admin-specific components
│   │   └── seller/              ← Seller-specific components
│   ├── lib/
│   │   ├── supabase/            ← Client, server, middleware
│   │   ├── stripe/              ← Stripe helpers
│   │   ├── resend/              ← Email templates
│   │   ├── commissions.ts       ← Commission calculation engine
│   │   └── referrals.ts         ← Referral tree traversal
│   └── types/                   ← All TypeScript types
├── supabase/
│   └── migrations/              ← SQL migration files
├── public/
│   └── assets/                  ← Logo, images
└── .env.example                 ← All required env vars
```

## HOW TO RUN THIS PROJECT
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
#          STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, GHL_WEBHOOK_URL

# 3. Run Supabase migrations
npx supabase db push

# 4. Start dev server
npm run dev
```
