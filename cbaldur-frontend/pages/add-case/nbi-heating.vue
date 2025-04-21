<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="7"
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
        <UButton to="/add-case/gas-puffing-and-pellet-inject">上一项</UButton>
        <UButton to="/add-case/reread">下一项</UButton>
      </div>
    </UCard>
  </div>
  <div class="grid grid-cols-4 gap-4 pr-4">
    <AddCaseBaseInput :dataInfo="dataInfo"></AddCaseBaseInput>
  </div>
  <div class="grid grid-cols-2 gap-4 pr-4">
    <AddCaseArrayInput :arrayInfo="arrayInfo"></AddCaseArrayInput>
  </div>
</template>

<script lang="ts" setup>
const dataInfo=[
{
  tooltip: "beam driven current",
  label: "cjbeam",
  type: "number",
  baseBlock: "block10"
},
{
  tooltip: "max frac chnge in ne befor recomp beam",
  label: "hnchek",
  type: "number",
  baseBlock: "block10"
},
{
  tooltip: "max frac chnge in te befor recomp beam",
  label: "htchek",
  type: "number",
  baseBlock: "block10"
},
{
  tooltip: "number of Monte Carlo particles used",
  label: "nipart",
  type: "number",
  baseBlock: "block10"
},
{
  tooltip: "max number of steps between beam comp",
  label: "niprof",
  type: "number",
  baseBlock: "block10"
}
]
const arrayInfo=[
  {
  tooltip: "",
  label: "hton(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "htoff(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hangle(3,:)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hrmaj(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hrmin(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "haper(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "haperv(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hdiv(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hwidth(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hfutz(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "height(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hfocl(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hfoclv(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hlenth(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "nhaper(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "nhshap(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hebeam(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hpowmw(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "nhbeam(1)",
  baseBlock: "block10"
  },
  {
  tooltip: "",
  label: "hfract(1,1)",
  baseBlock: "block10"
  }
]
</script>

<style>

</style>