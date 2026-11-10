import { api } from '@/lib/api';
import { PageHeader } from '@/components/AppShell';
import { NewPlan, PlanCard, type AdminPlan } from '@/components/admin/PlanEditor';

export default async function AdminPlans() {
  const plans = await api<AdminPlan[]>('/v1/admin/plans');
  return (
    <div>
      <PageHeader
        title="Plans"
        description="Edit prices and limits. Changes apply to the pricing page and to every subscriber on the plan right away."
        action={<NewPlan />}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
      </div>
      <p className="mt-6 text-[13px] text-zinc-500">
        Plans can’t be deleted because subscriptions point to them. Turn a plan off with <b>Active</b> to hide it from the pricing page.
        New accounts always start on the plan with code <code className="rounded bg-zinc-100 px-1">free</code>.
      </p>
    </div>
  );
}
