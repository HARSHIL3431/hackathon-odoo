# DESIGN.md — Visual Design System

## Tone
Clean ERP/SaaS dashboard feel — trustworthy, data-dense but not cluttered. Think Linear/Stripe dashboard, not consumer e-commerce flash.

## Color Palette
- **Primary**: `#2563EB` (blue-600) — actions, links, active states
- **Success**: `#16A34A` (green-600) — on-time return, refund complete
- **Warning**: `#D97706` (amber-600) — due today, pending
- **Danger**: `#DC2626` (red-600) — overdue, penalty applied
- **Background**: `#F8FAFC` (slate-50) light mode base
- **Surface/Cards**: `#FFFFFF` with `border-slate-200`
- **Text primary**: `#0F172A` (slate-900)
- **Text secondary**: `#64748B` (slate-500)

Use Tailwind's default slate/blue/green/amber/red scales directly — don't hand-roll custom hex beyond the above anchors.

## Typography
- **Font**: Inter (via `next/font/google`) — clean, standard for dashboards, zero licensing friction
- **Headings**: font-semibold, tracking-tight
- **Body**: font-normal, text-sm to text-base
- **Numbers/stats** (dashboard widgets): font-bold, tabular-nums for alignment

## Scale
- H1: text-2xl / H2: text-xl / H3: text-lg
- Body: text-sm (14px) default for dense tables/dashboards
- Card padding: p-4 to p-6
- Border radius: rounded-lg (8px) consistently — no mixing radii

## Components
- **Status badges**: pill-shaped, colored by state (Draft=slate, Confirmed=blue, Active=amber, Settled=green, Overdue=red)
- **Dashboard widgets**: white card, label in text-secondary above, big number below, optional trend indicator
- **Tables**: striped rows off, hover:bg-slate-50 on, sticky header for order lists

## What to Avoid
- No gradients, no glassmorphism, no dark cinematic theme here — that's your portfolio's aesthetic, this is a business tool and should read as functional/credible to judges within seconds.
- No more than 2 font weights in play at once.
- No icon libraries beyond `lucide-react` (already common, lightweight, consistent stroke style).
