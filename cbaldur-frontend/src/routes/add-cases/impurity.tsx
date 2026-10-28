import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';
import IndexValueInput, {
  type IndexValueInfoItem,
} from '@/components/add-cases/IndexValueInput';

const ImpurityPage: React.FC = () => {
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
      tooltip: 'non-equilibrium impurity radiation model',
      label: 'natomc',
      type: 'number',
      baseBlock: 'block3',
      step: 1,
    },
    {
      tooltip: 'z effective',
      label: 'extzef',
      type: 'number',
      baseBlock: 'block3',
      step: 0.1,
    },
    {
      tooltip: 'ne/ni dilution factor',
      label: 'extf',
      type: 'number',
      baseBlock: 'block3',
      step: 1,
    },
    {
      tooltip: 'recycling off wall',
      label: 'grecyc',
      type: 'number',
      baseBlock: 'block3',
      step: 0.01,
    },
    {
      tooltip: 'recycling off wall',
      label: 'ngprof',
      type: 'number',
      baseBlock: 'block3',
      step: 1,
    },
    {
      tooltip: 'recycling off wall',
      label: 'ngpart',
      type: 'number',
      baseBlock: 'block3',
      step: 1,
    },
    {
      tooltip: 'recycling factor for diffusive losses to the wall',
      label: 'recflx',
      type: 'number',
      baseBlock: 'block11',
    },
    {
      tooltip: 'recycling factor for scrape-off losses',
      label: 'recscr',
      type: 'number',
      baseBlock: 'block11',
    },
    {
      tooltip: 'print local and vol rad power, electron cooling rate',
      label: 'nwcool',
      type: 'number',
      baseBlock: 'block11',
    },
    {
      tooltip: 'print local and vol rad power, line radiation',
      label: 'nwline',
      type: 'number',
      baseBlock: 'block11',
    },
    {
      tooltip: 'ionization losses',
      label: 'nwioni',
      type: 'number',
      baseBlock: 'block11',
    },
    {
      tooltip: 'recombination radiation',
      label: 'nwreko',
      type: 'number',
      baseBlock: 'block11',
    },
    {
      tooltip: 'charge exchange radiation',
      label: 'nwchex',
      type: 'number',
      baseBlock: 'block11',
    },
    {
      tooltip: 'bremsstrahlung radiation',
      label: 'nwbrem',
      type: 'number',
      baseBlock: 'block11',
    },
  ];

  const indexValueInfo: IndexValueInfoItem[] = [
    {
      label: 'cimprd',
      baseBlock: 'block3',
    },
    {
      label: 'xfutz',
      baseBlock: 'block3',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="Impurity模块 - 步骤 2/11"
        stepNumber={2}
        totalSteps={steps.length}
        description={steps[1]}
        previousPath="/add-cases/base"
        nextPath="/add-cases/transport"
      />

      <StaticParamCard title="基础参数配置">
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>

      <StaticParamCard title="索引-值对配置">
        <IndexValueInput indexValueInfo={indexValueInfo} />
      </StaticParamCard>
    </div>
  );
};

export default ImpurityPage;
