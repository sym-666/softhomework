import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';
import ArrayInput, {
  type ArrayInfoItem,
} from '@/components/add-cases/ArrayInput';
import IndexValueInput, {
  type IndexValueInfoItem,
} from '@/components/add-cases/IndexValueInput';

const TransportModelPage: React.FC = () => {
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

  const dataInfo: DataInfoItem[] = [
    {
      tooltip: 'electron-ion energy interchange coefficient',
      label: 'fdrint',
      type: 'number',
      baseBlock: 'block4',
      step: 1,
    },
  ];

  const arrayInfo: ArrayInfoItem[] = [
    {
      tooltip: '',
      label: 'fdr',
      baseBlock: 'block4',
    },
    {
      tooltip: '',
      label: 'fig',
      baseBlock: 'block4',
    },
    {
      tooltip: '',
      label: 'fec',
      baseBlock: 'block4',
    },
    {
      tooltip: '',
      label: 'fkb',
      baseBlock: 'block4',
    },
    {
      tooltip: '',
      label: 'frb',
      baseBlock: 'block4',
    },
    {
      tooltip: '',
      label: 'fmh',
      baseBlock: 'block4',
    },
  ];

  const indexValueInfo: IndexValueInfoItem[] = [
    {
      label: 'cthery',
      baseBlock: 'block4',
    },
    {
      label: 'lthery',
      baseBlock: 'block4',
    },
    {
      label: 'ltrnsp',
      baseBlock: 'block4',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="Transport Model模块 - 步骤 4/11"
        stepNumber={4}
        totalSteps={steps.length}
        description={steps[3]}
        previousPath="/add-cases/transport"
        nextPath="/add-cases/initialization"
      />

      <StaticParamCard title="基础参数">
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="数组参数"
        description="配置传输模型相关的数组参数"
      >
        <ArrayInput arrayInfo={arrayInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="索引-值配置"
        description="配置传输理论和传输模型参数"
      >
        <IndexValueInput indexValueInfo={indexValueInfo} />
      </StaticParamCard>
    </div>
  );
};

export default TransportModelPage;
