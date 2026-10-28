import React, { useState } from 'react';
import { Button } from '@/shadcn/components/ui/button';
import { Label } from '@/shadcn/components/ui/label';
import { Badge } from '@/shadcn/components/ui/badge';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import { useInput } from '@/hooks/useInput';
import { Save, Download } from 'lucide-react';
import { toast } from 'sonner';

const CommentPage: React.FC = () => {
  const { inputData } = useInput();
  const [comment, setComment] = useState('');

  const steps = [
    '这是Basic模块',
    '这是Impurity模块',
    '这是Transport模块',
    '这是Transport Modal模块',
    '这是系统的初始条件',
    '这是系统的边界条件',
    '这是系统的Gas puffing and pellet injection模块',
    '这是系统的NBI heating模块',
    '这是系统的Reread模块',
    '这是系统的Baldur Control部分(最后一个部分了)',
    '请填写或者检查生成的配置！',
  ];

  const handleSaveCase = () => {
    const caseData = {
      ...inputData,
      metadata: {
        comment,
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    console.log('保存案例:', caseData);
    toast.success('案例配置已保存！');
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(inputData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `baldur-case-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('JSON文件已导出');
  };

  const getConfigSummary = () => {
    const blockCount = Object.keys(inputData).length;
    const totalParams = Object.values(inputData).reduce((acc, block) => {
      return acc + Object.keys(block).length - 1; // 减去namelist字段
    }, 0);

    return { blockCount, totalParams };
  };

  const { blockCount, totalParams } = getConfigSummary();

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="配置完成 - 步骤 11/11"
        stepNumber={11}
        totalSteps={steps.length}
        description={steps[10]}
        previousPath="/add-cases/baldur-control"
        nextPath="/cases"
        nextLabel="提交"
      />

      <StaticParamCard title="配置摘要">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {blockCount}
            </div>
            <p className="text-sm text-muted-foreground">配置块数量</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {totalParams}
            </div>
            <p className="text-sm text-muted-foreground">总参数数量</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <p className="text-sm text-muted-foreground">配置完成度</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label>配置的数据块:</Label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(inputData).map((block) => (
              <Badge key={block} variant="secondary">
                {block} ({inputData[block].namelist || 'unknown'})
              </Badge>
            ))}
          </div>
        </div>
      </StaticParamCard>

      <StaticParamCard
        title="案例备注"
        description="为您的案例添加描述信息和备注"
      >
        <div className="space-y-2">
          <Label htmlFor="comment">案例描述</Label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请输入案例的描述信息、参数说明或其他备注..."
            className="w-full p-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[120px] resize-y"
          />
        </div>
      </StaticParamCard>

      <StaticParamCard title="完成配置">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleExportJson}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            导出JSON配置
          </Button>
          <Button onClick={handleSaveCase} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            保存案例
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            恭喜！您已完成所有配置步骤。您可以：
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• 导出JSON文件进行备份或分享</li>
            <li>• 保存案例到系统中进行计算</li>
            <li>• 查看配置总结和可视化分析</li>
            <li>• 返回修改任何步骤的参数</li>
          </ul>
        </div>
      </StaticParamCard>
    </div>
  );
};

export default CommentPage;
