import React, { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { Button } from '@/shadcn/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { updateField } from '@/redux/slices/dynamicFormSlice';
import { useAiChatStream } from '@/hooks/useAiChatStream';
import { useValidateParametersMutation } from '@/redux/api/ai';
import { ShieldCheck } from 'lucide-react';
import AiChatPanel from './AiChatPanel';
import { SuggestionList, useSuggestionSelection } from './SuggestionList';
import type { AiChatItem, ParameterIssue } from '@/types/Ai';

interface ParameterAssistantProps {
  configName: string;
  onClose?: () => void;
}

/**
 * 调参助手：读取动态表单当前值发给后端，建议经勾选后通过 updateField 写回表单
 */
const ParameterAssistant: React.FC<ParameterAssistantProps> = ({
  configName,
  onClose,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const formData = useAppSelector((state) => state.dynamicForm[configName]);
  const selection = useSuggestionSelection();
  const [validate, { isLoading: isValidating }] =
    useValidateParametersMutation();
  const [issues, setIssues] = useState<ParameterIssue[] | null>(null);

  const runPrecheck = async () => {
    try {
      const result = await validate({
        configName,
        formData: formData ?? {},
      }).unwrap();
      setIssues(result.issues);
    } catch {
      toast.error(intl.formatMessage({ id: 'ai.error' }));
    }
  };

  const buildBody = useCallback(
    (message: string, history: unknown[]) => ({
      configName,
      formData: formData ?? {},
      message,
      history,
    }),
    [configName, formData],
  );

  const chat = useAiChatStream({
    url: '/api/Ai/ParameterChat',
    buildBody,
    errorText: intl.formatMessage({ id: 'ai.error' }),
  });

  const shortcuts = useMemo(
    () =>
      ['conflict', 'conservative', 'transport', 'stability'].map((key) =>
        intl.formatMessage({ id: `ai.param.shortcut.${key}` }),
      ),
    [intl],
  );

  const applyChanges = (item: AiChatItem, onlySelected: boolean) => {
    const targets = selection.pick(item, onlySelected);
    if (targets.length === 0) return;

    targets.forEach(({ change }) => {
      dispatch(
        updateField({
          configName,
          panelId: change.panelId,
          fieldId: change.fieldId,
          value: change.suggestedValue,
        }),
      );
    });
    selection.markApplied(targets.map(({ key }) => key));
    toast.success(
      intl.formatMessage({ id: 'ai.param.applied' }, { count: targets.length }),
    );
  };

  const renderExtras = (item: AiChatItem) => (
    <SuggestionList
      item={item}
      selection={selection}
      actions={
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => applyChanges(item, true)}
          >
            {intl.formatMessage({ id: 'ai.param.applySelected' })}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs"
            onClick={() => applyChanges(item, false)}
          >
            {intl.formatMessage({ id: 'ai.param.applyAll' })}
          </Button>
        </>
      }
    />
  );

  return (
    <AiChatPanel
      title={intl.formatMessage({ id: 'ai.param.title' })}
      subtitle={intl.formatMessage({ id: 'ai.param.subtitle' })}
      emptyText={intl.formatMessage({ id: 'ai.param.empty' })}
      items={chat.items}
      isStreaming={chat.isStreaming}
      shortcuts={shortcuts}
      onSend={chat.send}
      onStop={chat.stop}
      onReset={() => {
        chat.reset();
        selection.reset();
      }}
      onClose={onClose}
      renderExtras={renderExtras}
      toolbar={
        <div className="space-y-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={isValidating}
            onClick={runPrecheck}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            {intl.formatMessage({ id: 'ai.param.precheck' })}
          </Button>
          {issues && (
            <div className="max-h-40 space-y-0.5 overflow-y-auto text-xs">
              {issues.length === 0 ? (
                <div className="text-green-600">
                  {intl.formatMessage({ id: 'ai.param.precheckPassed' })}
                </div>
              ) : (
                issues.map((issue, index) => (
                  <div
                    key={`${issue.panelId}-${issue.fieldId}-${index}`}
                    className={
                      issue.severity === 'error'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }
                  >
                    <span className="font-mono">
                      {issue.panelId}.{issue.fieldId}
                    </span>
                    ：{issue.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      }
    />
  );
};

export default ParameterAssistant;
