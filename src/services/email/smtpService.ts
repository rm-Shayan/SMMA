import tls from 'tls';
import { logger } from '../../config/logger';

export interface LeadEmailPayload {
  toEmail: string;
  companyName: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  channel: string;
  interest: string;
  leadScore: number;
  googleSheetUrl: string;
}

/**
 * Sends a raw SMTP email over TLS (port 465) using standard RFC 5321 commands.
 * Zero external npm dependencies (native Node.js tls module).
 */
export async function sendLeadAlertEmail(payload: LeadEmailPayload): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_MAIL;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `SMMA Leads <${user}>`;

  if (!user || !pass || !payload.toEmail) {
    logger.debug('SMTP credentials or recipient email missing. Skipping email alert.');
    return false;
  }

  const subject = `🔥 New Hot Lead: ${payload.leadName} (${payload.channel})`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #1e293b; margin-top: 0;">🚀 New Lead Captured by AI Agent!</h2>
      <p style="color: #475569;">Hello <strong>${payload.companyName}</strong>, your autonomous marketing agent just qualified a new prospect:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Name:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${payload.leadName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Phone:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0284c7;">${payload.leadPhone}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${payload.leadEmail}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Channel:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${payload.channel}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Inquiry:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${payload.interest}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Intent Score:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #16a34a;">${payload.leadScore}/100</td></tr>
      </table>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${payload.googleSheetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📊 View Live on Google Sheet</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">Powered by Autonomous SMMA Agent Engine</p>
    </div>
  `;

  const rawMessage = [
    `From: ${from}`,
    `To: ${payload.toEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
    '',
    '.',
  ].join('\r\n');

  return new Promise((resolve) => {
    const socket = tls.connect({ host, port }, () => {
      logger.debug('TLS connection established for SMTP lead alert');
    });

    socket.setEncoding('utf8');
    let step = 0;

    socket.on('data', (data) => {
      const response = data.toString();
      if (response.startsWith('5') || response.startsWith('4')) {
        logger.error({ response: response.trim() }, 'SMTP server rejected command');
        socket.end();
        resolve(false);
        return;
      }

      if (step === 0 && response.startsWith('220')) {
        step++;
        socket.write('EHLO localhost\r\n');
      } else if (step === 1 && (response.includes('250-AUTH') || response.includes('250 AUTH'))) {
        step++;
        socket.write('AUTH LOGIN\r\n');
      } else if (step === 2 && response.startsWith('334')) {
        step++;
        socket.write(`${Buffer.from(user).toString('base64')}\r\n`);
      } else if (step === 3 && response.startsWith('334')) {
        step++;
        socket.write(`${Buffer.from(pass).toString('base64')}\r\n`);
      } else if (step === 4 && response.startsWith('235')) {
        step++;
        socket.write(`MAIL FROM:<${user}>\r\n`);
      } else if (step === 5 && response.startsWith('250')) {
        step++;
        socket.write(`RCPT TO:<${payload.toEmail}>\r\n`);
      } else if (step === 6 && response.startsWith('250')) {
        step++;
        socket.write('DATA\r\n');
      } else if (step === 7 && response.startsWith('354')) {
        step++;
        socket.write(`${rawMessage}\r\n`);
      } else if (step === 8 && response.startsWith('250')) {
        logger.info({ to: payload.toEmail, lead: payload.leadName }, '📧 Lead alert email delivered successfully!');
        socket.write('QUIT\r\n');
        socket.end();
        resolve(true);
      }
    });

    socket.on('error', (err) => {
      logger.error({ err: err.message }, 'SMTP socket error during lead alert dispatch');
      resolve(false);
    });
  });
}
