import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ComingSoon({ sprint, title }: { sprint: number; title: string }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Sprint {sprint}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This view is part of the next milestone. The route already exists so navigation works.
        </CardContent>
      </Card>
    </div>
  );
}
