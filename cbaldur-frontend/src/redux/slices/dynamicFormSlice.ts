import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ShortArray, LongArray } from '@/types/ConfigSchema';

export interface DynamicFormData {
  [configName: string]: {
    [panelId: string]: {
      [fieldId: string]: boolean | number | ShortArray | LongArray;
    };
  };
}

const initialState: DynamicFormData = {};

interface UpdateFieldPayload {
  configName: string;
  panelId: string;
  fieldId: string;
  value: boolean | number | ShortArray | LongArray;
}

interface InitializePanelPayload {
  configName: string;
  panelId: string;
  fields: Array<{
    id: string;
    type: string;
    default?: any;
  }>;
}

const dynamicFormSlice = createSlice({
  name: 'dynamicForm',
  initialState,
  reducers: {
    initializePanel: (state, action: PayloadAction<InitializePanelPayload>) => {
      const { configName, panelId, fields } = action.payload;

      if (!state[configName]) {
        state[configName] = {};
      }

      if (!state[configName][panelId]) {
        state[configName][panelId] = {};
      }

      // Initialize fields with default values
      fields.forEach((field) => {
        if (state[configName][panelId][field.id] === undefined) {
          let defaultValue;
          switch (field.type) {
            case 'bool':
              defaultValue = field.default ?? false;
              break;
            case 'number':
              defaultValue = field.default ?? 0;
              break;
            case 'short_array':
              defaultValue = field.default ?? [];
              break;
            case 'long_array':
              defaultValue = field.default ?? { index: [], values: [] };
              break;
            default:
              defaultValue = field.default ?? '';
          }
          state[configName][panelId][field.id] = defaultValue;
        }
      });
    },
    updateField: (state, action: PayloadAction<UpdateFieldPayload>) => {
      const { configName, panelId, fieldId, value } = action.payload;

      if (!state[configName]) {
        state[configName] = {};
      }

      if (!state[configName][panelId]) {
        state[configName][panelId] = {};
      }

      state[configName][panelId][fieldId] = value;
    },
    resetConfig: (state, action: PayloadAction<{ configName: string }>) => {
      const { configName } = action.payload;
      delete state[configName];
    },
    setConfigData: (
      state,
      action: PayloadAction<{
        configName: string;
        data: {
          [panelId: string]: {
            [fieldId: string]: boolean | number | ShortArray | LongArray;
          };
        };
      }>,
    ) => {
      const { configName, data } = action.payload;
      state[configName] = data;
    },
    resetAll: () => {
      return {};
    },
  },
});

export const {
  initializePanel,
  updateField,
  resetConfig,
  setConfigData,
  resetAll,
} = dynamicFormSlice.actions;

export default dynamicFormSlice.reducer;
