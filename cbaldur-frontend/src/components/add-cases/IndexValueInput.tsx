import React from 'react';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { Button } from '@/shadcn/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card';
import { useInput } from '@/hooks/useInput';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip';

export interface IndexValueInfoItem {
  label: string;
  baseBlock: string;
  tooltip?: string;
}

interface IndexValueInputProps {
  indexValueInfo: IndexValueInfoItem[];
  size?: 'normal' | 'large';
}

const IndexValueInput: React.FC<IndexValueInputProps> = ({
  indexValueInfo,
  size = 'normal',
}) => {
  const { inputData, addArrayItem, removeArrayItem, updateArrayField } =
    useInput();

  const addPair = (item: IndexValueInfoItem) => {
    const currentData = inputData[item.baseBlock]?.[item.label];
    if (currentData && currentData.index && currentData.values) {
      const newIndex = Math.max(...currentData.index, 0) + 1;
      addArrayItem(item.baseBlock, item.label, newIndex, 0);
    }
  };

  const removePair = (index: number, item: IndexValueInfoItem) => {
    removeArrayItem(item.baseBlock, item.label, index);
  };

  const updateIndex = (
    pairIndex: number,
    item: IndexValueInfoItem,
    value: string,
  ) => {
    const numValue = parseInt(value) || 0;
    const currentData = inputData[item.baseBlock]?.[item.label];
    if (currentData && currentData.index) {
      currentData.index[pairIndex] = numValue;
    }
  };

  const updateValue = (
    pairIndex: number,
    item: IndexValueInfoItem,
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    updateArrayField(item.baseBlock, item.label, pairIndex, numValue);
  };

  const getIndexValueData = (item: IndexValueInfoItem) => {
    return inputData[item.baseBlock]?.[item.label] || { index: [], values: [] };
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {indexValueInfo.map((item, itemIndex) => {
          const data = getIndexValueData(item);
          const isLarge = size === 'large';

          return (
            <Card key={`${item.baseBlock}-${item.label}-${itemIndex}`}>
              <CardHeader className="pb-3">
                <div
                  className={`flex items-center justify-between ${isLarge ? 'flex-col gap-2' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{item.label}</CardTitle>
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
                  <Button
                    onClick={() => addPair(item)}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    新建
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {data.index && data.index.length > 0 ? (
                  data.index.map((indexValue: number, pairIndex: number) => (
                    <div
                      key={pairIndex}
                      className={`grid gap-2 items-center ${
                        isLarge ? 'grid-cols-12' : 'grid-cols-8'
                      }`}
                    >
                      <div className={isLarge ? 'col-span-1' : 'col-span-3'}>
                        <Label
                          htmlFor={`index-${item.label}-${pairIndex}`}
                          className="sr-only"
                        >
                          Index
                        </Label>
                        <Input
                          id={`index-${item.label}-${pairIndex}`}
                          type="number"
                          value={indexValue || ''}
                          onChange={(e) =>
                            updateIndex(pairIndex, item, e.target.value)
                          }
                          placeholder="索引"
                        />
                      </div>

                      <div className={isLarge ? 'col-span-1' : 'col-span-3'}>
                        <Label
                          htmlFor={`value-${item.label}-${pairIndex}`}
                          className="sr-only"
                        >
                          Value
                        </Label>
                        <Input
                          id={`value-${item.label}-${pairIndex}`}
                          type="number"
                          step="any"
                          value={data.values[pairIndex] || ''}
                          onChange={(e) =>
                            updateValue(pairIndex, item, e.target.value)
                          }
                          placeholder="值"
                        />
                      </div>

                      <div className={isLarge ? 'col-span-1' : 'col-span-2'}>
                        <Button
                          onClick={() => removePair(pairIndex, item)}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {isLarge && <div className="col-span-9"></div>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    暂无数据，点击&quot;新建&quot;添加索引-值对
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default IndexValueInput;
