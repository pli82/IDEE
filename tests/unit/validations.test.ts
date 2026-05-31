// tests/unit/validations.test.ts
import { LoginSchema, RegisterSchema, ProfileSchema, OtpSchema } from '../../src/lib/validations'

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const r = LoginSchema.safeParse({ email: 'test@aep.ro', password: 'pass' })
    expect(r.success).toBe(true)
  })
  it('rejects invalid email', () => {
    const r = LoginSchema.safeParse({ email: 'not-email', password: 'pass' })
    expect(r.success).toBe(false)
  })
})

describe('RegisterSchema', () => {
  const valid = { email: 'user@test.ro', password: 'Test@123!' }
  it('accepts valid data', () => expect(RegisterSchema.safeParse(valid).success).toBe(true))
  it('rejects weak password', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false)
  })
})

describe('OtpSchema', () => {
  it('accepts 6-digit OTP', () => {
    expect(OtpSchema.safeParse({ email: 'a@b.ro', code: '123456' }).success).toBe(true)
  })
  it('rejects non-6-digit OTP', () => {
    expect(OtpSchema.safeParse({ email: 'a@b.ro', code: '12345' }).success).toBe(false)
  })
})

describe('ProfileSchema', () => {
  const valid = {
    nume: 'Popescu', prenume: 'Ion', dataNasterii: '1990-01-15',
    sex: 'M', phone: '0740123456', judetCode: 'B',
    studii: 'Universitare (licență)', calitate: 'Expert electoral înscris în Corpul experților electorali'
  }
  it('accepts complete valid profile', () => expect(ProfileSchema.safeParse(valid).success).toBe(true))
  it('rejects short name', () => {
    expect(ProfileSchema.safeParse({ ...valid, nume: 'X' }).success).toBe(false)
  })
  it('rejects invalid sex', () => {
    expect(ProfileSchema.safeParse({ ...valid, sex: 'X' }).success).toBe(false)
  })
})
