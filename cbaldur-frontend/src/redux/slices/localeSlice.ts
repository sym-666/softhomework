import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Locale = 'zh-CN' | 'en';

const STORAGE_KEY = 'cbaldur.locale';

const getInitialLocale = (): Locale => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh-CN' || stored === 'en') {
      return stored;
    }
  }
  return 'zh-CN';
};

interface LocaleState {
  locale: Locale;
}

const initialState: LocaleState = {
  locale: getInitialLocale(),
};

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, action.payload);
      }
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
