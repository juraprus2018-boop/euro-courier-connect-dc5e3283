// Lichte anti-spam heuristieken voor publieke formulieren.
// Geen externe service nodig: honeypot + tijdscontrole + inhoudsanalyse.

export const HONEYPOT_FIELD = 'website_url';

/** Minimale tijd (ms) tussen laden van het formulier en verzenden. Bots vullen direct in. */
export const MIN_FILL_MS = 3500;

const LINK_RE = /(https?:\/\/|www\.|\[url|<a\s)/i;
const NON_LATIN_RE = /[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF]/;
const SPAM_WORDS =
  /\b(seo|casino|crypto|bitcoin|loan|viagra|porn|escort|betting|forex|backlink|ranking|traffic bot|投资)\b/i;

export interface SpamCheckInput {
  honeypot?: string;
  startedAt: number;
  fields: (string | undefined | null)[];
}

/** Geeft een reden terug als de inzending als spam wordt gezien, anders null. */
export function detectSpam({ honeypot, startedAt, fields }: SpamCheckInput): string | null {
  if (honeypot && honeypot.trim().length > 0) return 'honeypot';
  if (Date.now() - startedAt < MIN_FILL_MS) return 'te snel verzonden';

  const text = fields.filter(Boolean).join(' ');
  if (LINK_RE.test(text)) return 'links niet toegestaan';
  if (NON_LATIN_RE.test(text)) return 'ongeldige tekens';
  if (SPAM_WORDS.test(text)) return 'verdachte inhoud';

  // Zelfde teken herhaald (aaaaaaa) of naam zonder klinkers
  if (/(.)\1{6,}/.test(text)) return 'verdachte inhoud';

  return null;
}
