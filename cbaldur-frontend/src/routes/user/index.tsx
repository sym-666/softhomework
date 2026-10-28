import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shadcn/components/ui/card';
import { Button } from '@/shadcn/components/ui/button';
import { Badge } from '@/shadcn/components/ui/badge';
import {
  useGetCurrentUserQuery,
  useUploadAvatarMutation,
} from '@/redux/api/user';
import { AvatarCropper } from '@/components/user/avatar-cropper';
import { toast } from 'sonner';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  User,
  Mail,
  Building2,
  Shield,
  Loader2,
  KeyRound,
  Fingerprint,
  ArrowRight,
} from 'lucide-react';

// 角色映射
const roleMap: Record<number, string> = {
  1: 'user.role.normalUser',
  2: 'user.role.admin',
  3: 'user.role.superAdmin',
};

export default function UserProfile() {
  const intl = useIntl();
  const { data: user, isLoading, error, refetch } = useGetCurrentUserQuery();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] =
    useUploadAvatarMutation();

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await uploadAvatar(formData).unwrap();
      toast.success(intl.formatMessage({ id: 'user.avatar.uploadSuccess' }));
      refetch();
    } catch (err) {
      toast.error(intl.formatMessage({ id: 'user.avatar.uploadError' }));
      console.error('Upload error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-lg text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <FormattedMessage id="user.profile.loading" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="text-lg text-red-500">
          <FormattedMessage id="user.profile.loadError" />
        </div>
      </div>
    );
  }

  const roleLabel = roleMap[user.roleId]
    ? intl.formatMessage({ id: roleMap[user.roleId] })
    : intl.formatMessage({ id: 'user.info.roleUnknown' });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* 个人资料头部 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--office-blue)] to-[var(--office-blue-dark)] shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/20 blur-2xl" />
        </div>

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative shrink-0">
              <div className="rounded-full p-1.5 bg-white/20 backdrop-blur-sm">
                <AvatarCropper
                  currentAvatar={user.avatar}
                  onUpload={handleAvatarUpload}
                  isUploading={isUploadingAvatar}
                  avatarSize={120}
                />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {user.username}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-white/90">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  {roleLabel}
                </Badge>
                {user.email && (
                  <span className="flex items-center gap-1.5 text-sm">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本信息卡片 */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--office-blue-light)]/60 flex items-center justify-center">
                <User className="w-4 h-4 text-[var(--office-blue)]" />
              </div>
              <div>
                <CardTitle className="text-base">
                  <FormattedMessage id="user.info.title" />
                </CardTitle>
                <CardDescription>
                  <FormattedMessage id="user.info.description" />
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-[var(--office-blue-light)]/60 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[var(--office-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {intl.formatMessage({ id: 'user.info.username' })}
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.username}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-[var(--office-blue-light)]/60 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[var(--office-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {intl.formatMessage({ id: 'user.info.email' })}
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.email ||
                      intl.formatMessage({ id: 'user.info.emailNotSet' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-[var(--office-blue-light)]/60 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-[var(--office-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {intl.formatMessage({ id: 'user.info.role' })}
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {roleLabel}
                  </p>
                </div>
              </div>

              {user.organizationId ? (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="mt-0.5 w-8 h-8 rounded-md bg-[var(--office-blue-light)]/60 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[var(--office-blue)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      {intl.formatMessage({ id: 'user.info.organization' })}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.organizationId}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* 头像卡片 */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--office-blue-light)]/60 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-[var(--office-blue)]" />
              </div>
              <div>
                <CardTitle className="text-base">
                  <FormattedMessage id="user.avatar.title" />
                </CardTitle>
                <CardDescription>
                  <FormattedMessage id="user.avatar.description" />
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <AvatarCropper
              currentAvatar={user.avatar}
              onUpload={handleAvatarUpload}
              isUploading={isUploadingAvatar}
              avatarSize={140}
            />
          </CardContent>
        </Card>
      </div>

      {/* 账号安全卡片 */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--office-blue-light)]/60 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-[var(--office-blue)]" />
            </div>
            <div>
              <CardTitle className="text-base">
                <FormattedMessage id="user.security.title" />
              </CardTitle>
              <CardDescription>
                <FormattedMessage id="user.security.description" />
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--office-blue-light)]/60 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-[var(--office-blue)]" />
              </div>
              <div>
                <p className="font-medium">
                  <FormattedMessage id="user.security.changePassword" />
                </p>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage id="user.security.changePasswordDesc" />
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              asChild
              className="shrink-0 group border-[var(--office-blue)]/30 text-[var(--office-blue)] hover:bg-[var(--office-blue-light)]/50 hover:text-[var(--office-blue-dark)]"
            >
              <a
                href="/auth/forgot-password"
                className="flex items-center gap-1"
              >
                <FormattedMessage id="user.security.changePassword" />
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--office-blue-light)]/60 flex items-center justify-center shrink-0">
                <Fingerprint className="w-5 h-5 text-[var(--office-blue)]" />
              </div>
              <div>
                <p className="font-medium">
                  <FormattedMessage id="user.security.userId" />
                </p>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage id="user.security.userIdDesc" />
                </p>
              </div>
            </div>
            <code className="px-4 py-2 bg-[var(--office-blue-light)]/30 rounded-lg text-sm font-mono text-[var(--office-blue-dark)] border border-[var(--office-blue)]/10 shrink-0">
              {user.id}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
