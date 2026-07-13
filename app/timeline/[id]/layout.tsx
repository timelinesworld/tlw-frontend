type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/timelines?select=title,description&id=eq.${id}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: 'no-store',
      }
    );
    const data = await res.json();
    const tl = data?.[0];

    if (!tl) return { title: 'Timelines World' };

    return {
      title: `${tl.title} — Timelines World`,
      description: tl.description,
      openGraph: {
        title: `${tl.title} — Timelines World`,
        description: tl.description,
        url: `https://www.timelinesworld.com/timeline/${id}`,
        siteName: 'Timelines World',
        images: [{
          url: 'https://www.timelinesworld.com/Logo_Horizontal_1200_340.png',
          width: 1200,
          height: 340,
          alt: `${tl.title} — Timelines World`,
        }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${tl.title} — Timelines World`,
        description: tl.description,
        images: ['https://www.timelinesworld.com/Logo_Horizontal_1200_340.png'],
      },
    };
  } catch {
    return { title: 'Timelines World' };
  }
}

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}