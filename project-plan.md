# 🎬 FAKRA Content Calendar — Project Plan

## What I Understood

You want a **content calendar** built specifically for your content channel called **FAKRA** — not a generic calendar, but a focused tool for managing your content creation pipeline. The core needs are:

- Add content events (video ideas, shoots, uploads, etc.) with a **date and time**
- **Remove** events when done or cancelled
- Keep it **minimal** but functional and on-brand

---

## What I'm Proposing to Build

### Core Features (Must Have)

| Feature | Description |
|---|---|
| 📅 Monthly Calendar View | Visual month grid showing all your content events |
| ➕ Add Event | Click a date → fill in title, type, time, and notes |
| 🗑️ Remove Event | Delete events directly from the calendar |
| 🕐 Time Scheduling | Set a specific time for each content task (e.g. "Upload at 6:00 PM") |
| 💾 Persistent Storage | Events saved to `localStorage` — no backend needed |

---

### Event Types (Content-Specific Tags)

Since this is for content creation, each event will have a **type tag**:

- 🎥 **Shoot** — filming day
- ✂️ **Edit** — editing session
- 📤 **Upload** — publish day
- 💡 **Idea** — brainstorm note
- 📣 **Promote** — social media push
- 📊 **Review** — analytics review day

---

### Proposed Extra Features (Nice to Have)

| Feature | Proposal |
|---|---|
| 🔍 Event Detail Panel | Click an event to see full notes/description |
| 📌 Pin/Priority Flag | Mark events as high priority |
| 📋 List View Toggle | Switch between calendar grid and a simple list view |
| 🌓 Dark Mode | Default dark, toggle to light |
| 🔔 Upcoming Reminder Banner | Shows today's + upcoming events at the top |
| 📦 Export to JSON | Download all events as a backup file |
| 📥 Import from JSON | Restore events from a backup |
| 🔎 Search/Filter | Filter events by type or keyword |
| 🗓️ Week View | Optional weekly breakdown view |

---

## Design Direction

- **Brand**: FAKRA — bold, creative, slightly edgy content creator aesthetic
- **Theme**: Dark mode first (deep charcoals, muted blacks)
- **Accent Color**: Electric purple + fiery orange dual accent
- **Typography**: `Space Grotesk` from Google Fonts — modern, personality-forward
- **Feel**: Glassmorphism cards, smooth animations, minimal clutter

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Structure | HTML5 | Simple, no framework needed |
| Style | Vanilla CSS + CSS Variables | Full control, no bloat |
| Logic | Vanilla JavaScript | Lightweight, no dependencies |
| Storage | `localStorage` | No backend, instant persistence |
| Fonts | Google Fonts | Free, fast |

> No frameworks, no servers, no databases — runs fully in the browser and works offline.

---

## Phased Roadmap

### Phase 1 — Core Calendar ✅ (Built first)
- [x] Month grid with navigation (prev/next month)
- [x] Add event modal (title, type, date, time, notes)
- [x] Delete event
- [x] `localStorage` persistence
- [x] Today highlight
- [x] Event type color coding

### Phase 2 — Power Features
- [ ] Event detail side panel
- [ ] List view toggle
- [ ] Upcoming events banner
- [ ] Priority/pin flag

### Phase 3 — Data & Polish
- [ ] Export/Import JSON
- [ ] Search & filter
- [ ] Week view
- [ ] Light/Dark toggle

---

## File Structure

```
FAKRA_CALENDAR/
├── index.html          ← Main app shell
├── style.css           ← All styling + design tokens
├── app.js              ← Calendar logic, events, localStorage
└── project-plan.md     ← This file
```
