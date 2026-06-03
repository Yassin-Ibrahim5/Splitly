# Splitly

> **Beta** — A real-time, collaborative bill-splitting web app powered by AI receipt scanning.

Splitly lets you photograph a receipt, automatically extract its items using AI, assign items to people, and instantly see how much everyone owes — no account required.

---

## Features

- 📷 **Receipt Scanning** — Upload a photo of any receipt and let AI extract the items and prices automatically
- ✏️ **Manual Item Management** — Add, edit, or remove items manually at any time
- 👥 **People Management** — Add everyone at the table to the session
- 🔲 **Assignment Grid** — Interactively assign each item to one or more people
- ⚡ **Split Evenly** — One-click option to assign all items equally to everyone
- 📊 **Live Split Results** — Instant per-person totals as you make assignments
- 🔗 **Shareable Sessions** — Share a session link so others can collaborate in real time
- 🔄 **Real-time Sync** — All changes sync live via Firebase Firestore across all participants

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS v4 |
| Database | Firebase Firestore |
| AI (extraction) | Google Gemini (`@google/genai`)|

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com/) project with Firestore enabled
- An API key for Google Gemini

### Installation

```bash
git clone https://github.com/Yassin-Ibrahim5/Splitly.git
cd splitly
npm install
```
