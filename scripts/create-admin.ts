#!/usr/bin/env ts-node
/**
 * scripts/create-admin.ts
 * Utilizare: npm run create-admin
 *
 * Creează un cont de Super Admin în baza de date.
 * Folosit pentru setup inițial sau recuperare acces.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans) }))
}

async function main() {
  console.log('\n=== AEP Instruire Online — Creare Super Admin ===\n')

  const email = (await question('Email admin: ')).trim()
  const prenume = (await question('Prenume: ')).trim()
  const nume = (await question('Nume: ')).trim()
  const password = await question('Parolă (min 8 caractere, literă mare, cifră, special): ')

  if (password.length < 8) { console.error('❌ Parola prea scurtă.'); process.exit(1) }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) { console.error(`❌ Email-ul "${email}" există deja.`); process.exit(1) }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.$transaction(async tx => {
    const u = await tx.user.create({
      data: {
        email,
        passwordHash,
        status: 'ACTIVE',
        emailVerified: true,
        profile: {
          create: {
            prenume,
            nume,
            profileComplete: true,
            gdprConsentAt: new Date(),
          },
        },
        roles: { create: { role: 'SUPER_ADMIN' } },
      },
    })
    await tx.auditLog.create({
      data: { actorId: u.id, action: 'SUPER_ADMIN_CREATED', entityType: 'User', entityId: u.id },
    })
    return u
  })

  console.log(`\n✅ Super Admin creat!`)
  console.log(`   ID:    ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Autentifică-te la /auth/login\n`)
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
