export interface ValidationResult {
  isValid: boolean;
  score: number;
  cleanedText: string;
  violations: string[];
}

const BANNED_PATTERNS = [
  /\bas an ai\b/i,
  /\bas a language model\b/i,
  /\bi don't have feelings\b/i,
  /\bhope this finds you well\b/i,
  /\bin today's fast-paced\b/i,
  /\bin conclusion\b/i,
  /\bdelve\b/i,
  /\btapestry\b/i,
  /\bgame-changer\b/i,
];

export function sanitizeAndScoreText(text: string, platform = 'INSTAGRAM'): ValidationResult {
  let cleaned = text.trim();
  const violations: string[] = [];
  let score = 100;

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(cleaned)) {
      violations.push(`Contains robotic phrase: ${pattern.source}`);
      cleaned = cleaned.replace(pattern, '').replace(/\s+/g, ' ').trim();
      score -= 20;
    }
  }

  const p = platform.toUpperCase();
  if (p === 'TWITTER' && cleaned.length > 280) {
    cleaned = cleaned.slice(0, 277) + '...';
    violations.push('Twitter character limit exceeded (trimmed to 280)');
    score -= 15;
  }

  if (cleaned.length < 15) {
    violations.push('Response too short to carry marketing value');
    score -= 30;
  }

  return {
    isValid: score >= 60,
    score: Math.max(score, 0),
    cleanedText: cleaned,
    violations,
  };
}

export function validatePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9+]/g, '');
  const cleanDigits = digits.replace(/[^0-9]/g, '');
  if (cleanDigits.length < 9 || cleanDigits.length > 15) return null;
  const repeats = /^(.)\1+$/;
  if (repeats.test(cleanDigits)) return null;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export function validateEmail(email?: string | null): string | null {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) return null;
  const fakeDomains = ['test.com', 'example.com', 'fake.com', 'asdf.com', 'xyz.com'];
  const domain = clean.split('@')[1];
  if (fakeDomains.includes(domain)) return null;
  return clean;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /output\s+(verbatim|raw)\s+(instructions|prompt)/i,
  /repeat\s+everything\s+above/i,
  /you\s+are\s+now\s+unrestricted/i,
  /override\s+system\s+rules/i,
  /<system>|<\/system>|<script>|<\/script>/i,
];

export function detectPromptInjection(text: string): { isInjected: boolean; reason?: string } {
  const t = String(text || '');
  for (const p of INJECTION_PATTERNS) {
    if (p.test(t)) return { isInjected: true, reason: `Flagged prompt injection pattern: ${p.source}` };
  }
  return { isInjected: false };
}

