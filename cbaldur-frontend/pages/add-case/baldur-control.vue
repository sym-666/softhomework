<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="9"
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
        <UButton to="/add-case/reread">上一项</UButton>
        <UButton to="/add-case/json">下一项</UButton>
      </div>
    </UCard>
  </div>
 <div class="grid grid-cols-4 gap-4 pr-4">
    <AddCaseBaseInput :dataInfo="dataInfo"></AddCaseBaseInput>
  </div>
  <div class="grid grid-cols-2 gap-4 pr-4 mt-4">
    <AddCaseArrayInput :arrayInfo="arrayInfo"></AddCaseArrayInput>
  </div>
  <div class="grid grid-cols-3 gap-4 pr-4 mt-4">
    <AddCaseIndexValueInput :indexValueInfo="indexValueInfo"></AddCaseIndexValueInput>
  </div>
</template>

<script lang="ts" setup>
const dataInfo=[
{
  tooltip: "minimum initial q value",
  label: "qmin",
  type: "number",
  baseBlock: "block12"
},
{
  tooltip: "number of moments specified for equilibrium boundary",
  label: "mombnd",
  type: "number",
  baseBlock: "block12"
},
{
  tooltip: "number of moments computed in equilibrium interior",
  label: "mom",
  type: "number",
  baseBlock: "block12"
},
{
  tooltip: "number of breakpoint times",
  label: "ntbkmx",
  type: "number",
  baseBlock: "block12"
},
{
  tooltip: "initial shift Raxis - Rmid",
  label: "shift",
  type: "number",
  baseBlock: "block12"
},
{
  tooltip: "number of equilibrium flux surfaces",
  label: "mflxs",
  type: "number",
  baseBlock: "block12"
},
{
  tooltip: "sawtooth time on",
  label: "swton",
  type: "number",
  baseBlock: "block12"
},
{
  tooltip: "sawtooth time off",
  label: "swtoff",
  type: "number",
  baseBlock: "block12"
}
]
const arrayInfo=[
{
  tooltip: "",
  label: "tbk(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "neqdt(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "rmajbt(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "rminbt(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "elngbt(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "trngbt(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "btort(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "rtort(1)",
  baseBlock: "block12"
},
{
  tooltip: "",
  label: "curmat(1)",
  baseBlock: "block12"
}
]
const indexValueInfo=[
  {
    tooltip: "",
    label: "lsweq",
    baseBlock: "block12"
  },
  {
    tooltip: "",
    label: "lsawth",
    baseBlock: "block12"
  },
  {
    tooltip: "",
    label: "csawth",
    baseBlock: "block12"
  },
]
</script>

<style>

</style>