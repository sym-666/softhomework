import React from 'react';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import { Card, CardContent } from '@/shadcn/components/ui/card';
import { useInput } from '@/hooks/useInput';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip';

export interface DataInfoItem {
  label: string;
  type: 'bool' | 'number' | 'text';
  tooltip?: string;
  baseBlock: string;
  step?: number;
}

interface BaseInputProps {
  dataInfo: DataInfoItem[];
}

const BaseInput: React.FC<BaseInputProps> = ({ dataInfo }) => {
  const { inputData, updateField } = useInput();

  const handleInputChange = (item: DataInfoItem, value: any) => {
    let processedValue = value;

    if (item.type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (item.type === 'bool') {
      processedValue = value;
    }

    updateField(item.baseBlock, item.label, processedValue);
  };

  const getValue = (item: DataInfoItem) => {
    return inputData[item.baseBlock]?.[item.label] ?? '';
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dataInfo.map((item, index) => (
          <Card
            key={`${item.baseBlock}-${item.label}-${index}`}
            className="p-4"
          >
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor={`input-${item.baseBlock}-${item.label}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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

              <div className="w-full">
                {item.type === 'bool' ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`input-${item.baseBlock}-${item.label}`}
                      checked={getValue(item) as boolean}
                      onCheckedChange={(checked) =>
                        handleInputChange(item, checked)
                      }
                    />
                    <Label
                      htmlFor={`input-${item.baseBlock}-${item.label}`}
                      className="text-sm"
                    >
                      {getValue(item) ? '启用' : '禁用'}
                    </Label>
                  </div>
                ) : (
                  <Input
                    id={`input-${item.baseBlock}-${item.label}`}
                    type={item.type === 'number' ? 'number' : 'text'}
                    value={getValue(item)}
                    onChange={(e) => handleInputChange(item, e.target.value)}
                    step={item.step}
                    className="w-full"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default BaseInput;
