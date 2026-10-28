import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsInstance } from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import { useDynamicForm } from '@/hooks/useDynamicForm';
import type { Field, Panel, ShortArray } from '@/types/ConfigSchema';
import { AlertTriangle, LineChart, Undo2 } from 'lucide-react';

interface ParamChartEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel: Panel;
  configName: string;
}

interface LengthWarning {
  yFieldId: string;
  xLen: number;
  yLen: number;
}

interface DragState {
  seriesIndex: number;
  dataIndex: number;
  yFieldId: string;
  previewX: number;
  previewY: number;
}

interface HistoryEntry {
  fields: Record<string, number[]>;
}

const SERIES_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4f46e5',
];

/** Align with DynamicField short_array parse behavior. */
const parseShortArrayInput = (inputValue: string): number[] =>
  inputValue
    .split(',')
    .map((v) => parseFloat(v.trim()) || 0)
    .filter((v) => !Number.isNaN(v));

const asNumberArray = (value: unknown, fallback: ShortArray = []): number[] => {
  if (Array.isArray(value) && value.every((v) => typeof v === 'number')) {
    return value as number[];
  }
  if (Array.isArray(fallback) && fallback.every((v) => typeof v === 'number')) {
    return fallback;
  }
  return [];
};

const isIntegerArray = (values: number[]): boolean =>
  values.length > 0 && values.every((v) => Number.isInteger(v));

const snapDragValue = (value: number, asInteger: boolean): number =>
  asInteger ? Math.round(value) : value;

