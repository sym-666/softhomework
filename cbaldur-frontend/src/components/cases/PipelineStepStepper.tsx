import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Ban,
  FileCode,
  UploadCloud,
  Cpu,
  DownloadCloud,
  Layers,
} from 'lucide-react';

export interface StepItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const PIPELINE_STEPS: StepItem[] = [
  {
    id: 'convert',
    title: '参数转换',
    description: 'JSON → Namelist',
    icon: FileCode,
  },
  {
    id: 'upload',
    title: '文件上传',
    description: '传输输入配置',
    icon: UploadCloud,
  },
  {
    id: 'submit',
    title: '超算计算',
    description: 'jobxlpt 迭代求解',
    icon: Cpu,
  },
  {
    id: 'download',
    title: '结果下载',
    description: '拉取数据与日志',
    icon: DownloadCloud,
  },
  {
    id: 'postprocess',
    title: '数据后处理',
    description: '归档与图表准备',
    icon: Layers,
  },
];

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'terminated';

interface PipelineStepStepperProps {
  logs: string[];
  status: 'idle' | 'connecting' | 'streaming' | 'completed' | 'failed' | 'disconnected';
  isSuccess?: boolean;
  isTerminated?: boolean;
  className?: string;
}

export const PipelineStepStepper: React.FC<PipelineStepStepperProps> = ({
  logs,
  status,
  isSuccess = false,
  isTerminated = false,
  className = '',
}) => {
  const stepStates = useMemo(() => {
    const states: Record<string, StepStatus> = {
      convert: 'pending',
      upload: 'pending',
      submit: 'pending',
      download: 'pending',
      postprocess: 'pending',
    };

    if (logs.length === 0) {
      if (status === 'connecting' || status === 'streaming') {
        states.convert = 'running';
      }
      return states;
    }

    const logText = logs.join('\n');

    const convertStarted =
      logText.includes('正在执行步骤 [convert]') ||
      logText.includes('开始执行算例任务') ||
      logText.includes('成功连接至超算');
    const convertDone =
      logText.includes('步骤 [convert] 完成') ||
      logText.includes('正在执行步骤 [mkdir]') ||
      logText.includes('正在执行步骤 [upload]');

    const uploadStarted =
      logText.includes('正在执行步骤 [mkdir]') ||
      logText.includes('正在执行步骤 [upload]');
    const uploadDone =
      logText.includes('步骤 [upload] 完成') ||
      logText.includes('正在执行步骤 [submit]');

    const submitStarted =
      logText.includes('正在执行步骤 [submit]') ||
      logText.includes('iteration') ||
      logText.includes('step') ||
      logText.includes('time=');
    const submitDone =
      logText.includes('步骤 [submit] 完成') ||
      logText.includes('正在执行步骤 [download]');

    const downloadStarted = logText.includes('正在执行步骤 [download]');
    const downloadDone =
      logText.includes('步骤 [download] 完成') ||
      logText.includes('正在执行步骤 [postprocess]');

    const postprocessStarted = logText.includes('正在执行步骤 [postprocess]');
    const postprocessDone =
      logText.includes('步骤 [postprocess] 完成') ||
      logText.includes('全部计算流程执行完成') ||
      (status === 'completed' && isSuccess);

    // Determine base progression
    if (convertDone) states.convert = 'completed';
    else if (convertStarted) states.convert = 'running';

    if (uploadDone) states.upload = 'completed';
    else if (uploadStarted) states.upload = 'running';

    if (submitDone) states.submit = 'completed';
    else if (submitStarted) states.submit = 'running';

    if (downloadDone) states.download = 'completed';
    else if (downloadStarted) states.download = 'running';

    if (postprocessDone) states.postprocess = 'completed';
    else if (postprocessStarted) states.postprocess = 'running';

    if (status === 'completed' && isSuccess) {
      states.convert = 'completed';
      states.upload = 'completed';
      states.submit = 'completed';
      states.download = 'completed';
      states.postprocess = 'completed';
      return states;
    }

    // Handle failure / termination on the active step
    if (status === 'failed' || isTerminated || logText.includes('[Pipeline ERROR]') || logText.includes('主动终止')) {
      const targetFailedStatus: StepStatus = isTerminated || logText.includes('主动终止') ? 'terminated' : 'failed';

      // Find the furthest running or last started step
      const stepOrder = ['convert', 'upload', 'submit', 'download', 'postprocess'];
      let lastActiveIndex = 0;

      for (let i = stepOrder.length - 1; i >= 0; i--) {
        const stepKey = stepOrder[i];
        if (states[stepKey] === 'running' || states[stepKey] === 'completed') {
          lastActiveIndex = i;
          break;
        }
      }

      if (states[stepOrder[lastActiveIndex]] === 'running') {
        states[stepOrder[lastActiveIndex]] = targetFailedStatus;
      } else if (!isSuccess) {
        // If all marked completed or none, mark the current active
        states[stepOrder[lastActiveIndex]] = targetFailedStatus;
      }
    }

    return states;
  }, [logs, status, isSuccess, isTerminated]);

  const renderStepIcon = (state: StepStatus, IconComponent: React.ElementType) => {
    switch (state) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-sky-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'terminated':
        return <Ban className="h-5 w-5 text-amber-500" />;
      case 'pending':
      default:
        return <IconComponent className="h-5 w-5 text-muted-foreground/60" />;
    }
  };

  const getStepColorClass = (state: StepStatus) => {
    switch (state) {
      case 'completed':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'running':
        return 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20';
      case 'failed':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';
      case 'terminated':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'pending':
      default:
        return 'border-border/60 bg-muted/40 text-muted-foreground';
    }
  };

  const getConnectorClass = (currentIndex: number) => {
    const currentStep = PIPELINE_STEPS[currentIndex];
    const nextStep = PIPELINE_STEPS[currentIndex + 1];
    if (!nextStep) return '';

    const currentDone = stepStates[currentStep.id] === 'completed';
    const nextActive =
      stepStates[nextStep.id] === 'running' ||
      stepStates[nextStep.id] === 'completed';

    if (currentDone && nextActive) {
      return 'bg-emerald-500/60 dark:bg-emerald-500/50';
    }
    if (currentDone) {
      return 'bg-emerald-500/30';
    }
    return 'bg-border/60';
  };

  return (
    <div className={`w-full bg-card border border-border/80 rounded-xl p-4 shadow-sm select-none ${className}`}>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {PIPELINE_STEPS.map((step, index) => {
          const state = stepStates[step.id];
          const isLast = index === PIPELINE_STEPS.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${getStepColorClass(
                    state,
                  )}`}
                >
                  {renderStepIcon(state, step.icon)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground tracking-tight">
                    {step.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {state === 'running' ? (
                      <span className="text-sky-500 font-medium animate-pulse">执行中...</span>
                    ) : state === 'terminated' ? (
                      <span className="text-amber-500 font-medium">已终止</span>
                    ) : state === 'failed' ? (
                      <span className="text-rose-500 font-medium">执行失败</span>
                    ) : state === 'completed' ? (
                      <span className="text-emerald-500">已完成</span>
                    ) : (
                      step.description
                    )}
                  </span>
                </div>
              </div>

              {!isLast && (
                <div className="flex-1 min-w-[24px] max-w-[80px] px-1 hidden sm:block">
                  <div
                    className={`h-[2px] w-full rounded transition-colors ${getConnectorClass(
                      index,
                    )}`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
