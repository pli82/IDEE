# AEP Instruire Online

**Platformă standalone de instruire electorală**  
*Autoritatea Electorală Permanentă — România*

---

## 📋 Cuprins
- [Descriere](#-descriere)
- [Stack tehnic](#-stack-tehnic)
- [Cerințe sistem](#-cerințe-sistem)
- [Instalare rapidă](#-instalare-rapidă)
- [Instalare manuală](#-instalare-manuală-fără-docker)
- [Conturi demo](#-conturi-demo)
- [Structura repository](#-structura-repository)
- [Comenzi disponibile](#-comenzi-disponibile)
- [Testare](#-testare)
- [Publicare pe GitHub](#-publicare-pe-github)
- [Securitate](#-securitate)
- [Licență](#-licență)

---

## 🎯 Descriere

**AEP Instruire Online** este o platformă web standalone de instruire electorală destinată:
- Experților electorali înscriși în Corpul experților electorali
- Persoanelor care doresc să participe la examenul de admitere
- Operatorilor de calculator și membrilor birourilor electorale

### Funcționalități principale

**Secțiune utilizator:**
- Înregistrare cu verificare email (OTP 6 cifre)
- Profil complet cu date personale, județ, studii, calitate
- Materiale de instruire structurate pe tipuri de alegeri
- Player video cu progres memorat și suport PDF
- Sistem de testare cu întrebări randomizate (10/test, promovare la 7)
- Calendar instruiri pe județe (toate 41 județe + București)
- Dashboard cu statistici progres personal

**Secțiune admin:**
- Dashboard cu statistici în timp real
- Gestionare utilizatori (căutare, filtrare, export)
- Gestionare conținut (categorii, module, lecții, upload fișiere)
- Gestionare teste și întrebări (import CSV)
- Calendar evenimente pe județe
- Rapoarte și exporturi CSV/Excel
- Setări aplicație (texte, logo, GDPR)
- Jurnal audit complet

---

## 🔧 Stack tehnic

| Componentă | Tehnologie |
|---|---|
| Frontend | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS cu design system AEP |
| Backend | Next.js API Routes (Server Components) |
| Baza de date | PostgreSQL 16 via Prisma ORM |
| Autentificare | JWT (jose) + bcryptjs + OTP email |
| Email dev | MailHog (SMTP local) |
| Stocare fișiere | Local (dev) / MinIO/S3 (prod) |
| Grafice | Recharts |
| Export | ExcelJS (xlsx) + CSV custom |
| Teste | Jest + Playwright |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |

---

## 💻 Cerințe sistem

- **Node.js** ≥ 20.0
- **npm** ≥ 10.0
- **Docker** + **Docker Compose** (pentru PostgreSQL + MailHog)
- sau **PostgreSQL** 16+ instalat local

---

## 🚀 Instalare rapidă (cu Docker)

```bash
# 1. Clonați repository-ul
git clone https://github.com/your-org/aep-instruire-online.git
cd aep-instruire-online

# 2. Copiați și configurați variabilele de mediu
cp .env.example .env
# Editați .env — schimbați JWT_SECRET obligatoriu!

# 3. Porniți serviciile Docker (PostgreSQL + MailHog)
docker compose up -d postgres mailhog

# 4. Instalați dependențele
npm install

# 5. Generați clientul Prisma
npm run db:generate

# 6. Rulați migrările bazei de date
npm run db:migrate

# 7. Populați cu date inițiale (județe, categorii demo, conturi test)
npm run db:seed

# 8. Porniți aplicația în mod development
npm run dev
```

Aplicația rulează la: **http://localhost:3000**  
MailHog (inbox email dev): **http://localhost:8025**  
Prisma Studio (DB vizual): `npm run db:studio`

---

## 🛠 Instalare manuală (fără Docker)

### Opțiunea 1 — SQLite (demo instant, fără PostgreSQL)

```bash
cp .env.example .env
# Editați .env:
# DATABASE_PROVIDER=sqlite
# DATABASE_URL=file:./dev.db

npm install
npm run db:generate
npm run db:push    # SQLite nu suportă migrate dev
npm run db:seed
npm run dev
```

### Opțiunea 2 — PostgreSQL local

```bash
# Creați baza de date
createdb aep_instruire
createuser aep_user
psql -c "GRANT ALL PRIVILEGES ON DATABASE aep_instruire TO aep_user;"

# Configurați .env cu credentials-urile dvs.
cp .env.example .env

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

---

## 👤 Conturi demo

După rularea `npm run db:seed`:

| Rol | Email | Parolă |
|---|---|---|
| Super Admin | admin@aep.ro | Admin@2024! |
| Utilizator demo | test@example.com | Test@2024! |

> ⚠️ **Important:** Schimbați parolele înainte de deployment în producție!

---

## 📁 Structura repository

```
aep-instruire-online/
├── README.md               # Documentație principală
├── .env.example            # Template variabile de mediu
├── .gitignore
├── docker-compose.yml      # PostgreSQL + MailHog + MinIO + App
├── Dockerfile
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
├── playwright.config.ts
│
├── prisma/
│   ├── schema.prisma       # Schema completă baza de date
│   ├── migrations/         # Migrări Prisma
│   └── seed.ts             # Date inițiale (județe, categorii, conturi)
│
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── page.tsx        # Homepage publică
│   │   ├── layout.tsx      # Root layout
│   │   ├── auth/           # Login, Register, OTP, Reset
│   │   ├── dashboard/      # Zona utilizator autentificat
│   │   │   ├── page.tsx    # Dashboard home
│   │   │   ├── courses/    # Materiale instruire + player lecții
│   │   │   ├── calendar/   # Calendar instruiri pe județe
│   │   │   ├── progress/   # Progres personal + istoric teste
│   │   │   └── profile/    # Editare profil
│   │   ├── admin/          # Panou administrare (RBAC)
│   │   │   ├── page.tsx    # Dashboard admin
│   │   │   ├── users/      # Gestionare utilizatori
│   │   │   ├── content/    # Categorii / Module / Lecții
│   │   │   ├── tests/      # Teste și întrebări
│   │   │   ├── calendar/   # Gestionare evenimente
│   │   │   ├── reports/    # Rapoarte + export
│   │   │   └── settings/   # Setări aplicație
│   │   ├── api/            # API Routes (REST)
│   │   │   ├── auth/       # Register, Login, OTP, Logout, Reset
│   │   │   ├── profile/    # GET/PUT profil utilizator
│   │   │   ├── progress/   # Statistici progres
│   │   │   ├── events/     # Calendar public
│   │   │   ├── courses/    # Categorii, module, lecții, progres
│   │   │   ├── tests/      # Start test, submit, rezultate
│   │   │   ├── counties/   # Lista județe
│   │   │   ├── files/      # Servire fișiere uploadate
│   │   │   └── admin/      # Toate rutele admin protejate
│   │   └── profile/complete/  # Completare profil după înregistrare
│   │
│   ├── lib/                # Utilitare server-side
│   │   ├── auth.ts         # JWT, sesiuni, RBAC, rate limiting
│   │   ├── email.ts        # Nodemailer (OTP, reset parolă)
│   │   ├── prisma.ts       # Singleton Prisma Client
│   │   ├── validations.ts  # Scheme Zod
│   │   ├── api.ts          # Helpers răspunsuri API
│   │   ├── export.ts       # CSV + Excel (ExcelJS)
│   │   ├── upload.ts       # Upload fișiere local/S3
│   │   └── counties.ts     # Lista județe României
│   │
│   ├── middleware.ts        # Autorizare rute Next.js
│   ├── types/index.ts       # Tipuri TypeScript globale
│   └── styles/globals.css   # Tailwind + componente globale
│
├── scripts/
│   ├── create-admin.ts      # Creare cont Super Admin
│   ├── import-questions.ts  # Import întrebări din CSV
│   └── export-demo-data.ts  # Export date demo
│
├── tests/
│   ├── setup.ts
│   ├── unit/               # Teste unitare (Jest)
│   ├── integration/        # Teste integrare (Jest + mock Prisma)
│   └── e2e/                # Teste end-to-end (Playwright)
│
├── docs/
│   ├── functional-spec.md   # Specificație funcțională
│   ├── admin-guide.md       # Ghid administrator
│   ├── user-guide.md        # Ghid utilizator
│   └── deployment.md        # Ghid deployment producție
│
├── public/
│   ├── logo-placeholder.svg
│   └── demo/
│
├── uploads/.gitkeep
└── .github/
    └── workflows/
        └── ci.yml           # GitHub Actions CI
```

---

## ⚡ Comenzi disponibile

```bash
# Development
npm run dev             # Pornește Next.js în modul dev (hot reload)

# Build & Production
npm run build           # Build Next.js pentru producție
npm run start           # Pornește serverul de producție

# Calitate cod
npm run lint            # ESLint
npm run format          # Prettier (scrie)
npm run format:check    # Prettier (verifică)
npm run type-check      # TypeScript strict

# Baza de date
npm run db:generate     # Generează Prisma Client din schema
npm run db:migrate      # Creează și aplică migrare nouă (dev)
npm run db:migrate:deploy  # Aplică migrări în producție
npm run db:seed         # Populează cu date inițiale
npm run db:studio       # Prisma Studio (GUI vizual)
npm run db:reset        # Reset complet DB + re-seed (DEV ONLY!)

# Scripturi utilitare
npm run create-admin       # Creare cont Super Admin interactiv
npm run import-questions   # Import întrebări din CSV
npm run export-demo-data   # Export date demo

# Testare
npm test                   # Rulează toate testele Jest
npm run test:watch         # Watch mode
npm run test:coverage      # Cu raport coverage
npm run test:e2e           # Teste Playwright (necesită server pornit)
```

---

## 🧪 Testare

### Unit & Integration (Jest)

```bash
npm test
npm run test:coverage
```

### End-to-End (Playwright)

```bash
# Porniți serverul în altă fereastră:
npm run dev

# Rulați testele e2e:
npm run test:e2e

# Cu interfață vizuală:
npx playwright test --ui
```

---

## 🐙 Publicare pe GitHub

```bash
# 1. Creați repository nou pe GitHub (fără inițializare)

# 2. Inițializați git local
git init
git add .
git commit -m "feat: initial commit — AEP Instruire Online v1.0"

# 3. Conectați la GitHub
git remote add origin https://github.com/your-org/aep-instruire-online.git
git branch -M main
git push -u origin main

# CI/CD GitHub Actions se activează automat la push pe main/develop
# Verificați statusul la: https://github.com/your-org/aep-instruire-online/actions
```

### Variabile secrete pentru GitHub Actions

Adăugați în **Settings → Secrets and variables → Actions**:
- `JWT_SECRET` — secret JWT pentru CI
- `CODECOV_TOKEN` — (opțional) token Codecov pentru coverage

---

## 🔒 Securitate

- **Parole** stocate cu bcrypt (cost factor 12)
- **OTP** expirat după 10 minute, max 5 încercări
- **Rate limiting** la autentificare (5 încercări → blocare 15 minute)
- **JWT** sesiuni httpOnly, SameSite=Lax, Secure în producție
- **CSRF** protejat prin SameSite cookie policy
- **SQL injection** prevenit prin Prisma ORM cu query parameterization
- **XSS** protejat prin React escaping + CSP headers
- **Directory traversal** protejat la servire fișiere
- **RBAC** — 4 roluri: SUPER_ADMIN, CONTENT_ADMIN, REPORTING_ADMIN, USER
- **Audit log** — toate acțiunile admin înregistrate
- **GDPR** — consimțământ cu timestamp și versiune politică

---

## 📖 Documentație

| Document | Conținut |
|---|---|
| `docs/functional-spec.md` | Specificație funcțională completă |
| `docs/admin-guide.md` | Ghid pentru administratori |
| `docs/user-guide.md` | Ghid pentru utilizatori finali |
| `docs/deployment.md` | Instrucțiuni deployment producție |

---

## 📄 Licență

Proprietatea Autorității Electorale Permanente.  
Distribuit pentru uz intern. Contact: [contact@roaep.ro](mailto:contact@roaep.ro)

---

*Generat cu Next.js 14 · TypeScript · Prisma · Tailwind CSS*
