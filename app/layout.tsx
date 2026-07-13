import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Timelines World — The chronology of everything",
  description: "Browse timelines for people, places, events, inventions, disasters and more. Simple. Free. Forever.",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Timelines World — The chronology of everything',
    description: 'Browse timelines for people, places, events, inventions, disasters and more. Simple. Free. Forever.',
    url: 'https://www.timelinesworld.com',
    siteName: 'Timelines World',
    images: [
      {
        url: 'https://www.timelinesworld.com/Logo_Horizontal_1200_340.png',
        width: 1200,
        height: 340,
        alt: 'Timelines World — The chronology of everything',
      }
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Timelines World — The chronology of everything',
    description: 'Browse timelines for people, places, events, inventions, disasters and more. Simple. Free. Forever.',
    images: ['https://www.timelinesworld.com/Logo_Horizontal_1200_340.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DCT30YV1MT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DCT30YV1MT');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}