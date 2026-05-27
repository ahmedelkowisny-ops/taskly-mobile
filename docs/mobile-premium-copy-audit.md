# Taskly Mobile Premium Copy Audit

## Weak Copy Found

- Several high-traffic screens used implementation language such as "backend", "read-only", "connected later", and "phase".
- Customer and provider loading/error states were accurate but too technical for public UI.
- Some demo-mode copy emphasized internal connection state instead of clearly saying it is simulated.
- Payment helper copy sometimes described backend ownership rather than the customer benefit.
- Provider workspace copy was clear technically but could be calmer and more professional.

## Literal Bulgarian Risks Found

- Bulgarian keys were readable, but several strings used literal product or engineering terms such as "бекенд", "поток", and "фаза".
- "Provider" appeared in a few Bulgarian public strings where "изпълнител" is more natural.
- Long button and status labels risk wrapping on small screens.
- Support/refund language needed shorter Bulgarian phrasing around "преглед" and "възстановяване".

## Hardcoded Text Found

- `app/index.tsx` had hardcoded workspace rollout and "How Taskly works" copy.
- `app/login.tsx` had hardcoded login labels and demo CTA copy.
- `app/customer/home.tsx` had hardcoded loading/error/demo and guidance copy.
- `app/customer/tasks.tsx` had hardcoded loading/error/payment explanation copy.
- `app/customer/post-task.tsx` and `app/customer/post-pro-request.tsx` had hardcoded catalog/rules helper copy.
- Provider screens had hardcoded status, loading, retry, and guidance copy.
- Mock/demo responses in `src/lib/api/mockApi.ts` include many English user-visible states; this pass only polished the safest high-impact examples.

## Taskly Vs Taskly Pro Wording Issues

- Public "Core" wording was already mostly removed from main UI, but technical file names/types still use Core internally.
- Some Pro strings still said "Pro request" in a way that felt generic. Preferred public wording is "Taskly Pro project" in English and "Taskly Pro заявка" in Bulgarian.
- Customer-facing copy should keep normal Taskly tasks and Taskly Pro projects visually and verbally distinct.

## Payment And Support Wording Risks

- "Reserved" can sound like a direct booking promise. Use "Scheduled" or "Upcoming" in public labels unless backend copy explicitly returns a reservation state.
- "Payment held" is acceptable as backend-authored state, but helper copy should explain "payment protected" rather than payment mechanics.
- Support/refund copy must not promise automatic refunds.
- Pro Access copy must keep saying it unlocks comparison access, not renovation work.

## Button Labels That May Overflow

- "Continue Taskly Tasker onboarding"
- "Confirm tools and express interest"
- "Continue payment setup"
- "Propose another time"
- Bulgarian support and cannot-attend labels should remain short.

## Empty/Error/Loading States Needing Polish

- Replace "Backend unavailable" with "Taskly is temporarily unavailable" in user-facing states.
- Replace "Fetching read-only..." with "Loading your latest..." or "Checking your latest...".
- Replace "Retry or continue in demo mode while the backend is unavailable" with clearer customer language.
- Replace "connected later" with "available in a later update" only where a placeholder must remain visible.

## Changes Applied

- Created this audit and the premium copy guide.
- Polished high-frequency EN/BG translation keys for login, loading, demo, Taskly task, Taskly Pro, payment protected, support/refund, and site visit states.
- Removed public "backend" and "read-only" wording from the highest-traffic customer/provider screens.
- Replaced public "Reserved/upcoming" labels with "Scheduled/upcoming" wording while preserving internal reservation status checks.
- Kept "Taskly" for normal tasks and "Taskly Pro" for larger professional project flows.

## Deferred Copy Items

- Full localization of all backend-returned labels must happen server-side or through a backend label contract.
- Mock/demo data still contains some English fallback labels because it mirrors backend response shapes.
- Some technical route/file/type names still use Core internally and should stay as implementation terminology.
- A later visual QA pass should verify the longest Bulgarian strings on small Android devices.
