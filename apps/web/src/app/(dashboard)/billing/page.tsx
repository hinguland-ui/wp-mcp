import { Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Plan { id: string; code: string; name: string; priceCents: number; maxWebsites: number; monthlyRequests: number }

export default async function Billing() {
  const [plans, sub] = await Promise.all([
    api<Plan[]>('/v1/billing/plans'),
    api<{ plan: Plan; status: string; currentPeriodEnd: string } | null>('/v1/billing/subscription'),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        {sub && <p className="text-sm text-muted-foreground">Current plan: <b className="text-foreground">{sub.plan.name}</b> · renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => {
          const current = sub?.plan.code === p.code;
          return (
            <Card key={p.id} className={cn(current && 'border-primary')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">{p.name}{current && <Badge>Current</Badge>}</CardTitle>
                <CardDescription className="text-3xl font-semibold text-foreground">
                  {p.priceCents === 0 ? 'Free' : `$${(p.priceCents / 100).toFixed(0)}`}
                  {p.priceCents > 0 && <span className="text-sm font-normal text-muted-foreground"> /mo</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-foreground" />{p.maxWebsites} website{p.maxWebsites > 1 ? 's' : ''}</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-foreground" />{p.monthlyRequests.toLocaleString()} requests / month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
