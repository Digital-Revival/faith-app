const CHAR_FALLBACK_LIMIT = 200;

export function truncateToSentences(
  text: string,
  maxSentences: number,
): { text: string; truncated: boolean } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { text: '', truncated: false };
  }

  const sentenceMatches = trimmed.match(/[^.!?]+[.!?]+/g);

  if (!sentenceMatches || sentenceMatches.length === 0) {
    if (trimmed.length <= CHAR_FALLBACK_LIMIT) {
      return { text: trimmed, truncated: false };
    }
    return {
      text: `${trimmed.slice(0, CHAR_FALLBACK_LIMIT).trimEnd()}…`,
      truncated: true,
    };
  }

  const sentences = sentenceMatches.map((sentence) => sentence.trim());

  if (sentences.length <= maxSentences) {
    return { text: sentences.join(' '), truncated: false };
  }

  return {
    text: `${sentences.slice(0, maxSentences).join(' ')}…`,
    truncated: true,
  };
}
