// 与后端 Models/AiDtos.cs 对齐
import type { LongArray, ShortArray } from '@/types/ConfigSchema';

export type FieldValue = boolean | number | ShortArray | LongArray;

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProposedFieldChange {
  panelId: string;
  fieldId: string;
  fieldType: string;
  currentValue: FieldValue | null;
  suggestedValue: FieldValue;
  reason: string;
}

export interface PlotRequest {
  type: string;
  mode: 'single' | 'time';
  time: string | null;
  times: string[] | null;
  x: string;
  y: string;
  expression: string | null;
}

export type PlanStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface AgentPlanStep {
  stepId: string;
  order: number;
  title: string;
  description: string;
  tool: string | null;
  status: PlanStepStatus;
  resultSummary: string | null;
  error: string | null;
}

/** planning / ready / running / completed / completed-with-errors / failed */
export interface AgentPlan {
  planId: string;
  goal: string;
  status: string;
  steps: AgentPlanStep[];
}

export interface AiToolRun {
  runId: string;
  name: string;
  displayName: string;
  status: 'started' | 'completed' | 'failed';
  durationMs: number | null;
  summary: string | null;
  code: string | null;
  planStepId: string | null;
}

export interface AiArtifact {
  runId: string;
  fileName: string;
  url: string;
  sizeBytes: number;
}

export interface ParameterIssue {
  panelId: string;
  fieldId: string;
  severity: 'error' | 'warning';
  message: string;
}

/** 页面上展示的一条消息（含流式状态与附带的结构化结果） */
export interface AiChatItem extends AiChatMessage {
  id: string;
  streaming?: boolean;
  error?: boolean;
  plan?: AgentPlan;
  toolRuns?: AiToolRun[];
  artifacts?: AiArtifact[];
  suggestions?: ProposedFieldChange[];
  plots?: PlotRequest[];
}
