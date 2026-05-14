/**
 * @fileoverview Add user form tab
 * @module Admin/UserManagement/components/tabs/add-user-tab
 */

import { memo, useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryPhoneInput } from '@/components/country-phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { useCreateUserMutation } from '../../hooks';
import { createUserSchema, type CreateUserFormValues } from '../../data/types';

interface AddUserTabProps {
  onSuccess?: () => void;
}

export const AddUserTab = memo(function AddUserTab({ onSuccess }: AddUserTabProps) {
  const createUserMutation = useCreateUserMutation();

  // Custom roles fetched from API for the role dropdown
  const [customRoles, setCustomRoles] = useState<{ id: string; name: string; description: string | null }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'LEARNER',
      status: 'ACTIVE',
      address: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
    },
  });

  const [countryCode, setCountryCode] = useState('+91');

  // Pincode auto-fill: fetch city, district, state when pincode is 6 digits
  const [isPincodeFetching, setIsPincodeFetching] = useState(false);
  const lastFetchedPincode = useRef('');
  const pincodeValue = watch('pincode');

  useEffect(() => {
    const pincode = pincodeValue?.trim() ?? '';

    // Only fetch when exactly 6 digits and not already fetched for this value
    if (!/^\d{6}$/.test(pincode) || pincode === lastFetchedPincode.current) {
      return;
    }

    let cancelled = false;
    setIsPincodeFetching(true);

    api
      .get<{ success: boolean; data: { city: string; district: string; state: string } }>(
        `/auth/pincode/${pincode}`
      )
      .then((res) => {
        if (cancelled) return;
        const { city, district, state } = res.data.data;
        setValue('city', city, { shouldValidate: true });
        setValue('district', district, { shouldValidate: true });
        setValue('state', state, { shouldValidate: true });
        lastFetchedPincode.current = pincode;
      })
      .catch(() => {
        // Silently ignore - user can fill manually
      })
      .finally(() => {
        if (!cancelled) setIsPincodeFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pincodeValue, setValue]);

  // Fetch all roles for dropdown
  useEffect(() => {
    api.get('/users/roles', { params: { limit: 100 } }).then((res) => {
      const roles = (res.data?.data ?? []).filter(
        (r: any) => r.name !== 'SUPER_ADMIN' && r.name !== 'EDUCATOR' && r.name !== 'LEARNER' && r.name !== 'ADMIN'
      );
      setCustomRoles(roles);
    }).catch(() => {});
  }, []);

  const onSubmit = async (data: CreateUserFormValues) => {
    await createUserMutation.mutateAsync({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      countryCode: data.phone ? countryCode : undefined,
      role: data.role,
      address: data.address || undefined,
      city: data.city || undefined,
      district: data.district || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
    });

    reset();
    setCountryCode('+91');
    lastFetchedPincode.current = '';
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...register('firstName', {
                onChange: (e) => { e.target.value = e.target.value.replace(/[^a-zA-Z\s.\-]/g, ''); },
              })}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              {...register('lastName', {
                onChange: (e) => { e.target.value = e.target.value.replace(/[^a-zA-Z\s.\-]/g, ''); },
              })}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="john@example.com" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <CountryPhoneInput
              id="phone"
              value={watch('phone') ?? ''}
              onChange={(val) => setValue('phone', val)}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              error={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              defaultValue="LEARNER"
              onValueChange={(value) => setValue('role', value)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
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
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue="ACTIVE"
              onValueChange={(value) => setValue('status', value as CreateUserFormValues['status'])}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Address (Optional)</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register('address')} placeholder="123 Main Street" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register('city')} placeholder="Mumbai" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input id="district" {...register('district')} placeholder="Mumbai Suburban" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register('state')} placeholder="Maharashtra" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <div className="relative">
              <Input id="pincode" {...register('pincode')} placeholder="400001" maxLength={6} />
              {isPincodeFetching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || createUserMutation.isPending}>
          {createUserMutation.isPending ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
});