const ParamChartEditorDialog: React.FC<ParamChartEditorDialogProps> = ({
  open,
  onOpenChange,
  panel,
  configName,
}) => {
  const { getFieldValue, updateField, panelData } = useDynamicForm(
    configName,
    panel.id,
  );

  const [xFieldId, setXFieldId] = useState<string>('');
  const [yFieldIds, setYFieldIds] = useState<string[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const chartRef = useRef<EChartsInstance | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const validSeriesRef = useRef<
    { yFieldId: string; data: [number, number][] }[]
  >([]);
  const getArrayValueRef = useRef<(fieldId: string) => number[]>(() => []);
  const updateFieldRef = useRef(updateField);
  const xFieldIdRef = useRef(xFieldId);
  const zrHandlersRef = useRef<{
    mousemove?: (e: { offsetX: number; offsetY: number }) => void;
    mouseup?: () => void;
    globalout?: () => void;
  }>({});

  const shortArrayFields = useMemo(
    () => panel.fields.filter((f) => f.type === 'short_array'),
    [panel.fields],
  );

  const fieldById = useMemo(() => {
    const map = new Map<string, Field>();
    shortArrayFields.forEach((f) => map.set(f.id, f));
    return map;
  }, [shortArrayFields]);

  // Reset axis selection when switching blocks so ids cannot leak across panels.
  useEffect(() => {
    setXFieldId('');
    setYFieldIds([]);
    setDragState(null);
    dragRef.current = null;
    historyRef.current = [];
    setHistory([]);
  }, [panel.id]);

  useEffect(() => {
    if (!open) {
      setDragState(null);
      dragRef.current = null;
      historyRef.current = [];
      setHistory([]);
      return;
    }
    setXFieldId((prev) =>
      prev && shortArrayFields.some((f) => f.id === prev) ? prev : '',
    );
    setYFieldIds((prev) =>
      prev.filter((id) => shortArrayFields.some((f) => f.id === id)),
    );
  }, [open, shortArrayFields]);

  useEffect(() => {
    if (xFieldId && yFieldIds.includes(xFieldId)) {
      setYFieldIds((prev) => prev.filter((id) => id !== xFieldId));
    }
  }, [xFieldId, yFieldIds]);

  const getArrayValue = useCallback(
    (fieldId: string): number[] => {
      const field = fieldById.get(fieldId);
      const fallback = asNumberArray(field?.default, []);
      return asNumberArray(
        panelData?.[fieldId] ?? getFieldValue(fieldId),
        fallback,
      );
    },
    [fieldById, getFieldValue, panelData],
  );

  useEffect(() => {
    getArrayValueRef.current = getArrayValue;
  }, [getArrayValue]);

  useEffect(() => {
    updateFieldRef.current = updateField;
  }, [updateField]);

  useEffect(() => {
    xFieldIdRef.current = xFieldId;
  }, [xFieldId]);

  const xValues = useMemo(
    () => (xFieldId ? getArrayValue(xFieldId) : []),
    [xFieldId, getArrayValue],
  );

  const { validSeries, warnings } = useMemo(() => {
    const series: { yFieldId: string; data: [number, number][] }[] = [];
    const warns: LengthWarning[] = [];

    if (!xFieldId) {
      return { validSeries: series, warnings: warns };
    }

    yFieldIds.forEach((yId) => {
      const yValues = getArrayValue(yId);
      if (xValues.length === yValues.length) {
        if (xValues.length > 0) {
          series.push({
            yFieldId: yId,
            data: xValues.map((x, i) => [x, yValues[i]] as [number, number]),
          });
        }
        // Equal empty lengths: no series, no warning.
        return;
      }
      warns.push({
        yFieldId: yId,
        xLen: xValues.length,
        yLen: yValues.length,
      });
    });

    return { validSeries: series, warnings: warns };
  }, [xFieldId, yFieldIds, xValues, getArrayValue]);

  useEffect(() => {
    validSeriesRef.current = validSeries;
  }, [validSeries]);

  const chartSeriesData = useMemo(() => {
    if (!dragState) {
      return validSeries;
    }

    return validSeries.map((s, seriesIndex) => {
      const data = s.data.map((point) => [...point] as [number, number]);
      if (seriesIndex === dragState.seriesIndex) {
        if (data[dragState.dataIndex]) {
          data[dragState.dataIndex] = [dragState.previewX, dragState.previewY];
        }
      } else if (data[dragState.dataIndex]) {
        // Shared X axis: horizontal drag updates X for all series previews.
        data[dragState.dataIndex] = [
          dragState.previewX,
          data[dragState.dataIndex][1],
        ];
      }
      return { ...s, data };
    });
  }, [validSeries, dragState]);

  const chartOption = useMemo<EChartsOption>(() => {
    const hasData = chartSeriesData.length > 0;

    return {
      animation: false,
      grid: {
        left: 48,
        right: 24,
        top: 40,
        bottom: 48,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as {
            seriesName?: string;
            value?: [number, number];
            dataIndex?: number;
          };
          if (!p.value) return '';
          return `${p.seriesName ?? ''}<br/>#${(p.dataIndex ?? 0) + 1}: (${p.value[0]}, ${p.value[1]})`;
        },
      },
      legend: {
        top: 0,
        type: 'scroll',
        data: chartSeriesData.map((s) => s.yFieldId),
      },
      xAxis: {
        type: 'value',
        name: xFieldId || 'X',
        nameLocation: 'middle',
        nameGap: 28,
        scale: true,
      },
      yAxis: {
        type: 'value',
        name: 'Y',
        scale: true,
      },
      series: hasData
        ? chartSeriesData.map((s, idx) => ({
            name: s.yFieldId,
            type: 'line' as const,
            data: s.data,
            symbol: 'circle',
            symbolSize: 12,
            showSymbol: true,
            lineStyle: { width: 2 },
            itemStyle: {
              color: SERIES_COLORS[idx % SERIES_COLORS.length],
            },
            emphasis: {
              scale: 1.3,
              itemStyle: {
                borderWidth: 2,
                borderColor: '#111827',
              },
            },
          }))
        : [],
    };
  }, [chartSeriesData, xFieldId]);

  const pushHistory = useCallback((fieldIds: string[]) => {
    const uniqueIds = Array.from(new Set(fieldIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    const fields: Record<string, number[]> = {};
    uniqueIds.forEach((id) => {
      fields[id] = [...getArrayValueRef.current(id)];
    });

    const next = [...historyRef.current, { fields }];
    historyRef.current = next;
    setHistory(next);
  }, []);

  const undoLastChange = useCallback(() => {
    const stack = historyRef.current;
    if (stack.length === 0) return;

    const last = stack[stack.length - 1];
    Object.entries(last.fields).forEach(([fieldId, values]) => {
      updateFieldRef.current(fieldId, values);
    });

    const next = stack.slice(0, -1);
    historyRef.current = next;
    setHistory(next);
  }, []);

  const commitDrag = useCallback(() => {
    const current = dragRef.current;
    const currentXFieldId = xFieldIdRef.current;
    if (!current || !currentXFieldId) {
      setDragState(null);
      dragRef.current = null;
      return;
    }

    const { dataIndex, yFieldId, previewX, previewY } = current;
    const nextX = [...getArrayValueRef.current(currentXFieldId)];
    const nextY = [...getArrayValueRef.current(yFieldId)];

    if (
      dataIndex >= 0 &&
      dataIndex < nextX.length &&
      dataIndex < nextY.length
    ) {
      const snappedX = snapDragValue(previewX, isIntegerArray(nextX));
      const snappedY = snapDragValue(previewY, isIntegerArray(nextY));
      const prevX = nextX[dataIndex];
      const prevY = nextY[dataIndex];
      if (prevX !== snappedX || prevY !== snappedY) {
        pushHistory([currentXFieldId, yFieldId]);
        nextX[dataIndex] = snappedX;
        nextY[dataIndex] = snappedY;
        updateFieldRef.current(currentXFieldId, nextX);
        updateFieldRef.current(yFieldId, nextY);
      }
    }

    setDragState(null);
    dragRef.current = null;
  }, [pushHistory]);

  const attachZrHandlers = useCallback(
    (chart: EChartsInstance) => {
      const zr = chart.getZr();
      const prev = zrHandlersRef.current;
      if (prev.mousemove) zr.off('mousemove', prev.mousemove);
      if (prev.mouseup) zr.off('mouseup', prev.mouseup);
      if (prev.globalout) zr.off('globalout', prev.globalout);

      const onMousemove = (e: { offsetX: number; offsetY: number }) => {
        const drag = dragRef.current;
        if (!drag) return;

        const point = chart.convertFromPixel({ seriesIndex: drag.seriesIndex }, [
          e.offsetX,
          e.offsetY,
        ]);
        if (!point || point.length < 2) return;
        if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return;

        const currentXFieldId = xFieldIdRef.current;
        const xArr = currentXFieldId
          ? getArrayValueRef.current(currentXFieldId)
          : [];
        const yArr = getArrayValueRef.current(drag.yFieldId);
        const previewX = snapDragValue(point[0], isIntegerArray(xArr));
        const previewY = snapDragValue(point[1], isIntegerArray(yArr));

        const next: DragState = {
          ...drag,
          previewX,
          previewY,
        };
        dragRef.current = next;
        setDragState(next);
      };

      const onMouseup = () => {
        if (dragRef.current) {
          commitDrag();
        }
      };

      const onGlobalout = () => {
        if (dragRef.current) {
          commitDrag();
        }
      };

      zr.on('mousemove', onMousemove);
      zr.on('mouseup', onMouseup);
      zr.on('globalout', onGlobalout);
      zrHandlersRef.current = {
        mousemove: onMousemove,
        mouseup: onMouseup,
        globalout: onGlobalout,
      };
    },
    [commitDrag],
  );

  const handleChartReady = useCallback(
    (chart: EChartsInstance) => {
      chartRef.current = chart;
      attachZrHandlers(chart);

      chart.off('mousedown');
      chart.on('mousedown', (params) => {
        if (params.componentType !== 'series') return;
        if (params.seriesIndex == null || params.dataIndex == null) {
          return;
        }

        // Always read latest series metadata to avoid stale onChartReady closures.
        const seriesMeta = validSeriesRef.current[params.seriesIndex];
        if (!seriesMeta) return;

        const raw = params.value;
        let x = 0;
        let y = 0;
        if (Array.isArray(raw) && raw.length >= 2) {
          x = Number(raw[0]);
          y = Number(raw[1]);
        } else {
          const point = seriesMeta.data[params.dataIndex];
          if (!point) return;
          x = point[0];
          y = point[1];
        }
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        const next: DragState = {
          seriesIndex: params.seriesIndex,
          dataIndex: params.dataIndex,
          yFieldId: seriesMeta.yFieldId,
          previewX: x,
          previewY: y,
        };
        dragRef.current = next;
        setDragState(next);
      });
    },
    [attachZrHandlers],
  );

  useEffect(() => {
    return () => {
      const chart = chartRef.current;
      if (!chart) return;
      const zr = chart.getZr?.();
      const prev = zrHandlersRef.current;
      if (zr) {
        if (prev.mousemove) zr.off('mousemove', prev.mousemove);
        if (prev.mouseup) zr.off('mouseup', prev.mouseup);
        if (prev.globalout) zr.off('globalout', prev.globalout);
      }
      chart.off?.('mousedown');
    };
  }, []);

  const handleXChange = (value: string) => {
    setXFieldId(value === '__none__' ? '' : value);
  };

  const toggleYField = (fieldId: string, checked: boolean) => {
    if (fieldId === xFieldId) return;
    setYFieldIds((prev) => {
      if (checked) {
        return prev.includes(fieldId) ? prev : [...prev, fieldId];
      }
      return prev.filter((id) => id !== fieldId);
    });
  };

  const handleArrayInputChange = (fieldId: string, inputValue: string) => {
    const next = parseShortArrayInput(inputValue);
    const prev = getArrayValue(fieldId);
    if (
      prev.length === next.length &&
      prev.every((v, i) => v === next[i])
    ) {
      return;
    }
    pushHistory([fieldId]);
    updateField(fieldId, next);
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) {
        return;
      }
      if (historyRef.current.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      undoLastChange();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, undoLastChange]);

  const selectedFields = useMemo(() => {
    const ids = [xFieldId, ...yFieldIds].filter(Boolean);
    const unique = Array.from(new Set(ids));
    return unique
      .map((id) => fieldById.get(id))
      .filter((f): f is Field => Boolean(f));
  }, [xFieldId, yFieldIds, fieldById]);

  const yCandidates = shortArrayFields.filter((f) => f.id !== xFieldId);
  const selectionReady = Boolean(xFieldId) && yFieldIds.length > 0;
  const hasShortArrays = shortArrayFields.length > 0;
  const allSelectedEmpty =
    selectionReady &&
    warnings.length === 0 &&
    validSeries.length === 0 &&
    xValues.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-[var(--office-blue)]" />
            参数关系图
          </DialogTitle>
          <DialogDescription>
            选择 1 个 X 轴与多个 Y 轴 short_array 参数，通过折线图与输入框双向编辑。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-5 gap-0 overflow-hidden">
          <div className="md:col-span-2 border-r border-gray-100 overflow-y-auto p-4 space-y-5">
            {!hasShortArrays ? (
              <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                当前 Block 没有 short_array 类型参数，无法绘制关系图。
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    X 轴（单选）
                  </Label>
                  <Select
                    value={xFieldId || '__none__'}
                    onValueChange={handleXChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择 X 参数" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">未选择</SelectItem>
                      {shortArrayFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Y 轴（多选）
                  </Label>
                  {yCandidates.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      {xFieldId
                        ? '没有其他 short_array 可作为 Y 轴'
                        : '请先选择 X 轴，或从列表勾选 Y 轴'}
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-sm border border-gray-200 bg-gray-50/50 p-3 max-h-40 overflow-y-auto">
                      {yCandidates.map((field) => {
                        const checked = yFieldIds.includes(field.id);
                        return (
                          <label
                            key={field.id}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleYField(field.id, value === true)
                              }
                            />
                            <span className="font-medium text-gray-800">
                              {field.id}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {warnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      长度不一致
                    </Label>
                    <div className="space-y-1.5">
                      {warnings.map((w) => (
                        <div
                          key={w.yFieldId}
                          className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                        >
                          <span className="font-semibold">{w.yFieldId}</span>
                          ：X 长度 {w.xLen}，Y 长度 {w.yLen}，已跳过绘制
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectionReady && (
                  <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                    请选择恰好 1 个 X 轴参数，以及至少 1 个 Y 轴参数。
                  </div>
                )}

                {selectedFields.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      参数输入
                    </Label>
                    {selectedFields.map((field) => {
                      const values = getArrayValue(field.id);
                      const role =
                        field.id === xFieldId
                          ? 'X'
                          : yFieldIds.includes(field.id)
                            ? 'Y'
                            : '';
                      return (
                        <div key={field.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              {field.id}
                            </span>
                            {role && (
                              <span className="inline-flex items-center rounded-full bg-[var(--office-blue-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--office-blue)]">
                                {role}
                              </span>
                            )}
                          </div>
                          <Input
                            type="text"
                            value={values.join(',')}
                            onChange={(e) =>
                              handleArrayInputChange(field.id, e.target.value)
                            }
                            placeholder="输入数值，用逗号分隔，如: 1,2,3,4"
                            className="w-full"
                          />
                          <div className="text-[10px] text-gray-400">
                            长度: {values.length}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="md:col-span-3 p-4 min-h-[360px] flex flex-col">
            {!hasShortArrays || !selectionReady ? (
              <div className="flex-1 min-h-[360px] rounded-sm border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500 px-6 text-center">
                {!hasShortArrays
                  ? '无可绘制的 short_array 参数'
                  : '选择 X / Y 参数后，将在此显示可拖拽折线图'}
              </div>
            ) : validSeries.length === 0 ? (
              <div
                className={`flex-1 min-h-[360px] rounded-sm border border-dashed flex items-center justify-center text-sm px-6 text-center ${
                  allSelectedEmpty
                    ? 'border-gray-200 bg-gray-50 text-gray-500'
                    : 'border-amber-200 bg-amber-50/40 text-amber-800'
                }`}
              >
                {allSelectedEmpty
                  ? '所选参数数组为空，请先在左侧输入数值'
                  : '所选 Y 参数与 X 长度均不一致，请调整数组长度后再试'}
              </div>
            ) : (
              <div className="flex-1 min-h-[360px] w-full rounded-sm border border-gray-200 bg-white">
                <ReactECharts
                  option={chartOption}
                  style={{ height: '100%', minHeight: 360, width: '100%' }}
                  notMerge
                  lazyUpdate
                  onChartReady={handleChartReady}
                />
              </div>
            )}
            {selectionReady && validSeries.length > 0 && (
              <p className="mt-2 text-[11px] text-gray-400">
                拖动数据点：水平改 X[i]，垂直改对应 Y[i]；若数组为整数则按整数吸附。支持撤回（Ctrl/⌘+Z）。
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={undoLastChange}
            disabled={history.length === 0}
            title="Ctrl/⌘+Z"
          >
            <Undo2 className="h-4 w-4 mr-1.5" />
            撤回
            {history.length > 0 ? ` (${history.length})` : ''}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParamChartEditorDialog;
