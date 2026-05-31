// tests/unit/auth.test.ts
import {
  hashPassword, verifyPassword, validatePasswordStrength,
  generateOtp, hashOtp, verifyOtp
} from '../../src/lib/auth'

describe('Password hashing', () => {
  it('should hash and verify password', async () => {
    const password = 'Test@1234!'
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    const valid = await verifyPassword(password, hash)
    expect(valid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const hash = await hashPassword('Correct@1!')
    const valid = await verifyPassword('Wrong@1!', hash)
    expect(valid).toBe(false)
  })
})

describe('Password validation', () => {
  it('should accept strong password', () => {
    expect(validatePasswordStrength('Stron@1!')).toBeNull()
  })
  it('should reject short password', () => {
    expect(validatePasswordStrength('Abc@1')).toContain('cel puțin 8 caractere')
  })
  it('should require uppercase', () => {
    expect(validatePasswordStrength('lowercase@1!')).toContain('literă mare')
  })
  it('should require digit', () => {
    expect(validatePasswordStrength('NoDigit@!')).toContain('cifră')
  })
  it('should require special char', () => {
    expect(validatePasswordStrength('NoSpecial1A')).toContain('caracter special')
  })
})

describe('OTP', () => {
  it('should generate 6-digit OTP', () => {
    const otp = generateOtp()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('should hash and verify OTP', async () => {
    const otp = generateOtp()
    const hash = await hashOtp(otp)
    expect(await verifyOtp(otp, hash)).toBe(true)
    expect(await verifyOtp('000000', hash)).toBe(false)
  })
})
