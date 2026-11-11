export interface ValidationResult {
  isValid: boolean;
  score: number;
  cleanedText: string;
  violations: string[];
}

const BANNED_PATTERNS = [
  // Original patterns
  /\bas an ai\b/i,
  /\bas a language model\b/i,
  /\bi don't have feelings\b/i,
  /\bhope this finds you well\b/i,
  /\bin today's fast-paced\b/i,
  /\bin conclusion\b/i,
  /\bdelve\b/i,
  /\btapestry\b/i,
  /\bgame-changer\b/i,

  // New AI & Corporate Clichés
  /\bas an artificial intelligence\b/i,
  /\bmy knowledge cutoff\b/i,
  /\bimportant to note that\b/i,
  /\bleverage\b/i,
  /\bsynergy\b/i,
  /\bparadigm shift\b/i,
  /\bholistic approach\b/i,
  /\brevolutionize\b/i,
  /\bdeep dive\b/i,
  /\bcutting-edge\b/i,
  /\bseamlessly\b/i,
  /\bit is worth noting that\b/i,
  /\bnavigating the complexities\b/i,
  /\bbeacon of\b/i,
  /\btestament to\b/i,
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
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /output\s+(verbatim|raw)\s+(instructions|prompt)/i,
  /repeat\s+(everything|the\s+above|all\s+text)/i,
  /you\s+are\s+now\s+(unrestricted|dan|in\s+developer)/i,
  /override\s+(system|safety|security)\s+rules/i,
  /reveal\s+(your|the)\s+(system\s+prompt|instructions|directives)/i,
  /pretend\s+you\s+have\s+no\s+(rules|limits|guidelines)/i,
  /<system>|<\/system>|<script>|<\/script>/i,
];

export function normalizeForSecurityCheck(text: string): string {
  let cleaned = String(text || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u0000-\u001F]/g, '');
  const leetMap: Record<string, string> = {
    '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a',
    '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g',
  };
  cleaned = cleaned.toLowerCase().replace(/[01!|34@5$7+89]/g, (ch) => leetMap[ch] || ch);
  cleaned = cleaned.replace(/\b([a-z])\s+([a-z])\s+([a-z])\s+([a-z])\b/g, '$1$2$3$4');
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function detectPromptInjection(text: string): { isInjected: boolean; reason?: string } {
  const raw = String(text || '');
  const normalized = normalizeForSecurityCheck(raw);
  for (const p of INJECTION_PATTERNS) {
    if (p.test(raw)) return { isInjected: true, reason: `Matched pattern on raw text: ${p.source}` };
    if (p.test(normalized)) return { isInjected: true, reason: `Matched pattern on de-obfuscated text: ${p.source}` };
  }
  return { isInjected: false };
}
