import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { FormattedMessage } from 'react-intl';
import { useValidateAuthQuery } from '@/redux/api/user';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const { data, isLoading, error } = useValidateAuthQuery();

  useEffect(() => {
    // 如果当前在认证页面，不需要验证
    if (location.startsWith('/auth/')) {
      return;
    }

    // 如果验证失败或用户未登录，重定向到登录页
    if (!isLoading && (error || !data?.valid)) {
      setLocation('/auth/sign-in');
    }
  }, [location, data, isLoading, error, setLocation]);

  // 如果在认证页面，直接渲染子组件
  if (location.startsWith('/auth/')) {
    return <>{children}</>;
  }

  // 如果正在加载或验证失败，显示加载状态
  if (isLoading || error || !data?.valid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground"><FormattedMessage id="auth.authGuard.verifying" /></p>
        </div>
      </div>
    );
  }

  // 验证通过，渲染受保护的内容
  return <>{children}</>;
};
