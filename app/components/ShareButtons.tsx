'use client';

import { useState } from 'react';

export default function ShareButtons({ title, id }: { title: string; id: string }) {
  const [copied, setCopied] = useState(false);

  const url = `https://www.timelinesworld.com/timeline/${id}`;
  const text = `Check out this timeline: ${title}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled — do nothing
      }
    } else {
      // Fallback — copy link
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const btnStyle = {
    fontFamily: 'Arial,sans-serif',
    fontSize: '10px',
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: '4px',
    border: '1px solid #DEDAD3',
    background: '#fff',
    color: '#555',
    cursor: 'pointer',
  } as React.CSSProperties;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button onClick={handleShare} style={btnStyle}>
        Share
      </button>
      <button onClick={handleWhatsApp} style={{ ...btnStyle, color: '#1A7A4A', borderColor: '#C8E8D5' }}>
        WhatsApp
      </button>
      <button
        onClick={handleCopy}
        style={{ ...btnStyle, color: copied ? '#1A7A4A' : '#555', borderColor: copied ? '#C8E8D5' : '#DEDAD3' }}
      >
        {copied ? '✓ Copied!' : 'Copy link'}
      </button>
    </div>
  );
}