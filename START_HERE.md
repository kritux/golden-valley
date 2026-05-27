# 🚀 START HERE — Golden Valley Members

## HOW TO LAUNCH THE AGENT TEAM

Open Claude Code in this folder and run this single prompt:

---

```
Read CLAUDE.md and TASK_STATE.md completely.

You are the Orchestrator. Your job is to deploy the agent team and manage the build of Golden Valley Members — a luxury raffle platform with 3-level referral commissions.

Start PHASE 1 now. Spawn the following subagents IN PARALLEL:

1. Use @db-architect to complete tasks 1.5 through 1.13 (full Supabase schema, RLS, indexes, and DB functions)
2. Use @devops to complete tasks 1.1 through 1.4 (Next.js init, dependencies, vercel.json, .env.example, next.config.ts)

While those run, you handle tasks 1.14 through 1.16 yourself:
- Create src/types/index.ts with ALL TypeScript types for the full schema
- Create src/lib/supabase/client.ts, server.ts, and middleware.ts
- Create src/middleware.ts with role-based route protection

After Phase 1 is complete (all tasks marked ✓ in TASK_STATE.md), begin PHASE 2:

Spawn in parallel:
1. @frontend-engineer → tasks 2.1 through 2.9 and 2.18 (full landing page + ticket grid)
2. You handle tasks 2.10 through 2.17 (all API routes, payment flow, commission engine, email)

After Phase 2, begin PHASE 3:
- @frontend-engineer → tasks 3.1 through 3.15 (all dashboard UIs)
- You handle tasks 3.16 through 3.18 (API endpoints, referral engine)

After Phase 3, run Phase 4 tasks 4.1–4.7 yourself (GHL, automations, draw trigger).

Finally, spawn @qa-agent for Phase 5 tasks 5.1–5.5, then @devops for 5.6–5.9.

Rules:
- Update TASK_STATE.md immediately after each task completes
- Never re-implement something already marked ✓
- If blocked, document the blocker in TASK_STATE.md and skip to next task
- Optimize for minimum token usage: write complete files in one shot, no back-and-forth
```

---

## ESTIMATED BUILD TIME
- Phase 1: ~20-30 min (parallel)
- Phase 2: ~45-60 min (parallel)
- Phase 3: ~60-90 min (parallel)
- Phase 4: ~20-30 min
- Phase 5: ~20-30 min
- **Total: ~3-4 hours unattended**

## WHAT TO DO WHILE AGENTS WORK
You can close your laptop. Claude Code runs in the background.
Check back periodically at TASK_STATE.md to see progress.
The agents will stop and flag blockers rather than guessing.

## AFTER BUILD COMPLETES
1. `cp .env.example .env.local` and fill in your real keys
2. `npx supabase db push` to run migrations
3. `npm run dev` to test locally
4. `vercel --prod` to deploy

## COSTS (once live)
- Vercel: Free tier → $20/mo when traffic grows
- Supabase: Free tier → $25/mo at scale
- GoHighLevel CRM: $97-297/mo
- Resend email: Free → $20/mo
- Stripe: 2.9% + $0.30 per card transaction (Zelle is free)
- **Total: ~$150-350/mo**
