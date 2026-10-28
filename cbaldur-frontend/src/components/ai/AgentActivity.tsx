import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleSlash,
  ListChecks,
  Loader2,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  AgentPlan,
  AiArtifact,
  AiToolRun,
  PlanStepStatus,
} from '@/types/Ai';

const StepIcon: React.FC<{ status: PlanStepStatus | AiToolRun['status'] }> = ({
  status,
}) => {
  switch (status) {
    case 'running':
    case 'started':
      return (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--office-blue)]" />
      );
    case 'completed':
      return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />;
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />;
    case 'skipped':
      return <CircleSlash className="h-3.5 w-3.5 shrink-0 text-gray-400" />;
    default:
      return <Circle className="h-3.5 w-3.5 shrink-0 text-gray-300" />;
  }
};

/**
 * 智能体执行计划（迁移自 fusim-ai-assistant 的 AgentPlanCard）
 */
export const AgentPlanCard: React.FC<{
  plan: AgentPlan;
  toolRuns?: AiToolRun[];
}> = ({ plan, toolRuns = [] }) => {
  const intl = useIntl();
  const [open, setOpen] = useState(true);
  const finished = plan.steps.filter((s) =>
    ['completed', 'failed', 'skipped'].includes(s.status),
  ).length;
  const statusKey = `ai.plan.status.${plan.status}`;

  return (
    <div className="rounded-md border border-gray-200 bg-white text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left"
      >
        <ListChecks className="h-3.5 w-3.5 text-[var(--office-blue)]" />
        <span className="font-semibold text-gray-700">
          {intl.formatMessage({ id: 'ai.plan.title' })}
        </span>
        <span className="text-gray-500">
          {intl.formatMessage({ id: statusKey, defaultMessage: plan.status })}
          {plan.steps.length > 0 && ` · ${finished}/${plan.steps.length}`}
        </span>
        <span className="ml-auto text-gray-400">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
      {plan.steps.length > 0 && (
        <div className="mx-2 h-1 overflow-hidden rounded bg-gray-100">
          <div
            className="h-full bg-[var(--office-blue)] transition-all"
            style={{
              width: `${Math.round((finished / plan.steps.length) * 100)}%`,
            }}
          />
        </div>
      )}
      {open && (
        <ol className="space-y-1 px-2 py-1.5">
          {plan.status === 'planning' && plan.steps.length === 0 && (
            <li className="flex items-center gap-1.5 text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {intl.formatMessage({ id: 'ai.plan.planning' })}
            </li>
          )}
          {plan.steps.map((step) => {
            const runs = toolRuns.filter((r) => r.planStepId === step.stepId);
            return (
              <li key={step.stepId} className="flex items-start gap-1.5">
                <span className="mt-0.5">
                  <StepIcon status={step.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-gray-800">
                    {step.order}. {step.title}
                    {runs.length > 1 && (
                      <span className="ml-1 text-gray-400">×{runs.length}</span>
                    )}
                  </div>
                  {(step.error || step.resultSummary) &&
                    step.status !== 'skipped' && (
                      <div
                        className={`line-clamp-2 break-all ${
                          step.error ? 'text-red-500' : 'text-gray-500'
                        }`}
                      >
                        {step.error ?? step.resultSummary}
                      </div>
                    )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

/**
 * 工具调用过程：名称、状态、耗时，Python 工具可展开查看代码与结果摘要
 */
export const ToolRunList: React.FC<{ runs: AiToolRun[] }> = ({ runs }) => {
  const intl = useIntl();
  const [expanded, setExpanded] = useState<string | null>(null);
  if (runs.length === 0) return null;

  return (
    <div className="space-y-1">
      {runs.map((run) => {
        const isOpen = expanded === run.runId;
        const hasDetail = !!run.code || !!run.summary;
        return (
          <div
            key={run.runId}
            className="rounded-md border border-gray-200 bg-white text-xs"
          >
            <button
              type="button"
              disabled={!hasDetail}
              onClick={() => setExpanded(isOpen ? null : run.runId)}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-left"
            >
              <Wrench className="h-3 w-3 text-gray-400" />
              <span className="text-gray-700">{run.displayName}</span>
              <StepIcon status={run.status} />
              {run.durationMs != null && (
                <span className="text-gray-400">
                  {(run.durationMs / 1000).toFixed(1)}s
                </span>
              )}
              {hasDetail && (
                <span className="ml-auto text-gray-400">
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </span>
              )}
            </button>
            {isOpen && (
              <div className="space-y-1 border-t border-gray-100 px-2 py-1.5">
                {run.code && (
                  <>
                    <div className="text-gray-500">
                      {intl.formatMessage({ id: 'ai.tool.code' })}
                    </div>
                    <pre className="max-h-60 overflow-auto rounded bg-gray-50 p-1.5 text-[11px] leading-snug">
                      {run.code}
                    </pre>
                  </>
                )}
                {run.summary && (
                  <>
                    <div className="text-gray-500">
                      {intl.formatMessage({ id: 'ai.tool.result' })}
                    </div>
                    <div
                      className={`whitespace-pre-wrap break-all ${
                        run.status === 'failed'
                          ? 'text-red-500'
                          : 'text-gray-600'
                      }`}
                    >
                      {run.summary}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * 沙箱生成的文件：PNG 直接预览，其他类型（含 SVG）作为下载链接，
 * 避免把 SVG 当作同源可执行文档打开。
 */
export const ArtifactGallery: React.FC<{ artifacts: AiArtifact[] }> = ({
  artifacts,
}) => {
  if (artifacts.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {artifacts.map((artifact) =>
        /\.png$/i.test(artifact.fileName) ? (
          <a
            key={artifact.url}
            href={artifact.url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-md border border-gray-200 bg-white"
          >
            <img
              src={artifact.url}
              alt={artifact.fileName}
              className="w-full"
              loading="lazy"
            />
          </a>
        ) : (
          <a
            key={artifact.url}
            href={artifact.url}
            download={artifact.fileName}
            className="block truncate text-xs text-[var(--office-blue)] underline"
          >
            {artifact.fileName}
          </a>
        ),
      )}
    </div>
  );
};
