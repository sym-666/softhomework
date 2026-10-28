import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  hydrateExpressionVariables,
  type ExpressionVariable,
  type ParsedExpression,
} from '@/utils/plotExpression';

const ANIMATION_FPS = 4;
const FRAME_MS = 1000 / ANIMATION_FPS;
const EQ2D_CONCURRENCY = 4;

export type Eq2DContour = { psi: number; points: [number, number][] };

export type AnimationDomain1D = {
  x: [number, number];
  y: [number, number];
};

export type AnimationDomainEq2D = {
  r: [number, number];
  z: [number, number];
  psi: [number, number];
};

type GetPlotAcrossTimesFn = (body: {
  caseId: string;
  type: string;
  times: string[];
  x: string;
  y: string;
  variables?: string[];
}) => { unwrap: () => Promise<any[]> };

type GetPlotFn = (params: {
  caseId: string;
  type: string;
  time: string;
  x: string;
  y: string;
}) => Promise<any[]>;

type ApplyExpressionFn = (
  data: any[],
  expression: ParsedExpression,
  xKey: string,
  yKey: string,
) => any[];

const parseNumeric = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const renameKeys = (
  points: { x: number; y: number; [key: string]: any }[],
  xKey: string,
  yKey: string,
): { [key: string]: any }[] => {
  if (!points) return [];
  return points.map((point) => {
    const { x, y, ...newPoint } = point;
    newPoint[xKey] = x;
    newPoint[yKey] = y;
    return newPoint;
  });
};

const domainWithPadding = (values: number[]): [number, number] | undefined => {
  if (values.length === 0) return undefined;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.05 || Math.abs(max || 1) * 0.05;
  return [min - padding, max + padding];
};

/** Axis/color-map range without padding (psi visualMap should stay tight). */
const domainExact = (values: number[]): [number, number] | undefined => {
  if (values.length === 0) return undefined;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.abs(min || 1) * 0.05;
    return [min - pad, max + pad];
  }
  return [min, max];
};

const buildEq2DContours = (rzData: any[], psiData: any[]): Eq2DContour[] => {
  const len = Math.min(rzData.length, psiData.length);
  if (len === 0) return [];
  const byPsi = new Map<number, [number, number][]>();
  for (let i = 0; i < len; i += 1) {
    const r = parseNumeric(rzData[i]?.x);
    const z = parseNumeric(rzData[i]?.y);
    const psi = parseNumeric(psiData[i]?.y);
    if (r === null || z === null || psi === null) continue;
    const points = byPsi.get(psi) ?? [];
    points.push([r, z]);
    byPsi.set(psi, points);
  }
  const psiLevels = Array.from(byPsi.keys()).sort((a, b) => a - b);
  return psiLevels.flatMap((psi) => {
    const points = byPsi.get(psi) ?? [];
    const uniquePointCount = new Set(points.map(([r, z]) => `${r}|${z}`)).size;
    if (uniquePointCount < 3) return [];
    if (points.length > 1) {
      const [r0, z0] = points[0];
      const [r1, z1] = points[points.length - 1];
      if (r0 !== r1 || z0 !== z1) points.push([r0, z0]);
    }
    return [{ psi, points }];
  });
};

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let done = 0;
  const worker = async () => {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) return;
      results[current] = await fn(items[current], current);
      done += 1;
      onProgress?.(done, items.length);
    }
  };
  const poolSize = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return results;
}

export interface UsePlotTimeAnimationParams {
  enabled: boolean;
  isEq2D: boolean;
  caseId: string;
  nowType: string;
  nowX?: string;
  nowY?: string;
  timeOptions?: string[];
  expression?: ParsedExpression;
  expressionVariables: ExpressionVariable[];
  applyExpression: ApplyExpressionFn;
  getPlotAcrossTimes: GetPlotAcrossTimesFn;
  getPlot: GetPlotFn;
  onError?: (message: string) => void;
}

