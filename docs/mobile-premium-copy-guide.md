# Taskly Mobile Premium Copy Guide

## Brand Voice

Taskly should sound calm, capable, and local. The app connects customers with independent Taskers and approved Pros, then guides each step clearly. Copy should make the next action obvious without sounding pushy, cold, or overly technical.

Taskly does not present itself as the person doing the work. Use wording that shows Taskly helps customers post, compare, coordinate, protect payment flow, and request support.

## English Style Rules

- Use short, direct sentences.
- Prefer helpful guidance over system language.
- Say "Taskly" for normal task flows.
- Say "Taskly Pro" for larger professional project flows.
- Say "Tasker" for normal Taskly providers.
- Say "approved Pro", "independent Pro", or "Pro specialist" for Taskly Pro.
- Use "Taskly will guide you step by step" for customer guidance.
- Avoid "backend", "read-only", "phase", "connected later", and implementation details in public UI.
- Avoid aggressive sales language such as "hire now" or "reserve now".

## Bulgarian Style Rules

- Bulgarian should sound natural for Bulgaria, not literal.
- Use short mobile-friendly CTAs.
- Use "задача" for normal Taskly tasks.
- Use "майстор" when it improves customer clarity in normal Taskly task flows.
- Use "Pro специалист" or "професионалист" for Taskly Pro.
- Keep Taskly and Taskly Pro in Latin script.
- Prefer "оглед" over longer formal site-visit wording.
- Prefer "Поискай преглед" over heavy/legal wording for support review.
- Avoid robotic words like "бекенд", "фаза", "реализация", and "поток" in public UI.

## Customer Wording Rules

- Make the path clear: Taskly task for smaller fixed-scope work, Taskly Pro for bigger quote-based projects.
- Use guided language: "Tell us what you need", "Taskly will guide you", "Compare before you decide".
- Do not imply Taskly performs the work.
- Do not expose technical eligibility logic; display the state returned by Taskly.

## Tasker Wording Rules

- Use "Taskly Tasker" in English where role clarity matters.
- In Bulgarian customer copy, "майстор" is acceptable for normal tasks.
- Provider copy can use "изпълнител" or "Taskly изпълнител" when discussing account readiness.
- Use "Express interest" / "Заяви интерес" for open tasks.
- Never use "Accept job", "Reserve", or "Hire now" for open Taskly task matching.

## Taskly Pro Wording Rules

- Use "Taskly Pro project" in English.
- Use "Taskly Pro заявка" or "Taskly Pro проект" in Bulgarian depending context.
- Use "approved Pros" / "одобрени Pro специалисти".
- Make clear that Pro Access unlocks comparison access, not renovation work.
- Site visit copy should say it is an inspection/visit, not a final agreement.

## Payment Protected Wording Rules

- Use "payment protected" in English.
- Use "Плащането е защитено" in Bulgarian.
- Do not use "escrow".
- Avoid implying mobile calculates release, payout, refund, or payment readiness.
- Good customer copy: "Your payment is protected until the task is completed and approved."
- Bulgarian: "Плащането е защитено, докато задачата не бъде завършена и одобрена."

## Support And Refund Wording Rules

- Use "support review" and "refund review".
- Do not promise a refund.
- Say Taskly will review the request.
- Pro Access support/refund copy must say Pro Access unlocks comparison access, not the renovation work.
- Bulgarian should use "преглед" and "преглед за възстановяване" rather than legalistic claims.

## Notification Wording Rules

- Notifications should be calm and specific.
- Mention the user-visible event, not internal route names.
- Avoid internal IDs, payment internals, Stripe details, admin-only fields, or private contact details.
- Use concise setting labels: "Taskly task alerts", "Taskly Pro alerts", "Messages", "Support updates".

## Preferred Terms

| Concept | English | Bulgarian |
| --- | --- | --- |
| Normal flow | Taskly task | Taskly задача |
| Provider for normal tasks | Taskly Tasker | Taskly изпълнител / майстор |
| Larger professional flow | Taskly Pro project | Taskly Pro заявка / проект |
| Pro provider | approved Pro | одобрен Pro специалист |
| Payment state | payment protected | Плащането е защитено |
| Pro Access unlock | unlock and compare Pros | Отключи и сравни Pro оферти |
| Site visit | site visit | оглед |
| Support review | support review | преглед от Taskly |
| Refund review | refund review | преглед за възстановяване |

## Forbidden Words And Phrases

- "escrow"
- "V1"
- "Core" in public mobile UI
- "Accept job"
- "Reserve" / "Reserved" as a customer-facing promise
- "Hire now"
- "backend" in public UI
- "read-only" in public UI
- "connected later" in public UI
- "phase" in public UI

## Examples

| Weak | Improved EN | Improved BG |
| --- | --- | --- |
| Post a Core task | Post a Taskly task | Публикувай задача |
| Post a Taskly Pro request | Post a Taskly Pro project | Публикувай Taskly Pro заявка |
| Backend unavailable | Taskly is temporarily unavailable | Taskly временно не е достъпен |
| Fetching read-only data | Loading your latest Taskly updates | Зареждаме последните ти данни |
| Unlock and compare Pros | Unlock and compare Pros | Отключи и сравни Pro оферти |
| Invite for site visit | Invite for site visit | Покани за оглед |
| Ask Taskly to review this | Ask Taskly to review this | Поискай преглед от Taskly |

## Short Mobile Button Labels

- Prefer 1-4 words.
- Use verbs first: "Post", "Compare", "Retry", "Send", "Save".
- Bulgarian CTAs should stay compact: "Публикувай", "Изпрати", "Опитай пак", "Покани за оглед".
- Avoid explanatory button labels; put explanation in helper text.

## Avoiding Literal Bulgarian

- Translate intent, not word order.
- Prefer common spoken terms over formal nouns.
- Shorten where English is long.
- Test the longest Bulgarian labels in buttons and cards.
- If a phrase sounds like software internals, rewrite it as a user outcome.
