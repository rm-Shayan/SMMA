import * as nodemailer from 'nodemailer';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/config/logger.config';

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let transporter: nodemailer.Transporter | null = null;
let smtpConfigured = false;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!env.SMTP_MAIL || !env.SMTP_PASS) {
    smtpConfigured = false;
    return null;
  }
  try {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 465,
      secure: Number(env.SMTP_PORT) === 465,
      auth: { user: env.SMTP_MAIL, pass: env.SMTP_PASS },
    });
    smtpConfigured = true;
    return transporter;
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Failed to create SMTP transporter');
    return null;
  }
}

export function isSmtpConfigured(): boolean {
  return smtpConfigured || Boolean(env.SMTP_MAIL && env.SMTP_PASS);
}

export async function sendAuthMail(options: MailOptions): Promise<{ sent: boolean; info?: any; previewUrl?: string }> {
  const transporterInstance = getTransporter();

  if (transporterInstance) {
    try {
      const info = await transporterInstance.sendMail({
        from: env.SMTP_FROM || env.SMTP_MAIL || 'no-reply@localhost',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      logger.info({ to: options.to, subject: options.subject, messageId: info.messageId }, 'Auth email sent');
      let previewUrl: string | undefined;
      try {
        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      } catch {}
      return { sent: true, info, previewUrl };
    } catch (err: any) {
      logger.warn({ err: err.message, to: options.to }, 'SMTP send failed, falling back to console');
    }
  }

  const devHint = smtpConfigured ? '' : ' (SMTP not configured - check server logs for token)';
  logger.info(
    { to: options.to, subject: options.subject, body: options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), devHint },
    'Auth email (dev fallback)',
  );

  return { sent: smtpConfigured };
}
