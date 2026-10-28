import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';
import IndexValueInput, {
  type IndexValueInfoItem,
} from '@/components/add-cases/IndexValueInput';

const RereadPage: React.FC = () => {
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
      tooltip: 'Reread1 time [sec] to reread namelist',
      label: 'reread',
      type: 'number',
      baseBlock: 'block13',
    },
    {
      tooltip: 'Reread2. time [sec] to reread namelist',
      label: 'reread',
      type: 'number',
      baseBlock: 'block14',
    },
    {
      tooltip: 'Reread2. maximum allowed time step',
      label: 'dtmax',
      type: 'number',
      baseBlock: 'block14',
    },
    {
      tooltip: 'Reread3. maximum allowed time step',
      label: 'dtmax',
      type: 'number',
      baseBlock: 'block15',
    },
    {
      tooltip: 'Reread3. time [sec] to reread namelist',
      label: 'reread',
      type: 'number',
      baseBlock: 'block15',
    },
    {
      tooltip: 'Reread4.maximum allowed time step',
      label: 'dtmax',
      type: 'number',
      baseBlock: 'block16',
    },
  ];

  const indexValueInfo: IndexValueInfoItem[] = [
    {
      label: 'cimprd',
      baseBlock: 'block13',
      tooltip: 'Reread1',
    },
    {
      label: 'cimprd',
      baseBlock: 'block14',
      tooltip: 'Reread2',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="Reread模块 - 步骤 9/11"
        stepNumber={9}
        totalSteps={steps.length}
        description={steps[8]}
        previousPath="/add-cases/nbi-heating"
        nextPath="/add-cases/baldur-control"
      />

      <StaticParamCard
        title="Reread参数配置"
        description="配置多个阶段的参数重读时间和时间步长控制"
      >
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="杂质参数重配置"
        description="配置不同reread阶段的杂质参数"
      >
        <IndexValueInput indexValueInfo={indexValueInfo} />
      </StaticParamCard>
    </div>
  );
};

export default RereadPage;
