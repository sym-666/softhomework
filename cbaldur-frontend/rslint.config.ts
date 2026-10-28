import {
  defineConfig,
  js,
  reactHooksPlugin,
  reactPlugin,
  ts,
} from '@rslint/core';

export default defineConfig([
  { ignores: ['dist/'] },
  js.configs.recommended,
  ts.configs.recommended,
  reactPlugin.configs.recommended,
  reactHooksPlugin.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
