import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  initializePanel as initializePanelAction,
  updateField as updateFieldAction,
  resetConfig as resetConfigAction,
} from '@/redux/slices/dynamicFormSlice';
import type { Field, ShortArray, LongArray } from '@/types/ConfigSchema';

export const useDynamicForm = (configName: string, panelId: string) => {
  const dispatch = useAppDispatch();
  const panelData = useAppSelector(
    (state) => state.dynamicForm[configName]?.[panelId],
  );

  const initializePanel = (fields: Field[]) => {
    dispatch(initializePanelAction({ configName, panelId, fields }));
  };

  const updateField = (
    fieldId: string,
    value: boolean | number | ShortArray | LongArray,
  ) => {
    dispatch(updateFieldAction({ configName, panelId, fieldId, value }));
  };

  const resetConfig = () => {
    dispatch(resetConfigAction({ configName }));
  };

  const getFieldValue = (fieldId: string) => {
    return panelData?.[fieldId];
  };

  return {
    panelData,
    initializePanel,
    updateField,
    resetConfig,
    getFieldValue,
  };
};
