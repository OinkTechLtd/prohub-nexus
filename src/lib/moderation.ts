// Simple content moderation utility
const BLOCKED_PATTERNS = [
  /спам/gi,
  /реклама/gi,
  /казино/gi,
  /ставк[аи]/gi,
  /купи(ть|те)/gi,
  /заработок/gi,
  /http[s]?:\/\/(?!prohub\.|localhost)/gi, // Block external links
];

export function moderateContent(text: string): { isClean: boolean; reason?: string } {
  if (!text || typeof text !== 'string') {
    return { isClean: true };
  }

  const normalized = text.toLowerCase().trim();

  // Check for excessive caps
  const capsCount = (text.match(/[A-ZА-Я]/g) || []).length;
  if (capsCount > text.length * 0.6 && text.length > 10) {
    return { 
      isClean: false, 
      reason: "Слишком много заглавных букв. Пожалуйста, используйте обычный регистр." 
    };
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { 
        isClean: false, 
        reason: "Контент содержит запрещенные слова или ссылки. Пожалуйста, исправьте текст." 
      };
    }
  }

  // Check for excessive repetition
  const words = normalized.split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 10 && uniqueWords.size < words.length * 0.3) {
    return { 
      isClean: false, 
      reason: "Обнаружено слишком много повторяющихся слов." 
    };
  }

  return { isClean: true };
}
