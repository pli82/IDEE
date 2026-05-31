// src/lib/validations.ts — Scheme Zod pentru validare
import { z } from 'zod'

// ── Autentificare ────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(1, 'Parola este obligatorie'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractere')
    .regex(/[A-Z]/, 'Cel puțin o literă mare')
    .regex(/[a-z]/, 'Cel puțin o literă mică')
    .regex(/[0-9]/, 'Cel puțin o cifră')
    .regex(/[^A-Za-z0-9]/, 'Cel puțin un caracter special'),
  phone: z.string().regex(/^(\+4|0)[0-9]{9}$/, 'Număr de telefon invalid').optional(),
})

export const OtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Codul OTP are 6 cifre'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email invalid'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Minimum 8 caractere')
    .regex(/[A-Z]/, 'Cel puțin o literă mare')
    .regex(/[a-z]/, 'Cel puțin o literă mică')
    .regex(/[0-9]/, 'Cel puțin o cifră')
    .regex(/[^A-Za-z0-9]/, 'Cel puțin un caracter special'),
})

// ── Profil utilizator ────────────────────────────────────
export const ProfileSchema = z.object({
  nume: z.string().min(2, 'Minimum 2 caractere').max(100),
  prenume: z.string().min(2, 'Minimum 2 caractere').max(100),
  dataNasterii: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format dată invalid (YYYY-MM-DD)'),
  sex: z.enum(['M', 'F']),
  phone: z.string().regex(/^(\+4|0)[0-9]{9}$/, 'Număr invalid'),
  adresa: z.string().max(500).optional(),
  judetCode: z.string().min(1, 'Județul este obligatoriu'),
  studii: z.string().min(1, 'Studiile sunt obligatorii'),
  calitate: z.string().min(1, 'Calitatea este obligatorie'),
  serieCI: z.string().max(10).optional(),
  numarCI: z.string().max(10).optional(),
  dataExpirareCI: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gdprConsent: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ProfileInput = z.infer<typeof ProfileSchema>
