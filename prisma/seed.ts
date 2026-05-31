// prisma/seed.ts - Date inițiale pentru AEP Instruire Online
import { PrismaClient, Role, UserStatus, Sex, QuestionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const COUNTIES = [
  { code: 'AB', name: 'Alba' },
  { code: 'AR', name: 'Arad' },
  { code: 'AG', name: 'Argeș' },
  { code: 'BC', name: 'Bacău' },
  { code: 'BH', name: 'Bihor' },
  { code: 'BN', name: 'Bistrița-Năsăud' },
  { code: 'BT', name: 'Botoșani' },
  { code: 'BV', name: 'Brașov' },
  { code: 'BR', name: 'Brăila' },
  { code: 'BZ', name: 'Buzău' },
  { code: 'CS', name: 'Caraș-Severin' },
  { code: 'CL', name: 'Călărași' },
  { code: 'CJ', name: 'Cluj' },
  { code: 'CT', name: 'Constanța' },
  { code: 'CV', name: 'Covasna' },
  { code: 'DB', name: 'Dâmbovița' },
  { code: 'DJ', name: 'Dolj' },
  { code: 'GL', name: 'Galați' },
  { code: 'GR', name: 'Giurgiu' },
  { code: 'GJ', name: 'Gorj' },
  { code: 'HR', name: 'Harghita' },
  { code: 'HD', name: 'Hunedoara' },
  { code: 'IL', name: 'Ialomița' },
  { code: 'IS', name: 'Iași' },
  { code: 'IF', name: 'Ilfov' },
  { code: 'MM', name: 'Maramureș' },
  { code: 'MH', name: 'Mehedinți' },
  { code: 'MS', name: 'Mureș' },
  { code: 'NT', name: 'Neamț' },
  { code: 'OT', name: 'Olt' },
  { code: 'PH', name: 'Prahova' },
  { code: 'SM', name: 'Satu Mare' },
  { code: 'SJ', name: 'Sălaj' },
  { code: 'SB', name: 'Sibiu' },
  { code: 'SV', name: 'Suceava' },
  { code: 'TR', name: 'Teleorman' },
  { code: 'TM', name: 'Timiș' },
  { code: 'TL', name: 'Tulcea' },
  { code: 'VS', name: 'Vaslui' },
  { code: 'VL', name: 'Vâlcea' },
  { code: 'VN', name: 'Vrancea' },
  { code: 'B', name: 'București' },
]

async function main() {
  console.log('🌱 Inițializare date seed...')

  // ── Județe ───────────────────────────────────────────────
  console.log('  → Județe...')
  for (const county of COUNTIES) {
    await prisma.county.upsert({
      where: { code: county.code },
      update: { name: county.name },
      create: { code: county.code, name: county.name, active: true },
    })
  }

  // ── Setări aplicație ─────────────────────────────────────
  console.log('  → Setări aplicație...')
  const defaultSettings = [
    { key: 'app.name', value: 'AEP Instruire Online' },
    { key: 'app.description', value: 'Platforma de instruire electorală a Autorității Electorale Permanente' },
    { key: 'app.logo', value: '/logo-placeholder.svg' },
    { key: 'app.primaryColor', value: '#1a4480' },
    { key: 'app.accentColor', value: '#2e8540' },
    { key: 'otp.expiryMinutes', value: '10' },
    { key: 'otp.maxAttempts', value: '5' },
    { key: 'auth.maxFailedAttempts', value: '5' },
    { key: 'auth.lockoutMinutes', value: '15' },
    { key: 'gdpr.policyVersion', value: '1.0' },
    {
      key: 'homepage.presentation',
      value: 'Autoritatea Electorală Permanentă - AEP este o instituție administrativă autonomă a statului român, cu rol esențial în organizarea și buna desfășurare a proceselor electorale. Activitatea AEP urmărește asigurarea exercitării corecte a dreptului de vot, transparența competiției electorale, administrarea Registrului electoral și sprijinirea personalului implicat în organizarea alegerilor. Programul de instruire online reprezintă un instrument modern de pregătire electorală, destinat persoanelor implicate în desfășurarea alegerilor, precum experții electorali, operatorii de calculator și membrii birourilor electorale.',
    },
    { key: 'calitati.list', value: JSON.stringify([
      'Expert electoral înscris în Corpul experților electorali',
      'Persoană care dorește să participe la examenul de admitere în Corpul experților electorali',
      'Operator de calculator',
      'Membru birou electoral',
      'Altă calitate',
    ])},
    { key: 'studii.list', value: JSON.stringify([
      'Liceale',
      'Postliceale',
      'Universitare (licență)',
      'Master',
      'Doctorat',
    ])},
  ]
  for (const s of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  // ── Super Admin ──────────────────────────────────────────
  console.log('  → Conturi demo...')
  const superAdminPassword = await bcrypt.hash('Admin@AEP2024!', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@aep.ro' },
    update: {},
    create: {
      email: 'superadmin@aep.ro',
      passwordHash: superAdminPassword,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      roles: {
        create: [{ role: Role.SUPER_ADMIN }],
      },
      profile: {
        create: {
          nume: 'Admin',
          prenume: 'Super',
          sex: Sex.M,
          judetCode: 'B',
          calitate: 'Administrator sistem',
          profileComplete: true,
          gdprConsentAt: new Date(),
          gdprPolicyVersion: '1.0',
        },
      },
    },
  })

  // Content Admin
  const contentAdminPassword = await bcrypt.hash('Content@AEP2024!', 12)
  await prisma.user.upsert({
    where: { email: 'content@aep.ro' },
    update: {},
    create: {
      email: 'content@aep.ro',
      passwordHash: contentAdminPassword,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      roles: { create: [{ role: Role.CONTENT_ADMIN }] },
      profile: {
        create: {
          nume: 'Popescu',
          prenume: 'Maria',
          sex: Sex.F,
          judetCode: 'B',
          calitate: 'Administrator conținut',
          profileComplete: true,
          gdprConsentAt: new Date(),
          gdprPolicyVersion: '1.0',
        },
      },
    },
  })

  // Reporting Admin
  const reportingAdminPassword = await bcrypt.hash('Report@AEP2024!', 12)
  await prisma.user.upsert({
    where: { email: 'rapoarte@aep.ro' },
    update: {},
    create: {
      email: 'rapoarte@aep.ro',
      passwordHash: reportingAdminPassword,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      roles: { create: [{ role: Role.REPORTING_ADMIN }] },
      profile: {
        create: {
          nume: 'Ionescu',
          prenume: 'Dan',
          sex: Sex.M,
          judetCode: 'IS',
          calitate: 'Administrator raportare',
          profileComplete: true,
          gdprConsentAt: new Date(),
          gdprPolicyVersion: '1.0',
        },
      },
    },
  })

  // Utilizator demo
  const userPassword = await bcrypt.hash('User@AEP2024!', 12)
  await prisma.user.upsert({
    where: { email: 'utilizator@demo.ro' },
    update: {},
    create: {
      email: 'utilizator@demo.ro',
      passwordHash: userPassword,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      roles: { create: [{ role: Role.USER }] },
      profile: {
        create: {
          nume: 'Exemplu',
          prenume: 'Utilizator',
          dataNasterii: new Date('1985-06-15'),
          sex: Sex.F,
          judetCode: 'CJ',
          studii: 'Universitare (licență)',
          calitate: 'Expert electoral înscris în Corpul experților electorali',
          profileComplete: true,
          gdprConsentAt: new Date(),
          gdprPolicyVersion: '1.0',
        },
      },
    },
  })

  // ── Categorii conținut ──────────────────────────────────
  console.log('  → Categorii conținut...')
  const cat1 = await prisma.contentCategory.upsert({
    where: { slug: 'camera-senat' },
    update: {},
    create: {
      title: 'Alegeri pentru Camera Deputaților și Senat',
      slug: 'camera-senat',
      description: 'Materiale de instruire pentru alegerile parlamentare',
      order: 1,
      published: true,
    },
  })
  const cat2 = await prisma.contentCategory.upsert({
    where: { slug: 'presedinte' },
    update: {},
    create: {
      title: 'Alegeri pentru Președintele României',
      slug: 'presedinte',
      description: 'Materiale de instruire pentru alegerile prezidențiale',
      order: 2,
      published: true,
    },
  })
  const cat3 = await prisma.contentCategory.upsert({
    where: { slug: 'locale' },
    update: {},
    create: {
      title: 'Alegeri pentru autoritățile locale',
      slug: 'locale',
      description: 'Alegeri locale generale și parțiale',
      order: 3,
      published: true,
    },
  })
  await prisma.contentCategory.upsert({
    where: { slug: 'locale-generale' },
    update: {},
    create: {
      title: 'Alegeri generale pentru autoritățile publice locale',
      slug: 'locale-generale',
      parentId: cat3.id,
      order: 1,
      published: true,
    },
  })
  await prisma.contentCategory.upsert({
    where: { slug: 'locale-partiale' },
    update: {},
    create: {
      title: 'Alegeri parțiale pentru autoritățile publice locale',
      slug: 'locale-partiale',
      parentId: cat3.id,
      order: 2,
      published: true,
    },
  })
  const cat4 = await prisma.contentCategory.upsert({
    where: { slug: 'parlamentul-european' },
    update: {},
    create: {
      title: 'Alegeri pentru Parlamentul European',
      slug: 'parlamentul-european',
      order: 4,
      published: true,
    },
  })
  const cat5 = await prisma.contentCategory.upsert({
    where: { slug: 'referendum' },
    update: {},
    create: {
      title: 'Referendum',
      slug: 'referendum',
      order: 5,
      published: true,
    },
  })
  await prisma.contentCategory.upsert({
    where: { slug: 'referendum-national' },
    update: {},
    create: {
      title: 'Referendum național',
      slug: 'referendum-national',
      parentId: cat5.id,
      order: 1,
      published: true,
    },
  })
  await prisma.contentCategory.upsert({
    where: { slug: 'referendum-local' },
    update: {},
    create: {
      title: 'Referendum local',
      slug: 'referendum-local',
      parentId: cat5.id,
      order: 2,
      published: true,
    },
  })

  // ── Modul și lecții demo ──────────────────────────────────
  console.log('  → Module și lecții demo...')
  const modul1 = await prisma.module.upsert({
    where: { id: 'modul-demo-1' },
    update: {},
    create: {
      id: 'modul-demo-1',
      categoryId: cat1.id,
      title: 'Cadrul legislativ - Legea nr. 208/2015',
      description: 'Prezentarea cadrului legal privind alegerea Senatului și Camerei Deputaților',
      order: 1,
      published: true,
    },
  })

  const lectie1 = await prisma.lesson.upsert({
    where: { id: 'lectie-demo-1' },
    update: {},
    create: {
      id: 'lectie-demo-1',
      moduleId: modul1.id,
      title: 'Introducere în procesul electoral parlamentar',
      description: 'Noțiuni fundamentale despre alegerile parlamentare în România',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder
      order: 1,
      published: true,
      minWatchPercentForTest: 50,
    },
  })

  await prisma.lesson.upsert({
    where: { id: 'lectie-demo-2' },
    update: {},
    create: {
      id: 'lectie-demo-2',
      moduleId: modul1.id,
      title: 'Circumscripții electorale și secții de votare',
      description: 'Organizarea teritorială a alegerilor parlamentare',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      published: true,
      minWatchPercentForTest: 70,
    },
  })

  // ── Test demo ─────────────────────────────────────────────
  console.log('  → Test demo cu întrebări...')
  const test1 = await prisma.test.upsert({
    where: { id: 'test-demo-1' },
    update: {},
    create: {
      id: 'test-demo-1',
      lessonId: lectie1.id,
      title: 'Test - Cadrul legislativ electoral',
      description: 'Evaluare cunoștințe privind legislația electorală',
      questionsPerAttempt: 10,
      passingScore: 7,
      published: true,
    },
  })

  const questionsData = [
    {
      text: 'Ce lege reglementează alegerea membrilor Camerei Deputaților și Senatului?',
      explanation: 'Legea nr. 208/2015 privind alegerea Senatului și a Camerei Deputaților, precum și pentru organizarea și funcționarea Autorității Electorale Permanente.',
      options: [
        { text: 'Legea nr. 208/2015', isCorrect: true },
        { text: 'Legea nr. 370/2004', isCorrect: false },
        { text: 'Legea nr. 115/2015', isCorrect: false },
        { text: 'Legea nr. 33/2007', isCorrect: false },
      ],
    },
    {
      text: 'Care este numărul minim de circumscripții electorale pentru alegerile parlamentare?',
      explanation: 'În România există 43 de circumscripții electorale (41 județe + municipiul București + circumscripția pentru diaspora).',
      options: [
        { text: '41', isCorrect: false },
        { text: '42', isCorrect: false },
        { text: '43', isCorrect: true },
        { text: '44', isCorrect: false },
      ],
    },
    {
      text: 'Autoritatea Electorală Permanentă (AEP) este:',
      explanation: 'AEP este o instituție administrativă autonomă cu personalitate juridică, în serviciul public.',
      options: [
        { text: 'O instituție subordonată Guvernului', isCorrect: false },
        { text: 'O instituție administrativă autonomă', isCorrect: true },
        { text: 'Un departament al Ministerului Afacerilor Interne', isCorrect: false },
        { text: 'O comisie parlamentară permanentă', isCorrect: false },
      ],
    },
    {
      text: 'Câte zile înaintea alegerilor se constituie birourile electorale de circumscripție?',
      explanation: 'Birourile electorale de circumscripție se constituie cu cel puțin 30 de zile înainte de data alegerilor.',
      options: [
        { text: '20 de zile', isCorrect: false },
        { text: '25 de zile', isCorrect: false },
        { text: '30 de zile', isCorrect: true },
        { text: '45 de zile', isCorrect: false },
      ],
    },
    {
      text: 'Pragul electoral pentru partidele politice la alegerile parlamentare este de:',
      explanation: 'Pragul electoral general este de 5% din voturile valabil exprimate pe întreaga țară.',
      options: [
        { text: '3%', isCorrect: false },
        { text: '5%', isCorrect: true },
        { text: '7%', isCorrect: false },
        { text: '10%', isCorrect: false },
      ],
    },
    {
      text: 'Registrul electoral este administrat de:',
      explanation: 'Registrul electoral este administrat de Autoritatea Electorală Permanentă.',
      options: [
        { text: 'Ministerul Afacerilor Interne', isCorrect: false },
        { text: 'Ministerul Justiției', isCorrect: false },
        { text: 'Autoritatea Electorală Permanentă', isCorrect: true },
        { text: 'Biroul Electoral Central', isCorrect: false },
      ],
    },
    {
      text: 'Corpul experților electorali este coordonat de:',
      explanation: 'Corpul experților electorali funcționează sub coordonarea Autorității Electorale Permanente.',
      options: [
        { text: 'Curtea Constituțională', isCorrect: false },
        { text: 'Autoritatea Electorală Permanentă', isCorrect: true },
        { text: 'Guvernul României', isCorrect: false },
        { text: 'Înalta Curte de Casație și Justiție', isCorrect: false },
      ],
    },
    {
      text: 'Votul în România este:',
      explanation: 'Constituția României stipulează că sufragiul este universal, egal, direct, secret și liber exprimat.',
      options: [
        { text: 'Universal, egal, direct, secret și liber exprimat', isCorrect: true },
        { text: 'Universal, egal, indirect și secret', isCorrect: false },
        { text: 'Obligatoriu, direct și secret', isCorrect: false },
        { text: 'Universal și proporțional', isCorrect: false },
      ],
    },
    {
      text: 'Vârsta minimă pentru a putea vota în România este:',
      explanation: 'Cetățenii cu drept de vot sunt cei care au împlinit vârsta de 18 ani inclusiv.',
      options: [
        { text: '16 ani', isCorrect: false },
        { text: '17 ani', isCorrect: false },
        { text: '18 ani', isCorrect: true },
        { text: '21 de ani', isCorrect: false },
      ],
    },
    {
      text: 'Candidaturile la alegerile parlamentare se depun la:',
      explanation: 'Candidaturile se depun la biroul electoral de circumscripție, cu cel puțin 45 de zile înainte de data alegerilor.',
      options: [
        { text: 'Biroul Electoral Central', isCorrect: false },
        { text: 'Biroul electoral de circumscripție', isCorrect: true },
        { text: 'Tribunalul județean', isCorrect: false },
        { text: 'Autoritatea Electorală Permanentă', isCorrect: false },
      ],
    },
    {
      text: 'Listele electorale permanente se întocmesc și se actualizează de:',
      explanation: 'Listele electorale permanente se întocmesc și se actualizează de Autoritatea Electorală Permanentă.',
      options: [
        { text: 'Primării', isCorrect: false },
        { text: 'Prefecturi', isCorrect: false },
        { text: 'Autoritatea Electorală Permanentă', isCorrect: true },
        { text: 'Comisia electorală județeană', isCorrect: false },
      ],
    },
    {
      text: 'Secțiile de votare se organizează cu cel mult:',
      explanation: 'Fiecare secție de votare cuprinde cel mult 2.000 de alegători înscriși.',
      options: [
        { text: '1.000 de alegători', isCorrect: false },
        { text: '1.500 de alegători', isCorrect: false },
        { text: '2.000 de alegători', isCorrect: true },
        { text: '3.000 de alegători', isCorrect: false },
      ],
    },
  ]

  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i]
    const question = await prisma.question.upsert({
      where: { id: `q-demo-${i + 1}` },
      update: {},
      create: {
        id: `q-demo-${i + 1}`,
        testId: test1.id,
        text: q.text,
        explanation: q.explanation,
        type: QuestionType.SINGLE,
        active: true,
        order: i + 1,
      },
    })
    for (let j = 0; j < q.options.length; j++) {
      const opt = q.options[j]
      await prisma.questionOption.upsert({
        where: { id: `opt-demo-${i + 1}-${j + 1}` },
        update: {},
        create: {
          id: `opt-demo-${i + 1}-${j + 1}`,
          questionId: question.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: j + 1,
        },
      })
    }
  }

  // ── Eveniment demo ──────────────────────────────────────
  console.log('  → Evenimente demo...')
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.event.upsert({
    where: { id: 'event-demo-1' },
    update: {},
    create: {
      id: 'event-demo-1',
      countyCode: 'B',
      title: 'Instruire pentru experți electorali - București',
      description: 'Sesiune de instruire pentru experții electorali înscriși în Corpul experților electorali.',
      startAt: nextWeek,
      endAt: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000),
      location: 'Sediul AEP, Str. Stavropoleos nr. 6, București',
      onlineLink: 'https://meet.google.com/demo-link',
      targetAudience: 'Experți electorali',
      published: true,
    },
  })

  await prisma.event.upsert({
    where: { id: 'event-demo-2' },
    update: {},
    create: {
      id: 'event-demo-2',
      countyCode: 'CJ',
      title: 'Webinar online - Proceduri electorale actualizate',
      description: 'Webinar privind procedurile electorale actualizate pentru alegeri parlamentare.',
      startAt: nextMonth,
      endAt: new Date(nextMonth.getTime() + 2 * 60 * 60 * 1000),
      onlineLink: 'https://zoom.us/demo-link',
      targetAudience: 'Toți participanții',
      published: true,
    },
  })

  console.log('\n✅ Seed finalizat cu succes!')
  console.log('\n📋 Conturi demo create:')
  console.log('  Super Admin:     superadmin@aep.ro  / Admin@AEP2024!')
  console.log('  Admin Conținut:  content@aep.ro     / Content@AEP2024!')
  console.log('  Admin Rapoarte:  rapoarte@aep.ro    / Report@AEP2024!')
  console.log('  Utilizator:      utilizator@demo.ro / User@AEP2024!')
}

main()
  .catch((e) => {
    console.error('❌ Eroare seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
