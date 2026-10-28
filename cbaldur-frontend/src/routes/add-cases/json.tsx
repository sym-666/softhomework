import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { setConfigData } from '@/redux/slices/dynamicFormSlice';
import { useCreateCaseMutation } from '@/redux/api/case';
import {
  useGetSupercomputersQuery,
  useGetCurrentUserQuery,
} from '@/redux/api/user';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card';
import { Button } from '@/shadcn/components/ui/button';
import { Label } from '@/shadcn/components/ui/label';
import { Textarea } from '@/shadcn/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  Download,
  RefreshCw,
  Send,
  MessageSquare,
} from 'lucide-react';
import { buildDefaultPanelData, type PanelFormData } from '@/utils/dynamicFormDefaults';
import {
  DEFAULT_CASE_COMMENT,
  countCommentLines,
  normalizeCommentToFourLines,
  transformPanelDataForSubmission,
} from '@/utils/caseSubmission';
import { downloadTextFile } from '@/utils/downloadTextFile';

const DEFAULT_CONFIG_NAME = 'baldur';

interface JsonPageProps {
  configName?: string;
}

const JsonPage: React.FC<JsonPageProps> = ({ configName: configNameProp }) => {
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  const configs = useSelector((state: RootState) => state.inputs);
  const configName = configNameProp || DEFAULT_CONFIG_NAME;
  const schema = configs.find((c) => c.name === configName);
  const formData = useSelector(
    (state: RootState) => state.dynamicForm[configName],
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isValidJson, setIsValidJson] = useState(false);
  const [comment, setComment] = useState(DEFAULT_CASE_COMMENT);
  const [selectedSupercomputer, setSelectedSupercomputer] = useState<
    string | undefined
  >();

  const [createCase, { isLoading: isSubmitting }] = useCreateCaseMutation();
  const { data: supercomputers, isLoading: isLoadingSupercomputers } =
    useGetSupercomputersQuery();
  const { data: currentUser } = useGetCurrentUserQuery();

  const rawCommentLineCount = countCommentLines(comment);

  // Bare /add-cases/json → redirect to default config
  useEffect(() => {
    if (!configNameProp) {
      setLocation(`/add-cases/json/${DEFAULT_CONFIG_NAME}`, { replace: true });
    }
  }, [configNameProp, setLocation]);

  // Fill editor with schema defaults on enter / config change (do not overwrite Redux).
  // Depend on configName + schema.name (not schema identity) so YAML refetch won't wipe edits.
  useEffect(() => {
    if (!schema) return;
    const defaults = buildDefaultPanelData(schema);
    const text = JSON.stringify(defaults, null, 2);
    setJsonInput(text);
    setIsValidJson(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed only when route config changes or schema first resolves
  }, [configName, schema?.name]);

  useEffect(() => {
    if (!selectedSupercomputer && supercomputers && supercomputers.length > 0) {
      setSelectedSupercomputer(supercomputers[0]);
    }
  }, [selectedSupercomputer, supercomputers]);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    try {
      JSON.parse(value);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? '';
      handleJsonChange(content);
      try {
        JSON.parse(content);
        toast.success(`文件 "${file.name}" 已加载`);
      } catch {
        toast.warning(`文件 "${file.name}" 已加载，但 JSON 格式无效`);
      }
    };
    reader.onerror = () => {
      toast.error('文件读取失败');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDownload = () => {
    let valid = true;
    try {
      JSON.parse(jsonInput);
    } catch {
      valid = false;
    }
    downloadTextFile(
      `${configName}-case-${new Date().toISOString().split('T')[0]}.json`,
      jsonInput,
    );
    if (valid) {
      toast.success('JSON 文件已下载');
    } else {
      toast.warning('已下载当前编辑器内容（JSON 格式无效）');
    }
  };

  const handleSyncFromForm = () => {
    if (!formData) {
      toast.info('尚无逐步输入数据');
      return;
    }
    const text = JSON.stringify(formData, null, 2);
    setJsonInput(text);
    setIsValidJson(true);
    toast.success('已同步逐步输入数据到编辑器');
  };

  const handleSubmit = async () => {
    if (!schema) {
      toast.error('未找到配置 schema');
      return;
    }
    if (!selectedSupercomputer) {
      toast.error('请先选择超算');
      return;
    }

    let parsed: PanelFormData;
    try {
      const value = JSON.parse(jsonInput);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        toast.error('JSON 必须是对象形态');
        return;
      }
      parsed = value as PanelFormData;
    } catch {
      toast.error('JSON 格式错误，请检查后重试');
      return;
    }

    dispatch(
      setConfigData({
        configName,
        data: parsed,
      }),
    );

    const caseJson = transformPanelDataForSubmission(schema, parsed);

    try {
      const res = await createCase({
        CaseJson: JSON.stringify(caseJson, null, 2),
        CaseJsonPrototype: JSON.stringify(parsed, null, 2),
        Comment: normalizeCommentToFourLines(comment),
        SuperComputer: selectedSupercomputer,
      }).unwrap();
      toast.success('算例提交成功!');
      if (res?.id && currentUser?.id) {
        setLocation(`/cases/${currentUser.id}/${res.id}`);
      } else {
        setLocation('/cases');
      }
    } catch (error) {
      console.error('Failed to submit case:', error);
      toast.error('算例提交失败，请检查参数');
    }
  };

  if (!configNameProp) {
    return (
      <div className="container mx-auto p-6 text-sm text-muted-foreground">
        正在跳转到默认配置…
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Configuration...</h2>
          <p className="text-muted-foreground">
            Please wait while we load the configuration schemas.
          </p>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <h2 className="text-xl font-semibold">未找到配置：{configName}</h2>
        <p className="text-muted-foreground text-sm">
          请从创建入口选择有效配置，或检查路由参数。
        </p>
        <Link href="/add-cases">
          <Button variant="outline">返回开始</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            从 JSON 输入创建案例
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            配置：
            <span className="font-medium text-foreground">{configName}</span>
            。可上传、编辑 JSON，或从逐步输入同步；提交时需填写备注并选择超算。
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-medium">上传</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                选择文件
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-medium">下载文件</h3>
              <Button
                type="button"
                onClick={handleDownload}
                variant="outline"
                className="w-full"
                disabled={!jsonInput}
              >
                <Download className="h-4 w-4 mr-2" />
                下载文件
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-medium">同步到编辑器</h3>
              <Button
                type="button"
                onClick={handleSyncFromForm}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                同步逐步输入
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>JSON 编辑器</CardTitle>
            {jsonInput && (
              <span
                className={`text-sm ${isValidJson ? 'text-green-600' : 'text-red-600'}`}
              >
                {isValidJson ? '✓ 有效 JSON' : '✗ 无效 JSON'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="json-textarea">JSON 配置数据</Label>
            <textarea
              id="json-textarea"
              value={jsonInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleJsonChange(e.target.value)
              }
              placeholder="在此处输入或粘贴 JSON 配置数据..."
              className="min-h-[400px] font-mono text-sm w-full p-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Case Remarks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            算例 Comment（必须恰好 4 行；不足会补空行，超出并入第 4 行）
          </p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={DEFAULT_CASE_COMMENT}
            rows={4}
            className="min-h-[120px] resize-y font-mono text-sm"
          />
          <p
            className={`text-xs ${
              rawCommentLineCount === 4 ? 'text-gray-500' : 'text-amber-600'
            }`}
          >
            当前 {rawCommentLineCount} 行
            {rawCommentLineCount !== 4 ? '（提交时会自动规范为 4 行）' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/add-cases">
              <Button variant="outline">返回开始</Button>
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">
                  超算选择:
                </label>
                <Select
                  value={selectedSupercomputer}
                  onValueChange={setSelectedSupercomputer}
                  disabled={
                    isLoadingSupercomputers || !supercomputers?.length
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="选择超算" />
                  </SelectTrigger>
                  <SelectContent>
                    {supercomputers?.map((sc) => (
                      <SelectItem key={sc} value={sc}>
                        {sc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !isValidJson ||
                  !jsonInput.trim() ||
                  !selectedSupercomputer
                }
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? '提交中...' : '提交算例'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonPage;
