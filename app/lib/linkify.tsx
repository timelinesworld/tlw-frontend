import React from 'react';

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
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};