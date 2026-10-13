import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from '@/components/Providers/Providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://propora-nextjs.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: 'Propora — Better Properties. Happier Communities.', template: '%s · Propora' },
  description:
    'Propora unifies properties, buildings, units, residents, leases, payments, maintenance and documents in one fast multitenant dashboard.',
  openGraph: {
    type: 'website',
    siteName: 'Propora',
    title: 'Propora — Better Properties. Happier Communities.',
    description: 'Property management, reimagined: portfolio, leases, billing and maintenance in one dashboard.',
  },
  twitter: { card: 'summary_large_image', title: 'Propora', description: 'Better Properties. Happier Communities.' },
};

export const viewport: Viewport = { themeColor: '#0b3b5c' };

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  // Vercel-only: /_vercel/* scripts 404 on local servers and pollute the console.
  const vercelProd = process.env.VERCEL === '1';
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
        {vercelProd ? <Analytics /> : null}
        {vercelProd ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
