'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle, Copy, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { phoneField } from '@/schemas/phone';
import { PhoneInput } from '@/components/common/PhoneInput/PhoneInput';
import { qk } from '@/lib/query-client';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import type { Organization, OrgSettings } from '@/types/api';

const profileSchema = z.object({
  firstName: z.string().optional().or(z.literal('')),
  lastName: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  phone: phoneField(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const settingsSchema = z.object({
  currency: z.string().min(1, 'Currency is required.'),
  language: z.string().optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
});
type SettingsValues = z.infer<typeof settingsSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
});
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage(): React.JSX.Element {
  const { can, refreshUser, user, logout } = useAuth();
  const queryClient = useQueryClient();
  /** Local override only — falls back to server data until the user types. */
  const [orgName, setOrgName] = useState<string | undefined>(undefined);

  const orgQ = useQuery({
    queryKey: qk.org,
    queryFn: async () => (await apiClient.get('/organizations/me')).data as Organization,
  });
  const settingsQ = useQuery({
    queryKey: qk.orgSettings,
    queryFn: async () => (await apiClient.get('/organizations/me/settings')).data as OrgSettings,
  });
  const inviteQ = useQuery({
    queryKey: qk.orgInvite,
    queryFn: async () =>
      (await apiClient.get('/organizations/me/invite-code')).data as { inviteCode: string },
    enabled: can('organization:read'),
  });

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: useMemo(
      () => ({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '' }),
      [user?.firstName, user?.lastName, user?.email],
    ),
  });
  const locValues = useMemo<SettingsValues>(
    () => ({
      currency: String(settingsQ.data?.currency ?? 'EGP'),
      language: String(settingsQ.data?.language ?? ''),
      timezone: String(settingsQ.data?.timezone ?? ''),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settingsQ.dataUpdatedAt],
  );
  const loc = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), values: locValues });
  // One-way server→form sync, guarded by a stamp ref so user typing is
  // never clobbered (fixes values-overwrite race on slow loads).
  const appliedSettingsAt = useRef<number>(0);
  useEffect(() => {
    if (settingsQ.data && appliedSettingsAt.current !== settingsQ.dataUpdatedAt) {
      appliedSettingsAt.current = settingsQ.dataUpdatedAt;
      if (!loc.formState.isDirty) loc.reset(locValues);
    }
  }, [settingsQ.dataUpdatedAt, settingsQ.data, loc, locValues]);
  const pwd = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const saveProfile = useMutation({
    mutationFn: (v: ProfileValues) => apiClient.patch('/auth/me', v),
    onSuccess: () => {
      toast.success('Updated successfully.');
      void refreshUser();
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const saveOrg = useMutation({
    mutationFn: () => apiClient.patch('/organizations/me', { name: orgName ?? orgQ.data?.name ?? '' }),
    onSuccess: () => {
      toast.success('Updated successfully.');
      setOrgName(undefined);
      void queryClient.invalidateQueries({ queryKey: qk.org });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const saveSettings = useMutation({
    mutationFn: (v: SettingsValues) => apiClient.patch('/organizations/me/settings', v),
    onSuccess: () => {
      toast.success('Updated successfully.');
      void queryClient.invalidateQueries({ queryKey: qk.orgSettings });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const changePwd = useMutation({
    mutationFn: (v: PasswordValues) => apiClient.post('/auth/change-password', v),
    onSuccess: () => {
      toast.success('Updated successfully.');
      pwd.reset();
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const regenerateInvite = useMutation({
    mutationFn: async () =>
      (await apiClient.patch('/organizations/me/invite-code', {})).data as { inviteCode: string },
    onSuccess: (data) => {
      toast.success('New invite code generated. The old code no longer works.');
      setRegenerateOpen(false);
      queryClient.setQueryData(qk.orgInvite, data);
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMe = useMutation({
    mutationFn: () => apiClient.delete('/auth/me'),
    onSuccess: () => {
      toast.success('Account deactivated.');
      void logout();
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Profile, organization and localization."
        onReload={() => {
          void orgQ.refetch();
          void settingsQ.refetch();
        }}
        reloading={orgQ.isFetching || settingsQ.isFetching}
      />
      {orgQ.isLoading || settingsQ.isLoading ? (
        <div className="space-y-4" role="status" aria-label="Loading">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-5 pt-5">
              <div>
                <CardTitle>Update my profile</CardTitle>
                <CardDescription>Your name, email and phone are shown to teammates in your workspace.</CardDescription>
              </div>
              <form onSubmit={profile.handleSubmit((v) => saveProfile.mutate(v))} className="grid grid-cols-2 gap-4" noValidate>
                <FormField label="First name" htmlFor="s-first">
                  <Input id="s-first" autoComplete="given-name" {...profile.register('firstName')} />
                </FormField>
                <FormField label="Last name" htmlFor="s-last">
                  <Input id="s-last" autoComplete="family-name" {...profile.register('lastName')} />
                </FormField>
                <FormField label="Email" htmlFor="s-email" error={profile.formState.errors.email?.message} className="col-span-2">
                  <Input id="s-email" type="email" autoComplete="email" {...profile.register('email')} />
                </FormField>
                <FormField label="Phone" htmlFor="s-phone" error={profile.formState.errors.phone?.message} className="col-span-2">
                  <Controller
                    control={profile.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        id="s-phone"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={profile.formState.errors.phone?.message}
                      />
                    )}
                  />
                </FormField>
                <div className="col-span-2">
                  <Button type="submit" pending={saveProfile.isPending}>Save profile</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-5 pt-5">
              <div>
                <CardTitle>Change password</CardTitle>
                <CardDescription>Passwords never leave the submit handler.</CardDescription>
              </div>
              <form onSubmit={pwd.handleSubmit((v) => changePwd.mutate(v))} className="space-y-4" noValidate>
                <FormField label="Current password" htmlFor="s-cur" error={pwd.formState.errors.currentPassword?.message}>
                  <PasswordInput id="s-cur" autoComplete="current-password" {...pwd.register('currentPassword')} />
                </FormField>
                <FormField label="New password" htmlFor="s-new" error={pwd.formState.errors.newPassword?.message}>
                  <PasswordInput id="s-new" autoComplete="new-password" {...pwd.register('newPassword')} />
                </FormField>
                <Button type="submit" pending={changePwd.isPending}>Change password</Button>
              </form>
            </CardContent>
          </Card>
          {can('settings:read') || can('settings:update') ? (
            <>
              <Card>
                <CardContent className="space-y-4 p-5 pt-5">
                  <div>
                    <CardTitle>Organization</CardTitle>
                    <CardDescription>Rename your workspace.</CardDescription>
                  </div>
                  <FormField label="Organization name" htmlFor="s-org">
                    <Input id="s-org" value={orgName ?? String(orgQ.data?.name ?? '')} onChange={(e) => setOrgName(e.target.value)} />
                  </FormField>
                  <Button pending={saveOrg.isPending} onClick={() => saveOrg.mutate()}>Save organization</Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4 p-5 pt-5">
                  <div>
                    <CardTitle>Localization</CardTitle>
                    <CardDescription>Currency feeds every money display and report.</CardDescription>
                  </div>
                  <form onSubmit={loc.handleSubmit((v) => saveSettings.mutate(v))} className="space-y-4" noValidate>
                    <FormField label="Currency" htmlFor="s-cur2" error={loc.formState.errors.currency?.message}>
                      <Input id="s-cur2" placeholder="EGP" {...loc.register('currency')} />
                    </FormField>
                    <FormField label="Language" htmlFor="s-lang">
                      <FormSelect id="s-lang" {...loc.register('language')}>
                        <option value="">—</option>
                        <option value="en">English</option>
                        <option value="ar">Arabic (RTL — translations later)</option>
                      </FormSelect>
                    </FormField>
                    <FormField label="Timezone" htmlFor="s-tz">
                      <Input id="s-tz" placeholder="Africa/Cairo" {...loc.register('timezone')} />
                    </FormField>
                    <Button type="submit" pending={saveSettings.isPending}>Save localization</Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4 p-5 pt-5">
                  <div>
                    <CardTitle>Invite code</CardTitle>
                    <CardDescription>
                      Teammates register with this code to join your workspace. Regenerating
                      invalidates the old one immediately.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <code
                      className="min-w-0 flex-1 truncate rounded-lg border bg-muted px-3 py-2 font-mono text-sm"
                      aria-label="Organization invite code"
                    >
                      {inviteQ.isLoading ? 'Loading…' : (inviteQ.data?.inviteCode ?? 'Unavailable')}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Copy invite code"
                      disabled={!inviteQ.data?.inviteCode}
                      onClick={() => {
                        const code = inviteQ.data?.inviteCode;
                        if (!code) return;
                        void navigator.clipboard
                          .writeText(code)
                          .then(() => toast.success('Invite code copied.'))
                          .catch(() => toast.error('Could not copy — select the code manually.'));
                      }}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  {can('organization:update') ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRegenerateOpen(true)}
                      disabled={inviteQ.isLoading}
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" /> Regenerate code
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : null}
          <Card className="col-span-full">
            <CardContent className="space-y-4 p-5 pt-5">
              <div>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Permanently deactivate your account. You can log back in to reactivate.</CardDescription>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                className="w-full"
                disabled={deleteMe.isPending}
              >
                {deleteMe.isPending ? (
                  <>
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Deactivating…
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Delete my account
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate invite code?</DialogTitle>
          </DialogHeader>
          <p className="mb-6 text-sm text-muted-foreground">
            Anyone holding the current code will no longer be able to join with it. Existing
            members are not affected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => regenerateInvite.mutate()}
              pending={regenerateInvite.isPending}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete my account</DialogTitle>
          </DialogHeader>
          <p className="mb-6 text-sm text-muted-foreground">
            This will deactivate your account. Your data will be kept for audit purposes. You can log back in at any time to reactivate.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteMe.mutate()} pending={deleteMe.isPending}>
              Deactivate account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
