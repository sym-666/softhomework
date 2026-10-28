import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';
import ArrayInput, {
  type ArrayInfoItem,
} from '@/components/add-cases/ArrayInput';

const BoundaryPage: React.FC = () => {
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
      tooltip: 'energy of gas puffed neutrals [keV]',
      label: 'tcoldp',
      type: 'number',
      baseBlock: 'block8',
    },
    {
      tooltip: 'temperature of recycled neutral hydrogen',
      label: 'tcold',
      type: 'number',
      baseBlock: 'block8',
    },
  ];

  const arrayInfo: ArrayInfoItem[] = [
    {
      tooltip: '',
      label: 'bdhyde(1,1)',
      baseBlock: 'block8',
    },
    {
      tooltip: '',
      label: 'bdhyde(1,2)',
      baseBlock: 'block8',
    },
    {
      tooltip: '',
      label: 'bdimpe(1,1)',
      baseBlock: 'block8',
    },
    {
      tooltip: '',
      label: 'bdimpe(1,2)',
      baseBlock: 'block8',
    },
    {
      tooltip: '',
      label: 'bdtime',
      baseBlock: 'block8',
    },
    {
      tooltip: '',
      label: 'bdtee',
      baseBlock: 'block8',
    },
    {
      tooltip: '',
      label: 'bdtie',
      baseBlock: 'block8',
    },
    {
      tooltip: '',
      label: 'flgas',
      baseBlock: 'block8',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="系统边界条件 - 步骤 6/11"
        stepNumber={6}
        totalSteps={steps.length}
        description={steps[5]}
        previousPath="/add-cases/initialization"
        nextPath="/add-cases/gas-puffing-and-pellet-inject"
      />

      <StaticParamCard
        title="基础参数"
        description="配置边界条件相关的基础参数"
      >
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="边界数组参数"
        description="配置边界条件的时间序列和密度、温度数组"
      >
        <ArrayInput arrayInfo={arrayInfo} />
      </StaticParamCard>
    </div>
  );
};

export default BoundaryPage;
