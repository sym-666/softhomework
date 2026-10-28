import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { load as yamlLoad } from 'js-yaml';
import type { ConfigSchema } from '../../types/ConfigSchema';

const initialState: ConfigSchema[] = [];
const inputsSlice = createSlice({
  name: 'inputs',
  initialState,
  reducers: {
    setSchemasFromYaml(_state, action: PayloadAction<string[]>) {
      return action.payload.map(
        (yamlString) => yamlLoad(yamlString) as ConfigSchema,
      );
    },
  },
});

export const { setSchemasFromYaml } = inputsSlice.actions;
export default inputsSlice.reducer;
