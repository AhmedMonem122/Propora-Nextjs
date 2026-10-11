'use client';

import { useMutation, useQueryClient, type UseMutateAsyncFunction, type UseMutateFunction } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { apiClient, getApiMessage } from '@/lib/api-client';

function useInvalidate(): (keys: unknown[]) => Promise<void> {
  const qc = useQueryClient();
  return async (keys: unknown[]) => {
    await Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k as string[] })));
  };
}

interface MutationHandle<TVars> {
  mutate: UseMutateFunction<unknown, unknown, TVars, unknown>;
  mutateAsync: UseMutateAsyncFunction<unknown, unknown, TVars, unknown>;
  isPending: boolean;
}

export function useCreateEntity<TBody>(path: string, invalidateKeys: unknown[]): MutationHandle<TBody> {
  const t = useTranslations('toasts');
  const invalidate = useInvalidate();
  const m = useMutation({
    mutationFn: (body: TBody) => apiClient.post(path, body).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('created'));
      void invalidate(invalidateKeys);
    },
    onError: (e) => toast.error(getApiMessage(e, t('failed'))),
  });
  return { mutate: m.mutate, mutateAsync: m.mutateAsync, isPending: m.isPending };
}

export function useUpdateEntity<TBody>(
  pathFor: (id: string) => string,
  invalidateKeys: unknown[],
): MutationHandle<{ id: string; body: TBody }> {
  const t = useTranslations('toasts');
  const invalidate = useInvalidate();
  const m = useMutation({
    mutationFn: ({ id, body }: { id: string; body: TBody }) => apiClient.patch(pathFor(id), body).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('updated'));
      void invalidate(invalidateKeys);
    },
    onError: (e) => toast.error(getApiMessage(e, t('failed'))),
  });
  return { mutate: m.mutate, mutateAsync: m.mutateAsync, isPending: m.isPending };
}

export function useDeleteEntity(
  pathFor: (id: string) => string,
  invalidateKeys: unknown[],
): MutationHandle<string> {
  const t = useTranslations('toasts');
  const invalidate = useInvalidate();
  const m = useMutation({
    mutationFn: (id: string) => apiClient.delete(pathFor(id)).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('deleted'));
      void invalidate(invalidateKeys);
    },
    onError: (e) => toast.error(getApiMessage(e, t('failed'))),
  });
  return { mutate: m.mutate, mutateAsync: m.mutateAsync, isPending: m.isPending };
}
