import React from 'react';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { Card, CardContent } from '@/shadcn/components/ui/card';
import { useInput } from '@/hooks/useInput';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip';

export interface ArrayInfoItem {
  label: string;
  baseBlock: string;
  tooltip?: string;
}

interface ArrayInputProps {
  arrayInfo: ArrayInfoItem[];
}

const ArrayInput: React.FC<ArrayInputProps> = ({ arrayInfo }) => {
  const { inputData, updateField } = useInput();

  const handleArrayChange = (item: ArrayInfoItem, value: string) => {
    try {
      const numbers = value
        .split(',')
        .map((str) => {
          const trimmed = str.trim();
          if (trimmed === '') return 0;
          return Number(trimmed);
        })
        .filter((num) => !isNaN(num));

      updateField(item.baseBlock, item.label, numbers);
    } catch (error) {
      console.error('Error parsing array:', error);
    }
  };

  const formatArrayValue = (array: number[]) => {
    if (!Array.isArray(array)) return '';

    return array
      .map((num) => {
        if (num >= 1e5) {
          return num.toExponential();
        }
        return num.toString();
      })
      .join(', ');
  };

  const getArrayValue = (item: ArrayInfoItem) => {
    const value = inputData[item.baseBlock]?.[item.label];
    return Array.isArray(value) ? value : [];
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {arrayInfo.map((item, index) => {
          const arrayValue = getArrayValue(item);
          const isLongArray = arrayValue.length > 6;

          return (
            <Card key={`${item.baseBlock}-${item.label}-${index}`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="col-span-1 flex items-center gap-2">
                    <Label
                      htmlFor={`array-${item.label}`}
                      className="font-medium"
                    >
                      {item.label}
                    </Label>
                    {item.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  <div className="col-span-3">
                    {isLongArray ? (
                      <textarea
                        id={`array-${item.label}`}
                        value={formatArrayValue(arrayValue)}
                        onChange={(e) =>
                          handleArrayChange(item, e.target.value)
                        }
                        placeholder="输入数组值，用逗号分隔..."
                        className="w-full p-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-sm min-h-[100px] resize-y"
                      />
                    ) : (
                      <Input
                        id={`array-${item.label}`}
                        value={formatArrayValue(arrayValue)}
                        onChange={(e) =>
                          handleArrayChange(item, e.target.value)
                        }
                        placeholder="输入数组值，用逗号分隔..."
                        className="font-mono"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      当前数组长度: {arrayValue.length}
                      {arrayValue.length > 0 && (
                        <span className="ml-2">
                          示例:{' '}
                          {arrayValue
                            .slice(0, 3)
                            .map((v) => v.toString())
                            .join(', ')}
                          {arrayValue.length > 3 && '...'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ArrayInput;
