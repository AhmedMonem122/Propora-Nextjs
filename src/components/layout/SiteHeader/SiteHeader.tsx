import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle/ThemeToggle';
import { SiteAuthLinks } from './SiteAuthLinks';
import { MobileNav } from './MobileNav';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
];

/** Sticky glass marketing header (Server Component). */
export function SiteHeader(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg" aria-label="Propora home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          Propora
        </Link>
        <ul className="hidden items-center gap-6 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {/* Desktop: auth buttons inline. Mobile: handled inside MobileNav drawer. */}
          <div className="hidden md:flex">
            <SiteAuthLinks />
          </div>
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
