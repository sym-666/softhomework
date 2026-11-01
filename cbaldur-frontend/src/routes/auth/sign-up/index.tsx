import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { useRegisterMutation } from '@/redux/api/user';

// 表单数据类型
interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 错误信息类型
interface FormErrors {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignUp: React.FC = () => {
  const [, setLocation] = useLocation();
  const intl = useIntl();

  // 表单状态
  const [form, setForm] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Redux mutations
  const [register, { isLoading }] = useRegisterMutation();

  // 邮箱格式验证
  const isValidEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // 表单验证
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      };

    if (!form.username) {
      newErrors.username = intl.formatMessage({ id: 'auth.signUp.usernameErrorRequired' });
      isValid = false;
    } else if (form.username.length < 3) {
      newErrors.username = intl.formatMessage({ id: 'auth.signUp.usernameErrorLength' });
      isValid = false;
    }

    if (!form.email) {
      newErrors.email = intl.formatMessage({ id: 'auth.signUp.emailErrorRequired' });
      isValid = false;
    } else if (!isValidEmail(form.email)) {
      newErrors.email = intl.formatMessage({ id: 'auth.signUp.emailErrorInvalid' });
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = intl.formatMessage({ id: 'auth.signUp.passwordErrorRequired' });
      isValid = false;
    } else if (form.password.length < 8) {
      newErrors.password = intl.formatMessage({ id: 'auth.signUp.passwordErrorLength' });
      isValid = false;
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = intl.formatMessage({ id: 'auth.signUp.confirmPasswordErrorRequired' });
      isValid = false;
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = intl.formatMessage({ id: 'auth.signUp.confirmPasswordErrorMismatch' });
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 处理输入变化
  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // 清除对应字段的错误信息
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const result = await register({
        username: form.username,
        email: form.email,
        password: form.password,
      }).unwrap();

      if (result.success) {
        toast.success(intl.formatMessage({ id: 'auth.signUp.successToast' }));
        // 注册成功，跳转到登录页面
        setTimeout(() => {
          setLocation('/auth/sign-in');
        }, 1500);
      } else {
        toast.error(intl.formatMessage({ id: 'auth.signUp.failureToast' }));
      }
    } catch (error: any) {
      // 用户名或邮箱重复等业务错误由后端给出具体原因
      toast.error(
        error?.data?.message ??
          intl.formatMessage({ id: 'auth.signUp.networkError' }),
      );
      console.error('注册失败:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8">
      <div className="w-full max-w-md bg-card rounded-lg border border-border shadow-lg p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <BookOpen className="h-10 w-10 text-[var(--office-blue)]" />
          <p className="mt-2 text-lg font-semibold text-foreground">
            PaperPilot
          </p>
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">
              <FormattedMessage id="auth.signUp.usernameLabel" /> <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              value={form.username}
              onChange={handleInputChange('username')}
              placeholder={intl.formatMessage({ id: 'auth.signUp.usernamePlaceholder' })}
              className={errors.username ? 'border-destructive' : ''}
            />
            {errors.username && (
              <span className="text-destructive text-sm">
                {errors.username}
              </span>
            )}
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">
              <FormattedMessage id="auth.signUp.emailLabel" /> <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={handleInputChange('email')}
              placeholder={intl.formatMessage({ id: 'auth.signUp.emailPlaceholder' })}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <span className="text-destructive text-sm">{errors.email}</span>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              <FormattedMessage id="auth.signUp.passwordLabel" /> <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={handleInputChange('password')}
              placeholder={intl.formatMessage({ id: 'auth.signUp.passwordPlaceholder' })}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <span className="text-destructive text-sm">
                {errors.password}
              </span>
            )}
          </div>

          {/* 确认密码 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              <FormattedMessage id="auth.signUp.confirmPasswordLabel" /> <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              placeholder={intl.formatMessage({ id: 'auth.signUp.confirmPasswordPlaceholder' })}
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <span className="text-destructive text-sm">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* 注册按钮 */}
          <div className="pt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? intl.formatMessage({ id: 'auth.signUp.submitting' }) : intl.formatMessage({ id: 'auth.signUp.submit' })}
            </Button>
          </div>

          {/* 登录链接 */}
          <div className="text-center mt-4">
            <span className="text-sm text-muted-foreground"><FormattedMessage id="auth.signUp.hasAccount" /> </span>
            <button
              type="button"
              onClick={() => setLocation('/auth/sign-in')}
              className="text-sm text-primary hover:underline"
            >
              <FormattedMessage id="auth.signUp.signInLink" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
