# AssetVault — Enterprise Asset Inventory System

A modern, production-ready asset inventory management system built with **React + TypeScript + Supabase**. Designed for organizations tracking PCs, laptops, servers, furniture, CCTV, and all facility assets across multiple buildings.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark glassmorphism UI) |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Export | jsPDF + xlsx |
| QR Codes | qrcode |

---

## 📁 Project Structure

```
src/
├── app/                    # App-level config
├── components/
│   ├── assets/             # Asset form modal
│   ├── charts/             # Recharts components
│   ├── dashboard/          # Stat cards
│   ├── layouts/            # Sidebar, TopNav, DashboardLayout
│   └── ui/                 # Shared UI (modals, buttons)
├── features/auth/          # Auth context + hooks
├── lib/                    # Supabase client
├── pages/                  # All page components
├── routes/                 # ProtectedRoute wrapper
├── services/               # Supabase API calls
├── store/                  # Zustand stores (auth, ui)
├── styles/                 # Global CSS
├── types/                  # TypeScript interfaces
└── utils/                  # Helpers, formatters
```

---

## ⚙️ Installation

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)

### Step 1 — Clone & Install

```bash
# Install dependencies
npm install
```

### Step 2 — Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Copy your **Project URL** and **Anon Key** from Settings → API
3. Create `.env` file:

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### Step 3 — Run Database Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Paste the entire contents of `supabase-schema.sql`
3. Click **Run** — this creates all tables, RLS policies, and seed data

### Step 4 — Create Admin Users

In Supabase Dashboard → **Authentication** → **Users** → **Add User**:

```
Email: admin@company.com
Password: Admin123!
```

Then in the SQL Editor, set their role:

```sql
update profiles
set role = 'tech-admin', full_name = 'System Admin'
where id = 'paste-user-uuid-here';
```

For a Utility Admin:
```sql
update profiles
set role = 'utility-admin', full_name = 'Utility Admin'
where id = 'paste-utility-user-uuid-here';
```

### Step 5 — Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 👤 User Roles

### Tech-Admin
Full access to all system features:
- All asset CRUD operations
- User management
- Analytics & reports
- Maintenance logs
- Building management
- PDF/Excel export
- QR code generation

### Utility-Admin
Limited to utility/facility assets:
- Add/edit utility assets (chairs, tables, fans, ACs, etc.)
- View utility reports
- View buildings overview

---

## 🔐 Authentication

- Email + Password login via Supabase Auth
- Role-based route protection
- Session persistence (localStorage)
- Forgot password via email link
- Auto-profile creation on signup

---

## 📊 Dashboard Features

### Tech-Admin Dashboard
- 6 stat cards (Total, Active, Maintenance, Retired, Buildings, Utility)
- Area chart: Asset growth by month
- Bar chart: Assets per building
- Pie chart: Status distribution
- Line chart: Maintenance trends
- Recent assets table
- Activity timeline

### Utility-Admin Dashboard
- Simplified utility asset overview
- Category quick stats
- Card-based asset grid

---

## 📦 Asset Management

Each asset tracks:
- Auto-generated asset code (AST-XXXXXX)
- Name, description, serial number
- Category & building assignment
- Floor/room location
- Status: active / inactive / maintenance / retired
- Condition: excellent / good / fair / poor
- Assigned user/department
- Purchase & maintenance dates
- Image upload (Supabase Storage)
- QR code generation

---

## 📄 Reports & Export

- **Excel export** (.xlsx) — All assets in formatted spreadsheet
- **PDF export** — Branded report with header and table
- Available from Reports page (Tech-Admin only)

---

## 🎨 UI/UX Design

- **Theme**: Dark glassmorphism with gradient accents
- **Typography**: Outfit (body), Syne (headings), JetBrains Mono (code)
- **Colors**: Blue/violet gradient brand, emerald success, amber warning
- **Animations**: Framer Motion page transitions, hover effects, skeleton loaders
- **Responsive**: Mobile, tablet, desktop, widescreen

---

## 🚢 Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in Vercel dashboard
```

### Netlify

```bash
npm run build
# Drag dist/ folder to Netlify dashboard
# Add env vars in Site Settings → Environment Variables
```

### Environment Variables for Production

Add these to your hosting platform:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with roles |
| `buildings` | Building locations |
| `asset_categories` | Asset type categories |
| `assets` | Main asset inventory |
| `maintenance_logs` | Maintenance history |

---

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- Tech-admins have full CRUD access
- Utility-admins can insert/view assets
- Regular users can only view
- Storage bucket protected by auth policies
- Zod validation on all forms
- Input sanitization via React Hook Form

---

## 📱 PWA / Mobile

The app is fully responsive and works on mobile browsers. For full PWA support, add a `vite-plugin-pwa` configuration.

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

MIT License — Free for personal and commercial use.
