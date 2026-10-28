import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import IndexValueInput, {
  type IndexValueInfoItem,
} from '@/components/add-cases/IndexValueInput';

const TransportPage: React.FC = () => {
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
    '请填写或者检查生成的JSON！',
  ];

  const indexValueInfo: IndexValueInfoItem[] = [
    {
      label: 'cfutz',
      baseBlock: 'block2',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="Transport模块 - 步骤 3/11"
        stepNumber={3}
        totalSteps={steps.length}
        description={steps[2]}
        previousPath="/add-cases/impurity"
        nextPath="/add-cases/transport-model"
      />

      <StaticParamCard
        title="Transport配置"
        description="配置传输系数和相关参数"
      >
        <IndexValueInput indexValueInfo={indexValueInfo} size="large" />
      </StaticParamCard>
    </div>
  );
};

export default TransportPage;
