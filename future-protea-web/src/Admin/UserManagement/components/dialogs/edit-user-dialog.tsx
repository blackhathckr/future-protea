/**
 * @fileoverview Edit user dialog with pre-filled form
 * @module Admin/UserManagement/components/dialogs/edit-user-dialog
 */

import { memo, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CountryPhoneInput } from '@/components/country-phone-input';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUpdateUserMutation } from '../../hooks';
import { createUserSchema, type CreateUserFormValues, type User } from '../../data/types';

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

export const EditUserDialog = memo(function EditUserDialog({
  user,
  open,
  onOpenChange,
  readOnly = false,
}: EditUserDialogProps) {
  const updateUserMutation = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
  });

  const watchedStatus = watch('status');
  const watchedPincode = watch('pincode');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const lastFetchedPincode = useRef<string>('');
  const [countryCode, setCountryCode] = useState(user.countryCode ?? '+91');

  // Custom roles for the role dropdown
  const [customRoles, setCustomRoles] = useState<{ id: string; name: string; description: string | null }[]>([]);

  // Fetch custom roles for dropdown
  useEffect(() => {
    if (!open) return;
    api.get('/users/roles', { params: { limit: 100 } }).then((res) => {
      const roles = (res.data?.data ?? []).filter((r: any) => !r.isSystem);
      setCustomRoles(roles);
    }).catch(() => {});
  }, [open]);

  // Strip country code prefix from a phone number to get local digits only
  function parsePhone(phone: string | null | undefined, cc: string): { localPhone: string; detectedCode: string } {
    if (!phone) return { localPhone: '', detectedCode: cc };
    // If phone starts with country code prefix, strip it
    if (phone.startsWith(cc)) {
      return { localPhone: phone.slice(cc.length), detectedCode: cc };
    }
    // Try common prefixes (+91, +1, etc.)
    const match = phone.match(/^(\+\d{1,4})(.*)/);
    if (match) {
      return { localPhone: match[2], detectedCode: match[1] };
    }
    return { localPhone: phone, detectedCode: cc };
  }

  // Fetch full user data when dialog opens to ensure address fields are present
  useEffect(() => {
    if (!open || !user) return;

    api.get(`/users/${user.id}`).then((res) => {
      const full = res.data?.data ?? res.data;
      if (full) {
        const cc = full.countryCode ?? user.countryCode ?? '+91';
        const { localPhone, detectedCode } = parsePhone(full.phone ?? user.phone, cc);
        reset({
          firstName: full.firstName ?? user.firstName ?? '',
          lastName: full.lastName ?? user.lastName ?? '',
          email: full.email ?? user.email ?? '',
          phone: localPhone,
          role: full.role ?? user.role ?? '',
          status: full.status ?? user.status ?? 'ACTIVE',
          address: full.address || '',
          city: full.city || '',
          district: full.district || '',
          state: full.state || '',
          pincode: full.pincode || '',
        });
        lastFetchedPincode.current = full.pincode ?? '';
        setCountryCode(detectedCode);
      } else {
        // If response is empty, use fallback
        const cc = user.countryCode ?? '+91';
        const { localPhone, detectedCode } = parsePhone(user.phone, cc);
        reset({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
          phone: localPhone,
          role: user.role ?? '',
          status: user.status ?? 'ACTIVE',
          address: user.address || '',
          city: user.city || '',
          district: user.district || '',
          state: user.state || '',
          pincode: user.pincode || '',
        });
        lastFetchedPincode.current = user.pincode ?? '';
        setCountryCode(detectedCode);
      }
    }).catch(() => {
      // Fallback to prop data if fetch fails - ensure all fields are initialized
      const cc = user.countryCode ?? '+91';
      const { localPhone, detectedCode } = parsePhone(user.phone, cc);
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phone: localPhone,
        role: user.role ?? '',
        status: user.status ?? 'ACTIVE',
        address: user.address || '',
        city: user.city || '',
        district: user.district || '',
        state: user.state || '',
        pincode: user.pincode || '',
      });
      lastFetchedPincode.current = user.pincode ?? '';
      setCountryCode(detectedCode);
    });
  }, [open, user, reset]);

  // Pincode auto-fill
  useEffect(() => {
    if (!watchedPincode || watchedPincode.length !== 6 || watchedPincode === lastFetchedPincode.current) return;
    lastFetchedPincode.current = watchedPincode;
    setPincodeLoading(true);
    api.get(`/auth/pincode/${watchedPincode}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data) {
          if (data.state) setValue('state', data.state);
          if (data.district) setValue('district', data.district);
          if (data.city) setValue('city', data.city);
        }
      })
      .catch(() => {})
      .finally(() => setPincodeLoading(false));
  }, [watchedPincode, setValue]);

  const onSubmit = async (data: CreateUserFormValues) => {
    // Combine country code + local phone for backend (phoneSchema expects +919876543210)
    const fullPhone = data.phone ? `${countryCode}${data.phone.replace(/^0+/, '')}` : undefined;
    await updateUserMutation.mutateAsync({
      id: user.id,
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: fullPhone,
        countryCode: data.phone ? countryCode : undefined,
        role: data.role,
        status: data.status,
        deactivationReason: data.status === 'DEACTIVATED' ? (data.deactivationReason || undefined) : undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
      },
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? 'View User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {readOnly ? 'User profile details.' : 'Update the user details below. Changes will take effect immediately.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                {...register('firstName', {
                  onChange: (e) => { e.target.value = e.target.value.replace(/[^a-zA-Z\s.\-]/g, ''); },
                })}
                disabled={readOnly}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                {...register('lastName', {
                  onChange: (e) => { e.target.value = e.target.value.replace(/[^a-zA-Z\s.\-]/g, ''); },
                })}
                disabled={readOnly}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...register('email')} disabled={readOnly} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              {readOnly ? (
                <Input id="edit-phone" value={`${countryCode} ${watch('phone') ?? ''}`} disabled />
              ) : (
                <CountryPhoneInput
                  id="edit-phone"
                  value={watch('phone') ?? ''}
                  onChange={(val) => setValue('phone', val)}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  error={!!errors.phone}
                />
              )}
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              {readOnly ? (
                <Input id="edit-role" value={watch('role') ?? ''} disabled />
              ) : (
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value)}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDUCATOR">Educator</SelectItem>
                    <SelectItem value="LEARNER">Learner</SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              {readOnly ? (
                <Input id="edit-status" value={watch('status') ?? ''} disabled />
              ) : (
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as CreateUserFormValues['status'])}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                    <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Deactivation Reason — shown when status is DEACTIVATED */}
          {watchedStatus === 'DEACTIVATED' && user.status !== 'DEACTIVATED' && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10 p-3">
              <Label htmlFor="edit-deactivationReason">Deactivation Reason</Label>
              <Textarea
                id="edit-deactivationReason"
                placeholder="Provide a reason for deactivating this user..."
                {...register('deactivationReason')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be recorded and can be reviewed later.
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input id="edit-address" {...register('address')} disabled={readOnly} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input id="edit-city" {...register('city')} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">State</Label>
              <Input id="edit-state" {...register('state')} disabled={readOnly} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-district">District</Label>
              <Input id="edit-district" {...register('district')} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pincode">Pincode</Label>
              <div className="relative">
                <Input id="edit-pincode" {...register('pincode')} disabled={readOnly} />
                {pincodeLoading && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
