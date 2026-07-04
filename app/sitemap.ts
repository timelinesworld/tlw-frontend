import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap() {
  const baseUrl = 'https://www.timelinesworld.com';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic timeline pages
  const { data: timelines } = await supabase
    .from('timelines')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  const timelinePages = (timelines || []).map((t: any) => ({
    url: `${baseUrl}/timeline/${t.id}`,
    lastModified: new Date(t.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...timelinePages];
}