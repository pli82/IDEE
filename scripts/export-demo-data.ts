#!/usr/bin/env ts-node
/**
 * scripts/export-demo-data.ts
 * Exportă date demo anonimizate pentru prezentări/teste.
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('\n📤 Export date demo AEP Instruire Online...\n')

  const [users, categories, events, tests] = await Promise.all([
    prisma.user.findMany({
      take: 20,
      include: { profile: true, roles: true },
      where: { status: 'ACTIVE' },
    }),
    prisma.contentCategory.findMany({
      include: { modules: { include: { lessons: { select: { id: true, title: true, order: true } } } } },
    }),
    prisma.event.findMany({ take: 10, include: { county: true } }),
    prisma.test.findMany({
      include: { _count: { select: { questions: true, attempts: true } } },
    }),
  ])

  const demo = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalUsers: users.length,
      totalCategories: categories.length,
      totalEvents: events.length,
      totalTests: tests.length,
    },
    categories: categories.map(c => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      modules: c.modules.map(m => ({ id: m.id, title: m.title, lessons: m.lessons.length })),
    })),
    events: events.map(e => ({
      title: e.title,
      county: e.county?.name,
      startAt: e.startAt,
      location: e.location,
    })),
    tests: tests.map(t => ({
      id: t.id,
      title: t.title,
      questions: t._count.questions,
      attempts: t._count.attempts,
    })),
  }

  const outPath = path.resolve('public/demo/demo-data.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(demo, null, 2))

  console.log(`✅ Date exportate în: ${outPath}`)
  console.log(`   ${users.length} utilizatori, ${categories.length} categorii, ${events.length} evenimente, ${tests.length} teste\n`)
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
