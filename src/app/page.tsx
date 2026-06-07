// src/app/page.tsx - Prima pagină publică AEP
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getHomepageSettings() {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ['homepage.presentation', 'app.name', 'app.logo'] } },
  })
  return Object.fromEntries(settings.map((s) => [s.key, s.value]))
}

export default async function HomePage() {
  let settings: Record<string, string> = {}
  try {
    settings = await getHomepageSettings()
  } catch {
    // DB poate să nu fie disponibilă în dev
  }

  const appName = settings['app.name'] || 'AEP Instruire Online'
  const presentation =
    settings['homepage.presentation'] ||
    'AEP este o instituție administrativă autonomă a statului român, cu rol esențial în organizarea și buna desfășurare a proceselor electorale.'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-aep-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-aep-600 font-bold text-sm">AEP</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Instruire online – IDEE_ROAEP.
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-aep-600 to-aep-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-aep-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
            Platforma este disponibilă
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance leading-tight">
            Instruire electorală profesională
            <br />
            <span className="text-blue-200">pentru toți participanții la procesul electoral</span>
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            {presentation.split('.')[0] + '.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto btn-lg bg-white text-aep-600 hover:bg-blue-50 font-semibold rounded-lg px-8 py-3.5 text-base inline-flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Înregistrare cont nou
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto btn-lg bg-aep-500/40 hover:bg-aep-500/60 text-white border border-white/30 font-medium rounded-lg px-8 py-3.5 text-base inline-flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Autentificare
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200">
            <Link href="/auth/forgot-password" className="underline hover:text-white transition-colors">
              Ai uitat parola?
            </Link>
          </p>
        </div>
      </section>

      {/* Beneficii */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-center text-neutral-800 mb-3">
            Ce oferă platforma AEP Instruire Online
          </h3>
          <p className="text-center text-neutral-500 mb-12 max-w-2xl mx-auto">
            Toate resursele necesare pentru o pregătire electorală completă și modernă
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-6 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 rounded-lg bg-aep-50 flex items-center justify-center mb-4 group-hover:bg-aep-100 transition-colors">
                  <span className="text-2xl">{b.icon}</span>
                </div>
                <h4 className="font-semibold text-neutral-800 mb-2">{b.title}</h4>
                <p className="text-sm text-neutral-500 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Descriere AEP */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-aep-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AEP</span>
              </div>
              <div>
                <h3 className="font-bold text-neutral-800">AEP</h3>
                <p className="text-sm text-neutral-500">Instituție administrativă autonomă a statului român</p>
              </div>
            </div>
            <p className="text-neutral-600 leading-relaxed text-base">
              {presentation}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-aep-700 text-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">AEP Instruire Online</p>
              <p className="text-xs text-blue-200 mt-1">
                © {new Date().getFullYear()} AEP. Toate drepturile rezervate.
              </p>
            </div>
            <nav className="flex items-center gap-6 text-sm text-blue-200">
              <Link href="/politica-confidentialitate" className="hover:text-white transition-colors">
                Politică de confidențialitate
              </Link>
              <Link href="/termeni-utilizare" className="hover:text-white transition-colors">
                Termeni de utilizare
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact AEP
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

const BENEFITS = [
  {
    icon: '📚',
    title: 'Materiale digitale complete',
    description: 'Acces la ghiduri, prezentări și documente pentru toate tipurile de alegeri și referendumuri.',
  },
  {
    icon: '🎬',
    title: 'Lecții video interactive',
    description: 'Videoclipuri de instruire cu progres memorat, posibilitate de reluare și suport PDF atașat.',
  },
  {
    icon: '✅',
    title: 'Teste de evaluare',
    description: 'Evaluați cunoștințele prin teste randomizate cu feedback imediat și istoricul tuturor încercărilor.',
  },
  {
    icon: '📊',
    title: 'Monitorizare progres',
    description: 'Urmăriți progresul personal pe fiecare modul, lecție și test susținut.',
  },
  {
    icon: '📅',
    title: 'Calendar instruiri',
    description: 'Consultați evenimentele de instruire disponibile în județul dvs. și din toată țara.',
  },
  {
    icon: '🔒',
    title: 'Platformă securizată',
    description: 'Date protejate conform GDPR, autentificare sigură și stocare securizată a informațiilor.',
  },
]
