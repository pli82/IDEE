// src/lib/email.ts - Serviciu email cu suport MailHog (dev) și SMTP (prod)
import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT || '1025', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth:
      process.env.EMAIL_USER
        ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        : undefined,
  })
}

const FROM = `"${process.env.EMAIL_FROM_NAME || 'AEP Instruire Online'}" <${
  process.env.EMAIL_FROM || 'noreply@aep.ro'
}>`

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ── Template de bază ──────────────────────────────────────
function wrapEmail(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #1a5fa8; padding: 24px 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 20px; }
    .header p { color: #b3d0f0; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; color: #374151; line-height: 1.6; }
    .otp-box { background: #f0f7ff; border: 2px dashed #1a5fa8; border-radius: 8px; text-align: center; padding: 24px; margin: 24px 0; }
    .otp-code { font-size: 40px; font-weight: bold; color: #1a5fa8; letter-spacing: 8px; }
    .btn { display: inline-block; background: #1a5fa8; color: white !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AEP Instruire Online</h1>
      <p>AEP</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <p>AEP · <a href="${BASE_URL}">aep.ro</a></p>
      <p>Nu răspundeți la acest email. Dacă nu ați inițiat această acțiune, ignorați mesajul.</p>
    </div>
  </div>
</body>
</html>`
}

// ── Trimitere email verificare OTP ────────────────────────
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransporter()
  const body = `
    <h2 style="margin:0 0 16px">Verificarea adresei de email</h2>
    <p>Bun venit la <strong>AEP Instruire Online</strong>!</p>
    <p>Folosiți codul de mai jos pentru a confirma adresa dvs. de email:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <p style="color:#6b7280;font-size:13px;margin:8px 0 0">Codul este valabil <strong>10 minute</strong></p>
    </div>
    <p style="color:#6b7280;font-size:13px">Dacă nu ați creat un cont pe platforma AEP, ignorați acest mesaj.</p>
  `
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'AEP Instruire - Cod verificare email',
    html: wrapEmail('Cod verificare email', body),
  })
}

// ── Trimitere email resetare parolă ───────────────────────
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}`
  const transporter = createTransporter()
  const body = `
    <h2 style="margin:0 0 16px">Resetare parolă</h2>
    <p>Ați solicitat resetarea parolei pentru contul asociat adresei <strong>${email}</strong>.</p>
    <p>Apăsați butonul de mai jos pentru a seta o parolă nouă:</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${resetUrl}" class="btn">Resetează parola</a>
    </div>
    <p style="color:#6b7280;font-size:13px">Sau copiați acest link în browser:<br>
    <a href="${resetUrl}" style="color:#1a5fa8;word-break:break-all">${resetUrl}</a></p>
    <p style="color:#6b7280;font-size:13px">Linkul este valabil <strong>60 de minute</strong>. Dacă nu ați solicitat resetarea parolei, ignorați acest mesaj.</p>
  `
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'AEP Instruire - Resetare parolă',
    html: wrapEmail('Resetare parolă', body),
  })
}

// ── Trimitere notificare eveniment ─────────────────────────
export async function sendEventNotificationEmail(
  email: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string
): Promise<void> {
  const transporter = createTransporter()
  const body = `
    <h2 style="margin:0 0 16px">Eveniment de instruire nou în județul dvs.</h2>
    <p>A fost adăugat un nou eveniment de instruire:</p>
    <div style="background:#f0f7ff;border-radius:8px;padding:20px;margin:16px 0">
      <h3 style="margin:0 0 8px;color:#1a5fa8">${eventTitle}</h3>
      <p style="margin:4px 0;color:#374151">📅 Data: <strong>${eventDate}</strong></p>
      <p style="margin:4px 0;color:#374151">📍 Locație: <strong>${eventLocation}</strong></p>
    </div>
    <div style="text-align:center">
      <a href="${BASE_URL}/dashboard/calendar" class="btn">Vezi detalii</a>
    </div>
  `
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `AEP Instruire - Eveniment nou: ${eventTitle}`,
    html: wrapEmail('Eveniment de instruire', body),
  })
}
