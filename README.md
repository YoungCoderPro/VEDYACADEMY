# VedyAcademy

A student-management platform for English tutoring — students, schedule,
study documents, and score roadmaps in one place.

Built with Expo (React Native), so the same code runs as a **website today**
and can ship as an **iOS/Android app later** with no rewrite.

## Run it (first time)

1. Install [Node.js](https://nodejs.org) (LTS version) if you don't have it.
2. Open this folder in VS Code, then open a terminal (Terminal → New Terminal).
3. Run:

```bash
npm install
npm run web
```

Your browser opens the app automatically (usually at http://localhost:8081).
That's it — no database or accounts needed.

> The app starts with 3 sample students so every screen has something to show.
> Delete them whenever you like — everything is editable.

## What's inside

- **Today** — greeting dashboard: today's lessons, homework due soon,
  payments to collect, and the week ahead.
- **Students** — searchable dashboard with exam filters, score journeys,
  add/edit/archive/remove, full profiles (contact, parent, notes, rate).
- **Calendar** — month view with color dots per student. One-off and weekly
  recurring lessons; cancel/reschedule/complete a single week without
  touching the series.
- **Library** — upload PDFs, tag by category (IELTS, TOEFL, SAT, grades…),
  search, open/download, and share document sets to a student (a
  ready-to-send message is prepared for you).
- **Roadmaps** — inside each student profile: generate a phased study plan
  (Foundation → Skill building → Test practice → Final review) from current
  score, goal, exam date and weekly study hours, with milestones and a
  weekly plan template.
- Extras: homework tracking with overdue flags, payment tracker with
  balances, score history chart.

## Where the data lives

Everything is stored **in your browser** (and on-device in the future mobile
app). No account, nothing leaves your computer. Clearing the browser's site
data erases it — so use one browser you keep.

## Later (v2 path)

When you want multi-device sync, real shareable links, or student logins,
the data layer in `src/lib/store.js` is designed to be swapped for
[Supabase](https://supabase.com) (free tier) without changing any screens.

## Project map

```
src/app/            screens (Expo Router)
  (tabs)/           Today, Students, Calendar, Library
  student/[id].js   student profile
src/components/ui.js  design system (buttons, cards, sheets…)
src/lib/            data store, roadmap generator, dates, file storage, theme
```
