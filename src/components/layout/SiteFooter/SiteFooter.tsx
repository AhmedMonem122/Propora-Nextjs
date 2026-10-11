import Link from 'next/link';
import { Building2 } from 'lucide-react';

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t bg-[#0b1f3a] text-slate-300 dark:bg-black/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            Propora
          </p>
          <p className="mt-3 text-sm text-slate-400">Better Properties. Happier Communities.</p>
        </div>
        <nav aria-label="Product">
          <p className="text-sm font-semibold text-white">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/services" className="hover:text-white">Services</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="text-sm font-semibold text-white">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-sm font-semibold text-white">Account</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-white">Log in</Link></li>
            <li><Link href="/register" className="hover:text-white">Get started</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500">
          © {new Date().getFullYear()} Propora. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
