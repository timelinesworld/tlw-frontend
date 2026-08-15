import React from 'react';

// Parse **bold**, [Label](URL) and raw https:// links
export const parseBold = (text: string): React.ReactNode => {
  if (!text) return text;

  // Combined regex — matches **bold**, [Label](URL), or https:// URLs
  const pattern = /(\*\*.*?\*\*|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/[^\s]+)/g;

  const parts: React.ReactNode[] = [];
  let last = 0;
  let match;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > last) {
      parts.push(<span key={i++}>{text.slice(last, match.index)}</span>);
    }

    const full = match[0];

    if (full.startsWith('**')) {
      // Bold text
      const inner = full.slice(2, -2);
      parts.push(<strong key={i++} style={{ fontWeight: 700 }}>{inner}</strong>);
    } else if (full.startsWith('[')) {
      // [Label](URL) — labelled link
      const label = match[2];
      const url = match[3];
      parts.push(
        <a key={i++} href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: '#1A7A4A', textDecorationThickness: '1.5px', textUnderlineOffset: '2px', cursor: 'pointer' }}>
          {label}
        </a>
      );
    } else {
      // Raw https:// URL
      parts.push(
        <a key={i++} href={full} target="_blank" rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: '#1A7A4A', textDecorationThickness: '1.5px', textUnderlineOffset: '2px', cursor: 'pointer' }}>
          {full}
        </a>
      );
    }

    last = match.index + full.length;
  }

  // Add remaining text
  if (last < text.length) {
    parts.push(<span key={i++}>{text.slice(last)}</span>);
  }

  return <>{parts}</>;
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'at', 'by', 'for',
  'to', 'is', 'was', 'and', 'or', 'on', 'with', 'from'
]);

// Check if title is valid — 2+ words, 4+ chars, no stopwords only
const isValidTitle = (title: string): boolean => {
  const words = title.trim().toLowerCase().split(/\s+/);
  if (words.length < 2) return false;
  if (title.length < 4) return false;
  const allStopwords = words.every(w => STOPWORDS.has(w));
  if (allStopwords) return false;
  return true;
};

export const linkifyText = (
  text: string,
  timelines: { id: number; title: string }[]
): React.ReactNode => {
  if (!text || !timelines.length) return text;

  // Filter valid timeline titles
  const validTimelines = timelines.filter(t => isValidTitle(t.title));

  // Sort by length descending — match longer titles first
  const sorted = [...validTimelines].sort((a, b) => b.title.length - a.title.length);

  // Build a regex that matches any timeline title (case insensitive)
  const escaped = sorted.map(t =>
    t.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  if (escaped.length === 0) return text;

  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');

  // Split text by matches
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const match = sorted.find(
          t => t.title.toLowerCase() === part.toLowerCase()
        );
        if (match) {
          return <a key={i} href={`/timeline/${match.id}`} style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: '#1A7A4A', textDecorationThickness: '1.5px', textUnderlineOffset: '2px', cursor: 'pointer' }}>{part}</a>;
        }
        return <span key={i}>{parseBold(part)}</span>;
      })}
    </>
  );
};