import { SiteHeader } from '@/components/layout/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter/SiteFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
