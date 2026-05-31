// tests/setup.ts
import '@testing-library/jest-dom'

// Setare timezone pentru teste consistente
process.env.TZ = 'Europe/Bucharest'

// Mock env
process.env.JWT_SECRET = 'test-secret-for-jest'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NODE_ENV = 'test'
