import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';
import ArrayInput, {
  type ArrayInfoItem,
} from '@/components/add-cases/ArrayInput';

const GasPuffingAndPelletInjectPage: React.FC = () => {
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
      tooltip: 'gas puffing parameters, monitor line average density',
      label: 'npuff',
      type: 'number',
      baseBlock: 'block9',
    },
    {
      tooltip: 'milora-foster pellet model ornl-tm-5776',
      label: 'npel2',
      type: 'number',
      baseBlock: 'block9',
    },
  ];

  const arrayInfo: ArrayInfoItem[] = [
    { tooltip: '', label: 'gflmax', baseBlock: 'block9' },
    { tooltip: '', label: 'denmon', baseBlock: 'block9' },
    { tooltip: '', label: 'gfract', baseBlock: 'block9' },
    { tooltip: '', label: 'timp', baseBlock: 'block9' },
    { tooltip: '', label: 'flimp(1,:)', baseBlock: 'block9' },
    { tooltip: '', label: 'ftzeff', baseBlock: 'block9' },
    { tooltip: '', label: 'rpa(1)', baseBlock: 'block9' },
    { tooltip: '', label: 'ypa(1)', baseBlock: 'block9' },
    { tooltip: '', label: 'tpela(1)', baseBlock: 'block9' },
    { tooltip: '', label: 'vpela(1)', baseBlock: 'block9' },
    { tooltip: '', label: 'rpela(1)', baseBlock: 'block9' },
    { tooltip: '', label: 'npelga(1)', baseBlock: 'block9' },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="Gas Puffing and Pellet Injection模块 - 步骤 7/11"
        stepNumber={7}
        totalSteps={steps.length}
        description={steps[6]}
        previousPath="/add-cases/boundary"
        nextPath="/add-cases/nbi-heating"
      />

      <StaticParamCard
        title="基础参数"
        description="配置气体喷入和弹丸注入相关的基础参数"
      >
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard
        title="数组参数"
        description="配置气体流量、密度监控、弹丸参数等数组"
      >
        <ArrayInput arrayInfo={arrayInfo} />
      </StaticParamCard>
    </div>
  );
};

export default GasPuffingAndPelletInjectPage;
