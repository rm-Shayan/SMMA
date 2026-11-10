import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from '../../core/config/logger.config';

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getGoogleAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiry > now + 300) {
    return cachedToken;
  }

  let credsPath = path.resolve(process.cwd(), 'google-credentials.json');
  if (!fs.existsSync(credsPath)) {
    credsPath = path.resolve(process.cwd(), 'backend', 'google-credentials.json');
  }
  if (!fs.existsSync(credsPath)) {
    credsPath = path.resolve(__dirname, '../../..', 'google-credentials.json');
  }
  if (!fs.existsSync(credsPath)) {
    logger.warn('google-credentials.json not found. Google API calls will be skipped.');
    return null;
  }

  try {
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claim = Buffer.from(
      JSON.stringify({
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      })
    ).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${claim}`);
    const signature = sign.sign(creds.private_key, 'base64url');
    const assertion = `${header}.${claim}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(assertion)}`,
    });

    const data: any = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiry = now + (data.expires_in || 3600);
      return cachedToken;
    }

    logger.error({ data }, 'Google OAuth token response error');
    return null;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to get Google Access Token');
    return null;
  }
}

