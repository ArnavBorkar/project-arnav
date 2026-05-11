import { BottomNav } from '@/components/app-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col safe-top">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
