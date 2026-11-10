'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { CreateWebsiteInput, createWebsiteSchema } from '@wpconnect/shared';
import { createWebsiteAction } from '@/lib/actions';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddWebsiteForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateWebsiteInput>({ resolver: zodResolver(createWebsiteSchema) });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Add a website</CardTitle><CardDescription>Use the full URL, e.g. https://example.com</CardDescription></CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-start"
          onSubmit={handleSubmit((v) =>
            start(async () => {
              const r = await createWebsiteAction(v);
              if (!r.ok) return setError(r.error);
              setError(undefined);
              reset();
              router.push(`/websites/${r.data!.id}`);
            }),
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="wname">Name</Label>
            <Input id="wname" placeholder="My blog" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="wurl">Site URL</Label>
            <Input id="wurl" placeholder="https://example.com" {...register('url')} />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>
          <Button className="sm:mt-[22px]" disabled={pending}><Plus className="h-4 w-4" />{pending ? 'Adding…' : 'Add'}</Button>
          {error && <Alert variant="destructive" className="sm:col-span-3">{error}</Alert>}
        </form>
      </CardContent>
    </Card>
  );
}
