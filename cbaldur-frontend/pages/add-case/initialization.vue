<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="4"
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
        <UButton to="/add-case/transport-model">上一项</UButton>
        <UButton to="/add-case/boundary">下一项</UButton>
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
    tooltip: "major radius in cm",
    label: "rmajor",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "minor radius in cm",
    label: "rminor",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "current in kA",
    label: "curent",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "toroidal field in Gauss",
    label: "bz",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "initial ti(r) parabola^etifit",
    label: "ti0",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "initial te(r) parabola^etefit",
    label: "te0",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "initial ti(r) parabola^etifit",
    label: "ti1",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "initial te(r) parabola^etefit",
    label: "te1",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "initial ti(r) parabola^etifit",
    label: "etifit",
    type: "number",
    baseBlock: "block7"
  },
  {
    tooltip: "initial te(r) parabola^etefit",
    label: "etefit",
    type: "number",
    baseBlock: "block7"
  }
]
const arrayInfo = [
{
  tooltip: "",
  label: "ngas",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "denga0",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "denga1",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "denim0",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "denim1",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "nimp",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "ehfit",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "eifit",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "eehfit",
  baseBlock: "block7"
},
{
  tooltip: "",
  label: "eeifit",
  baseBlock: "block7"
}
]
</script>

<style>

</style>