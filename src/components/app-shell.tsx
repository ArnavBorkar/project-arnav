'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Flame, LineChart, BookOpen, Users, Settings as Cog, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Today', icon: Calendar },
  { href: '/streaks', label: 'Streaks', icon: Flame },
  { href: '/metrics', label: 'Metrics', icon: LineChart },
  { href: '/log', label: 'Log', icon: BookOpen },
  { href: '/people', label: 'People', icon: Users },
  { href: '/reading', label: 'Books', icon: BookText },
  { href: '/settings', label: 'Settings', icon: Cog },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/85 backdrop-blur safe-bottom"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-1 pt-1">
        {tabs.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MoreNav() {
  const pathname = usePathname();
  return (
    <nav
      className="hidden border-t border-border bg-surface text-xs lg:flex"
      aria-label="Secondary"
    >
      <div className="mx-auto flex max-w-md flex-1 items-stretch justify-around">
        {tabs.slice(5).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
