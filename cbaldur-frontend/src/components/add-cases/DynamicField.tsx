import React from 'react';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { Switch } from '@/shadcn/components/ui/switch';
import { Button } from '@/shadcn/components/ui/button';
import { useDynamicForm } from '@/hooks/useDynamicForm';
import { HelpCircle, Plus, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip';
import type { Field, ShortArray, LongArray } from '@/types/ConfigSchema';

interface DynamicFieldProps {
  field: Field;
  configName: string;
  panelId: string;
}

const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  configName,
  panelId,
}) => {
  const { getFieldValue, updateField } = useDynamicForm(configName, panelId);

  const getValue = () => {
    return getFieldValue(field.id) ?? field.default ?? getDefaultValue();
  };

  const getDefaultValue = () => {
    switch (field.type) {
      case 'bool':
        return false;
      case 'number':
        return 0;
      case 'short_array':
        return [];
      case 'long_array':
        return { index: [], values: [] };
      default:
        return '';
    }
  };

  const handleChange = (value: any) => {
    updateField(field.id, value);
  };

  const renderBoolField = () => {
    const checked = getValue() as boolean;
    return (
      <label
        htmlFor={`field-${panelId}-${field.id}`}
        className="flex items-center justify-between gap-2 rounded-sm border border-gray-200 bg-gray-50/50 px-3 py-2 cursor-pointer"
      >
        <span
          className={`text-sm font-medium ${checked ? 'text-[var(--office-blue)]' : 'text-gray-500'}`}
        >
          {checked ? 'True' : 'False'}
        </span>
        <Switch
          id={`field-${panelId}-${field.id}`}
          checked={checked}
          onCheckedChange={(value) => handleChange(value)}
        />
      </label>
    );
  };

  const renderNumberField = () => (
    <Input
      id={`field-${panelId}-${field.id}`}
      type="number"
      value={getValue() as number}
      onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
      min={field.min ?? undefined}
      max={field.max ?? undefined}
      step={field.step ?? 'any'}
      className="w-full"
    />
  );

  const renderShortArrayField = () => {
    const values = getValue() as ShortArray;

    const handleArrayInput = (inputValue: string) => {
      const parsedValues = inputValue
        .split(',')
        .map((v) => parseFloat(v.trim()) || 0)
        .filter((v) => !isNaN(v));
      handleChange(parsedValues);
    };

    return (
      <Input
        type="text"
        value={values.join(',')}
        onChange={(e) => handleArrayInput(e.target.value)}
        placeholder="输入数值，用逗号分隔，如: 1,2,3,4"
        className="w-full"
      />
    );
  };

  const renderLongArrayField = () => {
    const data = getValue() as LongArray;
    const pairCount = data.index.length;

    // Determine number of columns based on array length
    let columns = 1;
    if (pairCount > 30) {
      columns = 3;
    } else if (pairCount > 15) {
      columns = 2;
    }

    const addPair = () => {
      handleChange({
        index: [...data.index, 0],
        values: [...data.values, 0],
      });
    };

    const removePair = (idx: number) => {
      const newIndex = data.index.filter((_, i) => i !== idx);
      const newValues = data.values.filter((_, i) => i !== idx);
      handleChange({ index: newIndex, values: newValues });
    };

    const updateIndex = (idx: number, value: number) => {
      const newIndex = [...data.index];
      newIndex[idx] = value;
      handleChange({ ...data, index: newIndex });
    };

    const updateValue = (idx: number, value: number) => {
      const newValues = [...data.values];
      newValues[idx] = value;
      handleChange({ ...data, values: newValues });
    };

    // Split pairs into columns
    const pairsPerColumn = Math.ceil(pairCount / columns);
    const columnData = [];
    for (let col = 0; col < columns; col++) {
      const startIdx = col * pairsPerColumn;
      const endIdx = Math.min(startIdx + pairsPerColumn, pairCount);
      columnData.push({
        indices: data.index.slice(startIdx, endIdx),
        values: data.values.slice(startIdx, endIdx),
        startIdx,
      });
    }

    return (
      <div className="space-y-3">
        <div
          className={`grid gap-4 ${columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {columnData.map((column, colIdx) => (
            <div key={colIdx} className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 pr-12">
                <span>Index</span>
                <span>Value</span>
              </div>
              {column.indices.map((indexValue, rowIdx) => {
                const actualIdx = column.startIdx + rowIdx;
                return (
                  <div key={actualIdx} className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={indexValue}
                      onChange={(e) =>
                        updateIndex(actualIdx, parseFloat(e.target.value) || 0)
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={column.values[rowIdx] || 0}
                      onChange={(e) =>
                        updateValue(actualIdx, parseFloat(e.target.value) || 0)
                      }
                      className="flex-1"
                      step={field.step ?? 'any'}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePair(actualIdx)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPair}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Index-Value Pair
        </Button>

        {pairCount > 15 && (
          <div className="text-xs text-muted-foreground">
            数组长度: {pairCount} ({columns}列显示)
          </div>
        )}
      </div>
    );
  };

  const renderField = () => {
    switch (field.type) {
      case 'bool':
        return renderBoolField();
      case 'number':
        return renderNumberField();
      case 'short_array':
        return renderShortArrayField();
      case 'long_array':
        return renderLongArrayField();
      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };

  // Determine card width class for array fields
  const getCardWidthClass = () => {
    if (field.type === 'short_array') {
      return 'col-span-2'; // Always 2x width for short arrays
    }
    if (field.type === 'long_array') {
      const data = getValue() as LongArray;
      const pairCount = data.index.length;
      if (pairCount > 30) {
        return 'col-span-3'; // 3x width
      } else if (pairCount > 15) {
        return 'col-span-2'; // 2x width
      }
    }
    return ''; // Default single width
  };

  return (
    <TooltipProvider>
      <div
        className={`rounded-sm border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--office-blue)]/50 ${getCardWidthClass()}`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Label
                htmlFor={`field-${panelId}-${field.id}`}
                className="text-sm font-semibold text-gray-900 leading-none truncate"
              >
                {field.id}
              </Label>
              {field.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-[var(--office-blue)] cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{field.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center rounded-full bg-[var(--office-blue-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--office-blue)]">
              {field.namelist}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {field.type}
            </span>
          </div>

          <div className="w-full">{renderField()}</div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DynamicField;
