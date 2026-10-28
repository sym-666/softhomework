import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLazyGithubCallbackQuery } from '@/redux/api/user';
import { toast } from 'sonner';

export const GithubCallback: React.FC = () => {
  const [, setLocation] = useLocation();
  const intl = useIntl();
  const [triggerGithubCallback] = useLazyGithubCallbackQuery();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      if (!code) {
        toast.error(intl.formatMessage({ id: 'auth.githubCallback.noAuthCode' }));
        setLocation('/auth/sign-in');
        return;
      }

      try {
        const redirectUri = window.location.origin + '/auth/github/callback';
        const result = await triggerGithubCallback({
          code,
          redirectUri,
        }).unwrap();

        if (result.success) {
          toast.success(intl.formatMessage({ id: 'auth.githubCallback.successToast' }));
          setLocation('/');
        } else {
          toast.error(result.message || intl.formatMessage({ id: 'auth.githubCallback.failureToast' }));
          setLocation('/auth/sign-in');
        }
      } catch (error: any) {
        console.error('GitHub Callback Error:', error);
        toast.error(error.data?.message || intl.formatMessage({ id: 'auth.githubCallback.networkError' }));
        setLocation('/auth/sign-in');
      }
    };

    handleCallback();
  }, [triggerGithubCallback, setLocation, intl]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-lg"><FormattedMessage id="auth.githubCallback.processing" /></div>
    </div>
  );
};
