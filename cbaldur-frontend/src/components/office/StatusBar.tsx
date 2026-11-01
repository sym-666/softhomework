import React from 'react';
import { Wifi, Shield, Globe } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { setLocale, type Locale } from '@/redux/slices/localeSlice';

interface StatusBarProps {
  userInfo?: string;
  caseInfo?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  userInfo,
  caseInfo,
}) => {
  const language = useAppSelector((state) => state.locale.locale);
  const dispatch = useAppDispatch();
  const intl = useIntl();

  return (
    <div className="h-6 bg-[var(--office-blue)] flex items-center px-3 text-white text-[11px] shrink-0 justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          <span>{intl.formatMessage({ id: 'status.connected' })}</span>
        </div>
        {caseInfo && <span className="opacity-80">{caseInfo}</span>}
      </div>
      <div className="flex items-center gap-4">
        {userInfo && (
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>{userInfo}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <select
            value={language}
            onChange={(e) => dispatch(setLocale(e.target.value as Locale))}
            className="bg-transparent text-white text-[11px] border-none outline-none cursor-pointer [&>option]:text-black"
            title={intl.formatMessage({ id: 'status.language' })}
          >
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
          </select>
        </div>
      </div>
    </div>
  );
};
