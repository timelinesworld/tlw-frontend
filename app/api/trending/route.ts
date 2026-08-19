import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;


const EXCLUDE_KEYWORDS = [
  'stock price', 'share price', 'weather', 'points table',
  'horoscope', 'near me', 'how to', 'lottery',
  'nifty', 'sensex', 'crypto', 'bitcoin'
];

function isRelevantTopic(topic: string): boolean {
  const lower = topic.toLowerCase();
  if (EXCLUDE_KEYWORDS.some(kw => lower.includes(kw))) return false;
  if (topic.length < 4) return false;
  return true;
}

async function fetchTrends(geo: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trending/rss?geo=${geo}`,
      { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    const xml = await res.text();
    console.log('RSS XML sample:', xml.substring(0, 500));
    
    // Try CDATA format first
    let matches = xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g) || [];
    
    // If empty try plain title tags
    if (matches.length === 0) {
      matches = xml.match(/<title>(.*?)<\/title>/g) || [];
    }

    return matches
      .map(m => m
        .replace(/<title><!\[CDATA\[/, '')
        .replace(/\]\]><\/title>/, '')
        .replace(/<title>/, '')
        .replace(/<\/title>/, '')
        .trim()
      )
      .filter(t => 
        t !== 'Trending searches' && 
        t !== 'Google Trends' &&
        t !== 'Daily Search Trends' &&
        t !== 'Top stories' &&
        /^[a-zA-Z0-9\s\-\&\.\'\,]+$/.test(t) &&
        isRelevantTopic(t)
      )
      .slice(0, 10);
  } catch (e) {
    console.log('Fetch error:', e);
    return [];
  }
}

async function checkAlreadyPublished(topics: string[]): Promise<string[]> {
  const published: string[] = [];
  for (const topic of topics) {
    const words = topic.split(' ').filter(w => w.length > 4);
    if (words.length < 2) continue;
    const { data } = await supabase
      .from('timelines')
      .select('title')
      .ilike('title', `%${topic}%`);
    if (data && data.length > 0) {
      published.push(topic);
    }
  }
  return published;
}

async function sendTelegram(message: string) {
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    }
  );
  return await res.json();
}

export async function GET() {
  try {
    // Fetch trends
    const indiaTrends = await fetchTrends('IN');
    const worldTrends = await fetchTrends('GB');

    // Check already published
    const indiaPublished = await checkAlreadyPublished(indiaTrends);
    const worldPublished = await checkAlreadyPublished(worldTrends);

    // Build message
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let message = `🔥 <b>TLW Trending Topics</b>\n📅 ${now}\n\n`;

    message += `🇮🇳 <b>INDIA TOP 10</b>\n`;
    indiaTrends.forEach((topic, i) => {
      const flag = indiaPublished.includes(topic) ? ' ⚠️ Already on TLW' : '';
      message += `${i + 1}. ${topic}${flag}\n`;
    });

    message += `\n🌍 <b>WORLD TOP 10</b>\n`;
    worldTrends.forEach((topic, i) => {
      const flag = worldPublished.includes(topic) ? ' ⚠️ Already on TLW' : '';
      message += `${i + 1}. ${topic}${flag}\n`;
    });

    message += `\n---\n`;
    message += `⚠️ = Already published on TLW\n`;
    message += `Select 2 from India + 2 from World for new timelines.`;

    // Send to Telegram
    await sendTelegram(message);

    return NextResponse.json({ success: true, message: 'Trending topics sent to Telegram' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}