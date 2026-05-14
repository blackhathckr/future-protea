import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CountryPhoneInput } from '@/components/country-phone-input';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { useProfileQuery, useUpdateProfileMutation } from '../../hooks';
import { getInitials, formatLastLogin } from '../../data';
import { profileFormSchema, type ProfileFormValues } from '../../data/types';

export const ProfileTab = memo(function ProfileTab() {
  const { data: profile, isLoading, isError } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countryCode, setCountryCode] = useState('+91');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      bio: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        pincode: profile.pincode ?? '',
      });
      setCountryCode(profile.countryCode ?? '+91');
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate({
      ...values,
      countryCode: values.phone ? countryCode : undefined,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await api.post('/media/upload/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const avatarUrl = res.data?.data?.url || res.data?.data?.key;
        if (avatarUrl) {
          await api.patch('/users/profile', { avatar: avatarUrl });
          toast.success('Profile photo updated');
          queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
        }
      } catch {
        toast.error('Failed to upload photo');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [queryClient],
  );

  const handleDeleteAvatar = useCallback(async () => {
    setDeleting(true);
    try {
      await api.delete('/media/upload/avatar');
      await api.patch('/users/profile', { avatar: null });
      toast.success('Profile photo removed');
      queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setDeleting(false);
      setShowDeleteAvatarDialog(false);
    }
  }, [queryClient]);

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (isError) {
    return <EmptyState title="Error" message="Failed to load profile." />;
  }

  if (!profile) return null;

  const initials = getInitials(profile.firstName, profile.lastName);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Avatar Section */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar ?? undefined} alt={profile.firstName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </Button>
            {profile.avatar && (
              <button
                type="button"
                onClick={() => setShowDeleteAvatarDialog(true)}
                disabled={deleting}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove photo"
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <p className="font-medium">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{profile.role}</p>
            <p className="text-xs text-muted-foreground">
              Last login: {formatLastLogin((profile as any).lastLoginAt ?? (profile as any).lastLogin)}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <CountryPhoneInput
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input placeholder="6-digit pincode" maxLength={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>

      <AlertDialog open={showDeleteAvatarDialog} onOpenChange={setShowDeleteAvatarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Remove your profile photo? It will revert to your initials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAvatar}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});
