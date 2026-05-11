import { redirect } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { getSession } from '@/lib/session';
import { PinPad } from './pin-pad';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await getSession();
  if (session.authenticated) {
    redirect(searchParams.next || '/');
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="flex flex-col items-center gap-3">
        <Logo size={72} />
        <h1 className="text-2xl font-semibold tracking-tight">Project AB</h1>
        <p className="text-sm text-muted-foreground">Designed to make Arnav 10x.</p>
      </div>
      <div className="mt-10 w-full max-w-xs">
        <PinPad nextPath={searchParams.next} />
      </div>
    </main>
  );
}
