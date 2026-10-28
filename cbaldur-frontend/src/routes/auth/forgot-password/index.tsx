import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import {
  useSendResetPasswordCodeMutation,
  useResetPasswordMutation,
} from '@/redux/api/user';

// 表单步骤枚举
enum Step {
  EMAIL = 1,
  RESET = 2,
}

// 表单数据类型
interface FormData {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

// 错误信息类型
interface FormErrors {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

export const ForgotPassword: React.FC = () => {
  const [, setLocation] = useLocation();
  const intl = useIntl();
  const [currentStep, setCurrentStep] = useState<Step>(Step.EMAIL);
  const [countdown, setCountdown] = useState(0);

  // 表单状态
  const [form, setForm] = useState<FormData>({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Redux mutations
  const [sendCode, { isLoading: isSendingCode }] =
    useSendResetPasswordCodeMutation();
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 邮箱验证
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 密码验证
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // 验证第一步（邮箱）
  const validateStepOne = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!form.email) {
      newErrors.email = intl.formatMessage({ id: 'auth.forgotPassword.emailErrorRequired' });
      isValid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = intl.formatMessage({ id: 'auth.forgotPassword.emailErrorInvalid' });
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 验证第二步（验证码和密码）
  const validateStepTwo = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!form.verificationCode) {
      newErrors.verificationCode = intl.formatMessage({ id: 'auth.forgotPassword.verificationCodeError' });
      isValid = false;
    }

    if (!form.newPassword) {
      newErrors.newPassword = intl.formatMessage({ id: 'auth.forgotPassword.newPasswordErrorRequired' });
      isValid = false;
    } else if (!validatePassword(form.newPassword)) {
      newErrors.newPassword = intl.formatMessage({ id: 'auth.forgotPassword.newPasswordErrorLength' });
      isValid = false;
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = intl.formatMessage({ id: 'auth.forgotPassword.confirmPasswordErrorRequired' });
      isValid = false;
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = intl.formatMessage({ id: 'auth.forgotPassword.confirmPasswordErrorMismatch' });
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

  // 发送验证码
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStepOne()) return;

    try {
      const result = await sendCode({ email: form.email }).unwrap();

      if (result.success) {
        toast.success(result.message || '验证码已发送');
        setCountdown(60);
        setCurrentStep(Step.RESET);
      } else {
        toast.error(result.message || '发送失败');
      }
    } catch (error: unknown) {
      const err = error as { status?: number; data?: { message?: string } };
      if (err.status === 400) {
        toast.error(err.data?.message || '该邮箱未注册');
      } else {
        toast.error('发送失败，请稍后再试');
        console.error('发送验证码失败:', error);
      }
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    if (countdown > 0) return;

    try {
      const result = await sendCode({ email: form.email }).unwrap();

      if (result.success) {
        toast.success(result.message || '验证码已重新发送');
        setCountdown(60);
      } else {
        toast.error(result.message || '发送失败');
      }
    } catch (error: unknown) {
      toast.error('发送失败，请稍后再试');
      console.error('重新发送验证码失败:', error);
    }
  };

  // 重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStepTwo()) return;

    try {
      const result = await resetPassword({
        email: form.email,
        verificationCode: form.verificationCode,
        newPassword: form.newPassword,
      }).unwrap();

      if (result.success) {
        toast.success(result.message || '密码重置成功');
        setTimeout(() => {
          setLocation('/auth/sign-in');
        }, 1500);
      } else {
        toast.error(result.message || '重置失败');
      }
    } catch (error: unknown) {
      const err = error as { status?: number; data?: { message?: string } };
      if (err.status === 400) {
        toast.error(err.data?.message || '验证码无效或已过期');
        setErrors((prev) => ({
          ...prev,
          verificationCode: err.data?.message || '验证码无效或已过期',
        }));
      } else {
        toast.error('重置失败，请稍后再试');
        console.error('重置密码失败:', error);
      }
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (currentStep === Step.RESET) {
      setCurrentStep(Step.EMAIL);
    } else {
      setLocation('/auth/sign-in');
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
          <h2 className="text-2xl font-semibold text-foreground"><FormattedMessage id="auth.forgotPassword.title" /></h2>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === Step.EMAIL
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              1
            </div>
            <div className="w-16 h-1 bg-muted"></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === Step.RESET
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* 第一步：输入邮箱 */}
        {currentStep === Step.EMAIL && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                邮箱地址 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleInputChange('email')}
                placeholder="请输入您的邮箱地址"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <span className="text-destructive text-sm">{errors.email}</span>
              )}
              <p className="text-sm text-muted-foreground">
                我们将向您的邮箱发送验证码
              </p>
            </div>

            {/* 发送验证码按钮 */}
            <div className="pt-4">
              <Button type="submit" disabled={isSendingCode} className="w-full">
                {isSendingCode ? '发送中...' : '发送验证码'}
              </Button>
            </div>

            {/* 返回登录 */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回登录
              </button>
            </div>
          </form>
        )}

        {/* 第二步：重置密码 */}
        {currentStep === Step.RESET && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* 邮箱显示 */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                验证码已发送至：
                <span className="font-medium">{form.email}</span>
              </p>
            </div>

            {/* 验证码 */}
            <div className="space-y-2">
              <Label htmlFor="verificationCode">
                验证码 <span className="text-destructive">*</span>
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="verificationCode"
                  type="text"
                  value={form.verificationCode}
                  onChange={handleInputChange('verificationCode')}
                  placeholder="请输入验证码"
                  className={
                    errors.verificationCode ? 'border-destructive' : ''
                  }
                  maxLength={5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={countdown > 0}
                  className="whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '重新发送'}
                </Button>
              </div>
              {errors.verificationCode && (
                <span className="text-destructive text-sm">
                  {errors.verificationCode}
                </span>
              )}
            </div>

            {/* 新密码 */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                新密码 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleInputChange('newPassword')}
                placeholder="请输入新密码（至少6位）"
                className={errors.newPassword ? 'border-destructive' : ''}
              />
              {errors.newPassword && (
                <span className="text-destructive text-sm">
                  {errors.newPassword}
                </span>
              )}
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                确认密码 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                placeholder="请再次输入新密码"
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <span className="text-destructive text-sm">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* 重置密码按钮 */}
            <div className="pt-4">
              <Button type="submit" disabled={isResetting} className="w-full">
                {isResetting ? '重置中...' : '重置密码'}
              </Button>
            </div>

            {/* 返回上一步 */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回上一步
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
