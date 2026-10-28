import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  updateField,
  updateArrayField,
  addArrayItem,
  removeArrayItem,
  resetInput,
  setInputData,
  type InputData,
} from '@/redux/slices/inputSlice';

export const useInput = () => {
  const dispatch = useAppDispatch();
  const inputData = useAppSelector((state) => state.input);

  const updateFieldValue = (block: string, field: string, value: any) => {
    dispatch(updateField({ block, field, value }));
  };

  const updateArrayFieldValue = (
    block: string,
    field: string,
    index: number,
    value: number,
  ) => {
    dispatch(updateArrayField({ block, field, index, value }));
  };

  const addArrayItemValue = (
    block: string,
    field: string,
    indexValue: number,
    dataValue: number,
  ) => {
    dispatch(addArrayItem({ block, field, indexValue, dataValue }));
  };

  const removeArrayItemValue = (
    block: string,
    field: string,
    index: number,
  ) => {
    dispatch(removeArrayItem({ block, field, index }));
  };

  const resetData = () => {
    dispatch(resetInput());
  };

  const setData = (data: InputData) => {
    dispatch(setInputData(data));
  };

  return {
    inputData,
    updateField: updateFieldValue,
    updateArrayField: updateArrayFieldValue,
    addArrayItem: addArrayItemValue,
    removeArrayItem: removeArrayItemValue,
    resetData,
    setData,
  };
};

export type { InputData };
