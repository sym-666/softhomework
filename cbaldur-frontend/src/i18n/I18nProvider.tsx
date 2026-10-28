import React from 'react';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import messages from './messages';

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const locale = useSelector((state: RootState) => state.locale.locale);

  return (
    <IntlProvider
      locale={locale}
      defaultLocale="zh-CN"
      messages={messages[locale]}
      onError={() => {}}
    >
      {children}
    </IntlProvider>
  );
};

export default I18nProvider;
