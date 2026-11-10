'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { UpdatePermissionsInput, updatePermissionsSchema } from '@wpconnect/shared';
import { savePermissionsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  websiteId: string;
  scopes: { name: string; description?: string }[];
  presets: { id: string; name: string; scopes: string[] }[];
  current: string[];
}

export function PermissionsForm({ websiteId, scopes, presets, current }: Props) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [pending, start] = useTransition();
  const { register, handleSubmit, setValue } = useForm<UpdatePermissionsInput>({
    resolver: zodResolver(updatePermissionsSchema),
    defaultValues: { scopes: current as UpdatePermissionsInput['scopes'] },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        start(async () => {
          const r = await savePermissionsAction(websiteId, v);
          setMsg(r.ok ? { ok: true, text: 'Saved' } : { ok: false, text: r.error });
        }),
      )}
    >
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => setValue('scopes', p.scopes as UpdatePermissionsInput['scopes'])}>
            {p.name}
          </Button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {scopes.map((s) => (
          <label key={s.name} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50">
            <Checkbox className="mt-0.5" value={s.name} {...register('scopes')} />
            <span>
              <span className="font-medium">{s.name}</span>
              {s.description && <span className="block text-xs text-muted-foreground">{s.description}</span>}
              {s.name.endsWith(':write') && <span className="block text-xs text-amber-600">Allows changes to your site</span>}
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button disabled={pending}>{pending ? 'Saving…' : 'Save permissions'}</Button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-destructive'}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
