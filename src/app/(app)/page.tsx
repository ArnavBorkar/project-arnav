import { Logo } from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function HomePlaceholder() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <div className="flex items-center gap-3">
        <Logo size={36} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Project AB</h1>
          <p className="text-xs text-muted-foreground">Designed to make Arnav 10x.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome.</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Skeleton booted. Today view ships in Sprint 1.
        </CardContent>
      </Card>
    </div>
  );
}
