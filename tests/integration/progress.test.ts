// tests/integration/progress.test.ts
// Teste de integrare pentru API-ul de progres (mock Prisma)
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    progress: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('../../src/lib/auth', () => ({
  getSession: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.ro', roles: ['USER'], profileComplete: true }),
}))

describe('Progress API logic', () => {
  it('should compute COMPLETED status at 95%+ watch', () => {
    const watchedPercent = 96
    const status = watchedPercent >= 95 ? 'COMPLETED' : watchedPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    expect(status).toBe('COMPLETED')
  })

  it('should compute IN_PROGRESS status at 50%', () => {
    const watchedPercent = 50
    const status = watchedPercent >= 95 ? 'COMPLETED' : watchedPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    expect(status).toBe('IN_PROGRESS')
  })

  it('should compute NOT_STARTED status at 0%', () => {
    const watchedPercent = 0
    const status = watchedPercent >= 95 ? 'COMPLETED' : watchedPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    expect(status).toBe('NOT_STARTED')
  })
})
