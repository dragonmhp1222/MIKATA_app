# MIKATA Implementation Rules

## Project Goal
- Build MIKATA as a practical "painkiller" tool for 20s SaaS sales users.
- Focus on converting nightly stress into a next-morning concrete action and copy-paste response.

## Scope
- In-scope: boss/work stress support for SaaS sales.
- Out-of-scope: exam prep, career-change prep, broad mental care app features.

## Target & Flow
- Target: SMB to mid-market SaaS sales in their 20s.
- Initial flow is fixed:
  1) Scene selection (3 options)
  2) Situation input
  3) Cheat-sheet generation
- IS/FS branching is NOT in first run. Ask optionally from second session onward.

## Scene Labels (Do Not Change)
1) ヨミ会・進捗報告の前夜
2) 同行・商談後のフィードバック
3) 「ちょっといい？」Slack呼び出し

## Stack
- Next.js (App Router)
- Firebase Auth + Firestore
- Tailwind CSS
- OpenAI API (provider-switch ready architecture)

## Architecture Rules
- Keep `(marketing)` and `(app)` routes separated.
- Never pass raw Firestore docs directly to UI; map into domain-shaped data first.
- Keep prompt templates and JSON schema centralized (not scattered in components).

## AI Output Contract (MVP)
- Must return JSON only.
- Required keys:
  - `situation_analysis`
  - `morning_action`
  - `copy_paste_text`
- Ban abstract encouragement (e.g. "頑張って"), unsupported success-rate claims, and guessed real names.
- `morning_action` must be concrete and include time / counterpart / channel.

## Data Naming
- Use `snake_case` field names consistently.
- Follow plan section definitions for input, output, and execution-result blocks.

## Free Limit Rule
- Free generation: once per user per business day.
- Business day boundary: JST 04:00.
- Judge on server side with UTC-based handling + JST conversion logic.

## Security & Privacy
- Show clear notice before submit: external AI API is used for generation.
- Encourage masking sensitive data (company/person names, confidential numbers).
- Do not log full prompt/user raw text in production logs.
- Enforce Firestore rules so users can only read/write their own data.

## Legal / Repo Safety
- Keep legal docs in repository as placeholders.
- Do not commit real personal address/phone/name into git history.
