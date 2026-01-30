# Habitly 🚀

![GitHub last commit](https://img.shields.io/github/last-commit/srijan2312/habit-tracker?color=4ade80)
![GitHub issues](https://img.shields.io/github/issues/srijan2312/habit-tracker?color=38bdf8)
![GitHub pull requests](https://img.shields.io/github/issues-pr/srijan2312/habit-tracker?color=fbbf24)
![Netlify Status](https://img.shields.io/netlify/1234abcd-5678-efgh-ijkl-1234567890ab?label=Netlify%20Deploy&color=10b981)

> **Habitly** is a modern, full-stack habit tracker and personal growth dashboard.

---


## ✨ Demo


![Habitly Dashboard Screenshot](./docs/habitly-dashboard.png)


---


## 🚀 Project Overview

Habitly helps you build, track, and analyze your habits with:
- 📅 Calendar & grid habit tracking
- 🔥 Streaks, freezes, and analytics
- 💡 Motivational quotes
- 📧 Email reminders & weekly digests
- 📓 Journal for habit reflections
- 🏆 Challenges, history, and more

Live site: [https://habit-tracker-001.netlify.app/](https://habit-tracker-001.netlify.app/)  
Backend: Node.js/Express + Supabase/Postgres  
Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui

---

## 🛠️ Tech Stack

| Frontend | Backend | Auth | Email | Scheduling | Deployment |
|----------|---------|------|-------|------------|------------|
| React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui | Node.js, Express, Supabase (Postgres) | Supabase Auth (JWT) | SendGrid/Resend | node-cron | Netlify (frontend), Render (backend) |

---


## 🧑‍💻 Local Development

### Prerequisites
- Node.js (18+ recommended)
- npm or yarn

### Setup
```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd habit-companion-main

# 2. Install dependencies
npm install

# 3. Start the frontend (Vite)
npm run dev

# 4. Start the backend (from /backend)
cd backend
npm install
npm run dev
```

- Configure `.env` files for both frontend and backend (see `.env.example` if present)
- Set up Supabase project and update keys in backend config

---

## 🌟 Features

- **Sidebar navigation** with Dashboard, Calendar, Analytics, Journal, etc.
- **Protected routes** (auth required)
- **Email notifications** (daily/weekly)
- **User settings** (profile, password, notification preferences)
- **Motivational quotes** on dashboard
- **Journal**: add notes for any habit/date
- **Responsive design** for mobile & desktop

---


## 📝 Customization & Deployment

- **Frontend:**
  - Edit React components in `/src/components` and `/src/pages`
  - Styles: Tailwind CSS + shadcn/ui
- **Backend:**
  - Express routes in `/backend/src/routes`
  - Scheduled jobs in `/backend/src/jobs`
  - Email logic in `/backend/src/utils`

### Deploy
- **Frontend:** Deploy `/` to Netlify, Vercel, or similar
- **Backend:** Deploy `/backend` to Render, Railway, or similar
- **Supabase:** Use [supabase.com](https://supabase.com/) for DB/Auth

---

## 📄 Migration & Data Sync
- See `backend/supabase-user-migration.sql` and `SUPABASE_MIGRATION_GUIDE.md` for syncing Supabase auth users with your app DB.

---


## 🤝 Contributing

Pull requests welcome! Please open an issue to discuss major changes first.

---

## 📬 Contact
For questions, open an issue or contact the maintainer.
