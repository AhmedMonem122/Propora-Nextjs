'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog/Dialog';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
];

/** Hamburger → side drawer on mobile/tablet (shadcn-style sheet). */
export function MobileNav(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="left-0 top-0 flex h-full w-72 max-w-[80vw] translate-x-0 translate-y-0 flex-col rounded-none p-0"
          aria-label="Site menu"
        >
          <DialogTitle className="border-b p-4 font-bold">Propora</DialogTitle>
          <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t p-4">
            <Button variant="outline" asChild onClick={() => setOpen(false)}>
              <Link href="/login">Log in</Link>
            </Button>
            <Button variant="accent" asChild onClick={() => setOpen(false)}>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