export function usePlotTimeAnimation({
  enabled,
  isEq2D,
  caseId,
  nowType,
  nowX,
  nowY,
  timeOptions,
  expression,
  expressionVariables,
  applyExpression,
  getPlotAcrossTimes,
  getPlot,
  onError,
}: UsePlotTimeAnimationParams) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [frames1D, setFrames1D] = useState<Record<string, any[]>>({});
  const [framesEq2D, setFramesEq2D] = useState<Record<string, Eq2DContour[]>>(
    {},
  );
  const [domain1D, setDomain1D] = useState<AnimationDomain1D | undefined>(
    undefined,
  );
  const [domainEq2D, setDomainEq2D] = useState<AnimationDomainEq2D | undefined>(
    undefined,
  );
  const [cacheKey, setCacheKey] = useState<string>('');

  const times = useMemo(() => timeOptions ?? [], [timeOptions]);
  const timesKey = times.join('|');

  const desiredCacheKey = useMemo(() => {
    if (!enabled || !caseId || times.length === 0) return '';
    if (isEq2D) return `eq2D|${caseId}|${nowType}|${timesKey}`;
    if (!nowX || !nowY) return '';
    const expressionKey = expression
      ? `${expression.expression}|${expression.variableHeaders.join('|')}`
      : '';
    return `1d|${caseId}|${nowType}|${nowX}|${nowY}|${expressionKey}|${timesKey}`;
  }, [
    enabled,
    caseId,
    times.length,
    isEq2D,
    nowType,
    timesKey,
    nowX,
    nowY,
    expression,
  ]);

  const loadIdRef = useRef(0);

  const clearCache = useCallback(() => {
    setFrames1D((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    setFramesEq2D((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    setDomain1D((prev) => (prev === undefined ? prev : undefined));
    setDomainEq2D((prev) => (prev === undefined ? prev : undefined));
    setCacheKey((prev) => (prev === '' ? prev : ''));
    setLoadProgress((prev) => (prev === 0 ? prev : 0));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsPlaying(false);
      setFrameIndex(0);
      setIsLoading(false);
      clearCache();
      return;
    }
    setIsPlaying(false);
    setFrameIndex(0);
  }, [enabled, clearCache]);

  useEffect(() => {
    if (!enabled) return;
    if (frameIndex >= times.length) {
      setFrameIndex(0);
    }
  }, [enabled, frameIndex, times.length]);

  useEffect(() => {
    if (!enabled) return;
    if (!desiredCacheKey) {
      clearCache();
      setIsLoading(false);
      return;
    }
    if (desiredCacheKey === cacheKey) return;

    const loadId = ++loadIdRef.current;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setIsPlaying(false);
      setLoadProgress(0);
      setFrames1D({});
      setFramesEq2D({});
      setDomain1D(undefined);
      setDomainEq2D(undefined);

      try {
        if (isEq2D) {
          const nextFrames: Record<string, Eq2DContour[]> = {};
          const allR: number[] = [];
          const allZ: number[] = [];
          const allPsi: number[] = [];
          let failed = 0;

          await mapPool(
            times,
            EQ2D_CONCURRENCY,
            async (time) => {
              try {
                const [rzData, psiData] = await Promise.all([
                  getPlot({ caseId, type: nowType, time, x: 'R', y: 'Z' }),
                  getPlot({ caseId, type: nowType, time, x: 'R', y: 'psi' }),
                ]);
                if (cancelled || loadId !== loadIdRef.current) return;
                const contours = buildEq2DContours(rzData ?? [], psiData ?? []);
                nextFrames[time] = contours;
                for (const c of contours) {
                  allPsi.push(c.psi);
                  for (const [r, z] of c.points) {
                    allR.push(r);
                    allZ.push(z);
                  }
                }
              } catch {
                failed += 1;
                nextFrames[time] = [];
              }
            },
            (done, total) => {
              if (!cancelled && loadId === loadIdRef.current) {
                setLoadProgress(total > 0 ? (done / total) * 100 : 0);
              }
            },
          );

          if (cancelled || loadId !== loadIdRef.current) return;

          if (failed === times.length && times.length > 0) {
            clearCache();
            onError?.('preload-failed');
            return;
          }

          const rDomain = domainWithPadding(allR);
          const zDomain = domainWithPadding(allZ);
          // Keep psi visualMap stable without extra padding so colors map to true range.
          const psiDomain = domainExact(allPsi);
          setFramesEq2D(nextFrames);
          if (rDomain && zDomain && psiDomain) {
            setDomainEq2D({ r: rDomain, z: zDomain, psi: psiDomain });
          }
          setCacheKey(desiredCacheKey);
          if (failed > 0) {
            onError?.(`eq2d-partial:${failed}`);
          }
        } else {
          if (!nowX || !nowY) {
            setIsLoading(false);
            return;
          }
          setLoadProgress(10);
          const rawData = await getPlotAcrossTimes({
            caseId,
            type: nowType,
            times,
            x: nowX,
            y: nowY,
            variables: expression?.variableHeaders,
          }).unwrap();
          if (cancelled || loadId !== loadIdRef.current) return;
          setLoadProgress(70);

          const grouped: Record<string, any[]> = {};
          for (const time of times) grouped[time] = [];

          for (const item of rawData ?? []) {
            const time = String(item?.time ?? '');
            if (!time) continue;
            if (!grouped[time]) grouped[time] = [];
            grouped[time].push(item);
          }

          const nextFrames: Record<string, any[]> = {};
          const allX: number[] = [];
          const allY: number[] = [];

          for (const time of times) {
            let processed = renameKeys(grouped[time] ?? [], nowX, nowY);
            if (expression) {
              processed = hydrateExpressionVariables(
                processed,
                expressionVariables,
              );
              processed = applyExpression(processed, expression, nowX, nowY);
            }
            nextFrames[time] = processed;
            for (const row of processed) {
              const xVal = parseNumeric(row[nowX]);
              const yVal = parseNumeric(row[nowY]);
              if (xVal !== null) allX.push(xVal);
              if (yVal !== null) allY.push(yVal);
            }
          }

          const xDomain = domainWithPadding(allX);
          const yDomain = domainWithPadding(allY);
          const hasAnyPoints = allX.length > 0 && allY.length > 0;
          if (!hasAnyPoints) {
            clearCache();
            onError?.('preload-failed');
            return;
          }
          setFrames1D(nextFrames);
          if (xDomain && yDomain) {
            setDomain1D({ x: xDomain, y: yDomain });
          }
          setLoadProgress(100);
          setCacheKey(desiredCacheKey);
        }
      } catch (error) {
        console.error('Animation preload failed:', error);
        if (!cancelled && loadId === loadIdRef.current) {
          clearCache();
          onError?.('preload-failed');
        }
      } finally {
        if (!cancelled && loadId === loadIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    desiredCacheKey,
    cacheKey,
    isEq2D,
    caseId,
    nowType,
    nowX,
    nowY,
    times,
    expression,
    expressionVariables,
    applyExpression,
    getPlotAcrossTimes,
    getPlot,
    onError,
    clearCache,
  ]);

  const framesReady = Boolean(
    cacheKey && cacheKey === desiredCacheKey && !isLoading,
  );
  const canPlay = framesReady && times.length > 1;

  useEffect(() => {
    if (!canPlay && isPlaying) {
      setIsPlaying(false);
    }
  }, [canPlay, isPlaying]);

  useEffect(() => {
    if (!enabled || !isPlaying || !canPlay) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        const n = times.length;
        if (n <= 1) return 0;
        return (prev + 1) % n;
      });
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [enabled, isPlaying, canPlay, times.length]);

  const currentTime = times[frameIndex] ?? times[0];

  const current1DData = useMemo(() => {
    if (!framesReady || isEq2D || !currentTime) return [] as any[];
    return frames1D[currentTime] ?? [];
  }, [framesReady, isEq2D, currentTime, frames1D]);

  const currentEq2DContours = useMemo(() => {
    if (!framesReady || !isEq2D || !currentTime) return [] as Eq2DContour[];
    return framesEq2D[currentTime] ?? [];
  }, [framesReady, isEq2D, currentTime, framesEq2D]);

  const seekTo = useCallback(
    (index: number) => {
      const n = times.length;
      if (n === 0) return;
      const next = Math.max(0, Math.min(n - 1, index));
      setFrameIndex(next);
      setIsPlaying(false);
    },
    [times.length],
  );

  const togglePlay = useCallback(() => {
    if (!canPlay) return;
    setIsPlaying((prev) => !prev);
  }, [canPlay]);

  const pause = useCallback(() => setIsPlaying(false), []);

  return {
    isPlaying,
    frameIndex,
    isLoading,
    loadProgress,
    framesReady,
    canPlay,
    currentTime,
    current1DData,
    currentEq2DContours,
    domain1D,
    domainEq2D,
    seekTo,
    togglePlay,
    pause,
    setIsPlaying,
    clearCache,
  };
}
