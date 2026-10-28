import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';
import ArrayInput, {
  type ArrayInfoItem,
} from '@/components/add-cases/ArrayInput';

const InitializationPage: React.FC = () => {
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
      tooltip: 'major radius in cm',
      label: 'rmajor',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'minor radius in cm',
      label: 'rminor',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'current in kA',
      label: 'curent',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'toroidal field in Gauss',
      label: 'bz',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'initial ti(r) parabola^etifit',
      label: 'ti0',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'initial te(r) parabola^etefit',
      label: 'te0',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'initial ti(r) parabola^etifit',
      label: 'ti1',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'initial te(r) parabola^etefit',
      label: 'te1',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'initial ti(r) parabola^etifit',
      label: 'etifit',
      type: 'number',
      baseBlock: 'block7',
    },
    {
      tooltip: 'initial te(r) parabola^etefit',
      label: 'etefit',
      type: 'number',
      baseBlock: 'block7',
    },
  ];

  const arrayInfo: ArrayInfoItem[] = [
    {
      tooltip: '',
      label: 'ngas',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'denga0',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'denga1',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'denim0',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'denim1',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'nimp',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'ehfit',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'eifit',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'eehfit',
      baseBlock: 'block7',
    },
    {
      tooltip: '',
      label: 'eeifit',
      baseBlock: 'block7',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="系统初始条件 - 步骤 5/11"
        stepNumber={5}
        totalSteps={steps.length}
        description={steps[4]}
        previousPath="/add-cases/transport-model"
        nextPath="/add-cases/boundary"
      />

      <StaticParamCard
        title="基础参数"
        description="配置等离子体几何和初始条件参数"
      >
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="数组参数"
        description="配置气体、密度和拟合参数数组"
      >
        <ArrayInput arrayInfo={arrayInfo} />
      </StaticParamCard>
    </div>
  );
};

export default InitializationPage;
