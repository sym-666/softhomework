import React from 'react';
import { StaticCaseHeader } from '@/components/add-cases/StaticCaseHeader';
import { StaticParamCard } from '@/components/add-cases/StaticParamCard';
import BaseInput, { type DataInfoItem } from '@/components/add-cases/BaseInput';

const BasePage: React.FC = () => {
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
      label: 'nlextr',
      type: 'bool',
      tooltip: 'true(false): turn on(off) extrapolation method',
      baseBlock: 'block1',
    },
    {
      label: 'nlomt2(13)',
      type: 'bool',
      tooltip: 'true(false): (not) skip sbrtn cmpres',
      baseBlock: 'block1',
    },
    {
      label: 'nlomt2(21)',
      type: 'bool',
      tooltip: 'true(false): (not) skip sbrtn cmpres',
      baseBlock: 'block1',
    },
    {
      label: 'nlomt2(26)',
      type: 'bool',
      tooltip: 'true(false): (not) skip sbrtn pwso_update',
      baseBlock: 'block1',
    },
    {
      label: 'nrun',
      type: 'number',
      tooltip: 'maximum number of time steps',
      baseBlock: 'block1',
    },
    {
      label: 'leqtyp',
      type: 'number',
      tooltip:
        'determines which equilibrium package is to be used leqtyp = 11 for equilibrium flux surfaces computed with the fixed boundary moments code VMEC from S. P. Hirshman',
      baseBlock: 'block1',
    },
    {
      label: 'nsedit',
      type: 'number',
      tooltip: 'short printout frequency',
      baseBlock: 'block1',
    },
    {
      label: 'reread',
      type: 'number',
      tooltip: 'time [sec] to reread namelist',
      baseBlock: 'block1',
      step: 0.1,
    },
    {
      label: 'thetap',
      type: 'number',
      tooltip:
        'degree of implicitness for iteration in predictor—corrector scheme',
      baseBlock: 'block1',
      step: 0.1,
    },
    {
      label: 'nplot',
      type: 'number',
      tooltip: 'control plot frequency with splot below',
      baseBlock: 'block1',
      step: 1,
    },
    {
      label: 'limprd(32)',
      type: 'number',
      tooltip:
        '=2 computes CMEAN, C2MEAN, WEIRS, and DWEIRS in the ghost zone just outside the plasma',
      baseBlock: 'block1',
      step: 1,
    },
    {
      label: 'errmax',
      type: 'number',
      tooltip:
        'maximum allowed relative extrapolated error in any zone when extrapolation is used',
      baseBlock: 'block1',
      step: 0.01,
    },
    {
      label: 'lsmord',
      type: 'number',
      tooltip:
        'ORDER OF BINOMIAL FILTER, smoothing can be bypassed by setting korder < 0',
      baseBlock: 'block1',
      step: 1,
    },
    {
      label: 'delmax',
      type: 'number',
      tooltip:
        'maximum relative change allowed in any zone over one time step without reducing the time step',
      baseBlock: 'block1',
      step: 0.01,
    },
    {
      label: 'lnumer(31)',
      type: 'number',
      tooltip: 'smooth on fast ion densities if lnumer(31)>0',
      baseBlock: 'block1',
      step: 1,
    },
    {
      label: 'ntrans',
      type: 'number',
      tooltip: 'if NTRANS < 1 - all diffusion coefficients are set to zero',
      baseBlock: 'block1',
      step: 1,
    },
    {
      label: 'theta',
      type: 'number',
      tooltip: 'degree of implicitness in Crank—Nicholson differencing schemes',
      baseBlock: 'block1',
      step: 0.1,
    },
    {
      label: 'nbound',
      type: 'number',
      tooltip: 'type of boundary condition',
      baseBlock: 'block1',
      step: 1,
    },
    {
      label: 'rastar',
      type: 'number',
      tooltip: 'normalization for empirical model above',
      baseBlock: 'block6',
    },
    {
      label: 'tmax',
      type: 'number',
      tooltip: 'final time (for comparison with SNAP output)',
      baseBlock: 'block6',
    },
    {
      label: 'nedit',
      type: 'number',
      tooltip: 'generate major printout every NEDIT time steps',
      baseBlock: 'block6',
    },
    {
      label: 'nskip',
      type: 'number',
      tooltip: 'major printout',
      baseBlock: 'block6',
    },
    {
      label: 'nrfit',
      type: 'number',
      tooltip: 'To be defined',
      baseBlock: 'block6',
    },
    {
      label: 'dtinit',
      type: 'number',
      tooltip: 'initial timestep',
      baseBlock: 'block6',
    },
    {
      label: 'dtmax',
      type: 'number',
      tooltip: 'timestep control (0.2 sawtooth period)',
      baseBlock: 'block6',
    },
    {
      label: 'nzones',
      type: 'number',
      tooltip: 'number of radial zones',
      baseBlock: 'block6',
    },
    {
      label: 'ntype',
      type: 'number',
      tooltip: 'local alpha plasma heating model',
      baseBlock: 'block6',
    },
    {
      label: 'splot',
      type: 'number',
      tooltip: 'plot every splot sec',
      baseBlock: 'block6',
    },
    {
      label: 'sedit',
      type: 'number',
      tooltip: 'long printout every 5.0 sec',
      baseBlock: 'block6',
    },
    {
      label: 'ntty',
      type: 'number',
      tooltip: 'frequency of output to terminal',
      baseBlock: 'block6',
    },
    {
      label: 'tinit',
      type: 'number',
      tooltip: 'initial time',
      baseBlock: 'block6',
    },
    {
      label: 'cpvelc',
      type: 'number',
      tooltip: 'energy per particle carried by convection',
      baseBlock: 'block6',
    },
    {
      label: 'cpvion',
      type: 'number',
      tooltip: 'energy per particle carried by convection',
      baseBlock: 'block6',
    },
    {
      label: 'rcwals',
      type: 'number',
      tooltip: 'major radius to alpha scrape off',
      baseBlock: 'block6',
    },
    {
      label: 'rdwals',
      type: 'number',
      tooltip: 'minor radius to alpha scrape off ( 1.5 * rminor )',
      baseBlock: 'block6',
    },
    {
      label: 'eioniz',
      type: 'number',
      tooltip: 'energy loss for each hydrogen ionization (1804)',
      baseBlock: 'block6',
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      <StaticCaseHeader
        title="Basic模块 - 步骤 1/11"
        stepNumber={1}
        totalSteps={steps.length}
        description={steps[0]}
        previousPath="/add-cases"
        nextPath="/add-cases/impurity"
      />

      <StaticParamCard title="参数配置">
        <BaseInput dataInfo={dataInfo} />
      </StaticParamCard>
    </div>
  );
};

export default BasePage;
