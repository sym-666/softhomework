import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';
import ArrayInput, {
  type ArrayInfoItem,
} from '@/components/add-cases/ArrayInput';

const NBIHeatingPage: React.FC = () => {
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
      tooltip: 'beam driven current',
      label: 'cjbeam',
      type: 'number',
      baseBlock: 'block10',
    },
    {
      tooltip: 'max frac chnge in ne befor recomp beam',
      label: 'hnchek',
      type: 'number',
      baseBlock: 'block10',
    },
    {
      tooltip: 'max frac chnge in te befor recomp beam',
      label: 'htchek',
      type: 'number',
      baseBlock: 'block10',
    },
    {
      tooltip: 'number of particles in beam Monte Carlo',
      label: 'nipart',
      type: 'number',
      baseBlock: 'block10',
    },
    {
      tooltip: 'number of beam profiles saved',
      label: 'niprof',
      type: 'number',
      baseBlock: 'block10',
    },
  ];

  const arrayInfo: ArrayInfoItem[] = [
    { tooltip: '', label: 'hton(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'htoff(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hangle(3,:)', baseBlock: 'block10' },
    { tooltip: '', label: 'hrmaj(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hrmin(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'haper(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'haperv(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hdiv(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hdivv(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hwidth(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'height(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hfocl(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hfoclv(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hlenth(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'nhaper(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'nhshap(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hebeam(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hfract(1,1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hpowmw(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'nhbeam(1)', baseBlock: 'block10' },
    { tooltip: '', label: 'hfutz(1)', baseBlock: 'block10' },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="NBI Heating模块 - 步骤 8/11"
        stepNumber={8}
        totalSteps={steps.length}
        description={steps[7]}
        previousPath="/add-cases/gas-puffing-and-pellet-inject"
        nextPath="/add-cases/reread"
      />

      <StaticParamCard
        title="基础参数"
        description="配置中性束注入加热相关的基础参数"
      >
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="束流参数数组"
        description="配置束流几何、功率、角度等详细参数"
      >
        <ArrayInput arrayInfo={arrayInfo} />
      </StaticParamCard>
    </div>
  );
};

export default NBIHeatingPage;
