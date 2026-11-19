/**
 * Utility helper untuk memproses link YouTube (Shorts, Watch, Embed, Share)
 */

export function extractYoutubeId(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Jika sudah 11 karakter string alphanumeric / underscore / strip, kemungkinan besar direct ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Pola regex komprehensif untuk YouTube
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);

  return match && match[1] ? match[1] : trimmed;
}

export function getYoutubeThumbnail(youtubeId: string, quality: 'hq' | 'max' = 'hq'): string {
  if (!youtubeId) return '';
  if (quality === 'max') {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYoutubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}

