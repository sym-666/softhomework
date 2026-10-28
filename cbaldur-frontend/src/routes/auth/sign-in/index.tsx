import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Github } from 'lucide-react';
import { toast } from 'sonner';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import {
  useLoginMutation,
  useLazyGithubLoginQuery,
  useValidateAuthQuery,
} from '@/redux/api/user';

// 表单数据类型
interface FormData {
  usernameOrEmail: string;
  password: string;
}

// 错误信息类型
interface FormErrors {
  usernameOrEmail: string;
  password: string;
}

export const SignIn: React.FC = () => {
  const [, setLocation] = useLocation();
  const intl = useIntl();
  const { data: authData, isLoading: isAuthLoading } = useValidateAuthQuery();

  useEffect(() => {
    if (!isAuthLoading && authData?.valid) {
      setLocation('/');
    }
  }, [authData, isAuthLoading, setLocation]);

  // 表单状态
  const [form, setForm] = useState<FormData>({
    usernameOrEmail: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({
    usernameOrEmail: '',
    password: '',
  });

  const [rememberMe, setRememberMe] = useState(false);

  // Redux mutations
  const [login, { isLoading }] = useLoginMutation();
  const [triggerGithubLogin] = useLazyGithubLoginQuery();

  // 表单验证
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {
      usernameOrEmail: '',
      password: '',
    };

    if (!form.usernameOrEmail) {
      newErrors.usernameOrEmail = intl.formatMessage({ id: 'auth.signIn.usernameOrEmailError' });
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = intl.formatMessage({ id: 'auth.signIn.passwordError' });
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
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const result = await login({
        usernameOrEmail: form.usernameOrEmail,
        password: form.password,
      }).unwrap();

      if (result.success) {
        toast.success(intl.formatMessage({ id: 'auth.signIn.successToast' }));
        // 登录成功，跳转到首页
        setTimeout(() => {
          setLocation('/');
        }, 1500);
      } else {
        toast.error(intl.formatMessage({ id: 'auth.signIn.failureToast' }));
      }
    } catch (error: any) {
      if (error.status === 401) {
        toast.error(intl.formatMessage({ id: 'auth.signIn.invalidCredentials' }));
        setErrors((prev) => ({
          ...prev,
          password: intl.formatMessage({ id: 'auth.signIn.invalidCredentials' }),
        }));
      } else {
        toast.error(intl.formatMessage({ id: 'auth.signIn.networkError' }));
        console.error('登录失败:', error);
      }
    }
  };

  // 处理GitHub登录
  const handleGithubLogin = async () => {
    try {
      const result = await triggerGithubLogin(
        window.location.origin + '/auth/github/callback',
      ).unwrap();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error(intl.formatMessage({ id: 'auth.signIn.githubError' }));
      console.error('GitHub登录跳转失败:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md bg-card rounded-lg border border-border shadow-lg p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://s2.loli.net/2024/12/04/nCkNI1J5AmgQ9l6.png"
            alt="Logo"
            className="h-20 mb-2"
          />
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 用户名或邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="usernameOrEmail">
              <FormattedMessage id="auth.signIn.usernameOrEmailLabel" /> <span className="text-destructive">*</span>
            </Label>
            <Input
              id="usernameOrEmail"
              type="text"
              value={form.usernameOrEmail}
              onChange={handleInputChange('usernameOrEmail')}
              placeholder={intl.formatMessage({ id: 'auth.signIn.usernameOrEmailPlaceholder' })}
              className={errors.usernameOrEmail ? 'border-destructive' : ''}
            />
            {errors.usernameOrEmail && (
              <span className="text-destructive text-sm">
                {errors.usernameOrEmail}
              </span>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              <FormattedMessage id="auth.signIn.passwordLabel" /> <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={handleInputChange('password')}
              placeholder={intl.formatMessage({ id: 'auth.signIn.passwordPlaceholder' })}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <span className="text-destructive text-sm">
                {errors.password}
              </span>
            )}
          </div>

          {/* 记住我和忘记密码 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground"
              >
                <FormattedMessage id="auth.signIn.rememberMe" />
              </Label>
            </div>
            <button
              type="button"
              onClick={() => setLocation('/auth/forgot-password')}
              className="text-sm text-primary hover:underline"
            >
              <FormattedMessage id="auth.signIn.forgotPassword" />
            </button>
          </div>

          {/* 登录按钮 */}
          <div className="pt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? intl.formatMessage({ id: 'auth.signIn.submitting' }) : intl.formatMessage({ id: 'auth.signIn.submit' })}
            </Button>
          </div>

          {/* 注册链接 */}
          <div className="text-center mt-4">
            <span className="text-sm text-muted-foreground"><FormattedMessage id="auth.signIn.noAccount" /> </span>
            <button
              type="button"
              onClick={() => setLocation('/auth/sign-up')}
              className="text-sm text-primary hover:underline"
            >
              <FormattedMessage id="auth.signIn.signUpLink" />
            </button>
          </div>
        </form>

        {/* 社交登录分隔线 */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <div className="px-4 text-sm text-muted-foreground">
            <FormattedMessage id="auth.signIn.socialDivider" />
          </div>
          <div className="flex-grow border-t border-border"></div>
        </div>

        {/* GitHub登录按钮 */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleGithubLogin}
            className="flex items-center justify-center"
          >
            <Github className="w-4 h-4 mr-2" />
            <span><FormattedMessage id="auth.signIn.githubLogin" /></span>
          </Button>
        </div>
      </div>
    </div>
  );
};
