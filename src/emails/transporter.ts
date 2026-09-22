import nodemailer, { type Transporter } from 'nodemailer'

let _transporter: Transporter | null = null

export function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null
  if (_transporter) return _transporter
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  return _transporter
}
