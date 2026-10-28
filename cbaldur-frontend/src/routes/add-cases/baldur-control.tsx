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

const BaldurControlPage: React.FC = () => {
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
      tooltip: 'sawtooth model minimum q for onset',
      label: 'qmin',
      type: 'number',
      baseBlock: 'block12',
    },
    {
      tooltip: 'magnetic boundary condition type',
      label: 'mombnd',
      type: 'number',
      baseBlock: 'block12',
    },
    {
      tooltip: 'control equilibrium freq computation',
      label: 'mom',
      type: 'number',
      baseBlock: 'block12',
    },
    {
      tooltip: 'maximum time breaks',
      label: 'ntbkmx',
      type: 'number',
      baseBlock: 'block12',
    },
    {
      tooltip: 'radial shift due to plasma',
      label: 'shift',
      type: 'number',
      baseBlock: 'block12',
    },
    {
      tooltip: 'number of flux surface computed',
      label: 'mflxs',
      type: 'number',
      baseBlock: 'block12',
    },
    {
      tooltip: 'sawtooth start time',
      label: 'swton',
      type: 'number',
      baseBlock: 'block12',
    },
    {
      tooltip: 'sawtooth end time',
      label: 'swtoff',
      type: 'number',
      baseBlock: 'block12',
    },
  ];

  const arrayInfo: ArrayInfoItem[] = [
    { tooltip: '', label: 'tbk(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'neqdt(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'rmajbt(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'rminbt(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'elngbt(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'trngbt(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'btort(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'rtort(1)', baseBlock: 'block12' },
    { tooltip: '', label: 'curmat(1)', baseBlock: 'block12' },
  ];

  const indexValueInfo: IndexValueInfoItem[] = [
    {
      label: 'lsweq',
      baseBlock: 'block12',
    },
    {
      label: 'lsawth',
      baseBlock: 'block12',
    },
    {
      label: 'csawth',
      baseBlock: 'block12',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="Baldur Control模块 - 步骤 10/11"
        stepNumber={10}
        totalSteps={steps.length}
        description={steps[9]}
        previousPath="/add-cases/reread"
        nextPath="/add-cases/comment"
      />

      <StaticParamCard
        title="控制参数"
        description="配置Baldur代码控制相关的基础参数"
      >
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="时间序列参数"
        description="配置时间断点和等离子体参数演化"
      >
        <ArrayInput arrayInfo={arrayInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="控制开关配置"
        description="配置各种物理模型和控制开关"
      >
        <IndexValueInput indexValueInfo={indexValueInfo} />
      </StaticParamCard>
    </div>
  );
};

export default BaldurControlPage;
