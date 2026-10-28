import zhCN from './zh-CN';
import en from './en';
import type { Locale } from '@/redux/slices/localeSlice';

export const messages: Record<Locale, Record<string, string>> = {
  'zh-CN': zhCN,
  en,
};

export default messages;
