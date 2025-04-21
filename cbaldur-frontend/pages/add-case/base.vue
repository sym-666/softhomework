<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="0"
        size="sm"
        :max="[
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
          '请填写或者检查生成的JSON！'
          ]"
      />
      <div class="w-[100%] flex mt-3 justify-between">
        <UButton to="/add-case">开始</UButton>
        <UButton to="/add-case/impurity">下一项</UButton>
      </div>
    </UCard>
  </div>
  <div class="grid grid-cols-4 gap-4 pr-4">
    <AddCaseBaseInput :dataInfo="dataInfo"></AddCaseBaseInput>
  </div>

</template>

<script lang="ts" setup>
const input = useInput()
const dataInfo = [
    {
      label:'nlextr',
      type:'bool',
      tooltip:'true(false): turn on(off) extrapolation method',
      baseBlock: "block1",
    },
    {
      label:'nlomt2(13)',
      type:'bool',
      tooltip:'true(false): (not) skip sbrtn cmpres',
      baseBlock: "block1",
    },
    {
      label:'nlomt2(21)',
      type:'bool',
      tooltip:'true(false): (not) skip sbrtn cmpres',
      baseBlock: "block1",
    },
    {
      label:'nlomt2(26)',
      type:'bool',
      tooltip:'true(false): (not) skip sbrtn pwso_update ',
      baseBlock: "block1",
    },
    {
      label:'nrun',
      type:'number',
      tooltip:'maximum number of time steps',
      baseBlock: "block1",
    },
    {
      label:'leqtyp',
      type:'number',
      tooltip:' etermines which equilibrium package is to be used leqtyp = 11 for equilbirum flux surfaces computed with the fixed boundary moments code VMEC from S. P. Hirshman ',
      baseBlock: "block1",
    },
    {
      label:'nsedit',
      type:'number',
      tooltip:'short printout frequency',
      baseBlock: "block1",
    },
    {
      label:'reread',
      type:'number',
      tooltip:' time [sec] to reread namelist ',
      baseBlock: "block1",
      step:0.1
    },
    {
      label:'thetap',
      type:'number',
      tooltip:'degree of implicitness for iteration in predictor—corrector scheme',
      baseBlock: "block1",
      step:0.1
    },
    {
      tooltip: "control plot frequency with splot below",
      label: "nplot",
      type: "number",
      baseBlock: "block1",
      step: 1
    },
    {
      tooltip: "=2 computes CMEAN, C2MEAN, WEIRS, and DWEIRS in the ghost zone just outside the plasma",
      label: "limprd(32)",
      type: "number",
      baseBlock: "block1",
      step: 1
    },
    {
      tooltip: "maximum allowed relative extrapolated error in any zone when extrapolation is used",
      label: "errmax",
      type: "number",
      baseBlock: "block1",
      step: 0.01
    },
    {
      tooltip: "ORDER OF BINOMIAL FILTER, smoothing can be bypassed by setting korder < 0",
      label: "lsmord",
      type: "number",
      baseBlock: "block1",
      step: 1
    },
    {
      tooltip: "maximum relative change allowed in any zone over one time step without reducing the time step",
      label: "delmax",
      type: "number",
      baseBlock: "block1",
      step: 0.01
    },
    {
      tooltip: "smooth on fast ion densities if lnumer(31)>0",
      label: "lnumer(31)",
      type: "number",
      baseBlock: "block1",
      step: 1
    },
    {
      tooltip: "if NTRANS < 1 - all diffusion coefficients are set to zero",
      label: "ntrans",
      type: "number",
      baseBlock: "block1",
      step: 1
    },

    {
      tooltip: "degree of implicitness in Crank—Nicholson differencing schemes",
      label: "theta",
      type: "number",
      baseBlock: "block1",
      step: 0.1
    },
    {
      tooltip: "type of boundary condition",
      label: "nbound",
      type: "number",
      baseBlock: "block1",
      step: 1
    },
    {
      tooltip: "normalization for empirical model above",
      label: "rastar",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "final time (for comparison with SNAP output)",
      label: "tmax",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "generate major printout every NEDIT time steps",
      label: "nedit",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "major printout",
      label: "nskip",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "To be defined",
      label: "nrfit",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "initial timestep",
      label: "dtinit",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "timestep control (0.2 sawtooth period)",
      label: "dtmax",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "number of radial zones",
      label: "nzones",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "local alpha plasma heating model",
      label: "ntype",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "plot every splot sec",
      label: "splot",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "long printout every 5.0 sec",
      label: "sedit",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "frequency of output to terminal",
      label: "ntty",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "initial time",
      label: "tinit",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "energy per particle carried by convection",
      label: "cpvelc",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "energy per particle carried by convection",
      label: "cpvion",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "major radius to alpha scrape off",
      label: "rcwals",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "minor radius to alpha scrape off ( 1.5 * rminor )",
      label: "rdwals",
      type: "number",
      baseBlock: "block6"
    },
    {
      tooltip: "energy loss for each hydrogen ionization (1804)",
      label: "eioniz",
      type: "number",
      baseBlock: "block6"
    }]
</script>

<style>

</style>