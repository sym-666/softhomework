<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="3"
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
        <UButton to="/add-case/transport">上一项</UButton>
        <UButton to="/add-case/initialization">下一项</UButton>
      </div>
    </UCard>
  </div>
  <div class="grid grid-cols-4 gap-4 pr-4">
    <AddCaseBaseInput :dataInfo="dataInfo"></AddCaseBaseInput>
  </div>
  <div class="grid grid-cols-2 gap-4 pr-4">
    <AddCaseArrayInput :arrayInfo="arrayInfo"></AddCaseArrayInput>
  </div>
  <div class="grid grid-cols-3 gap-4 pr-4 mt-4">
    <AddCaseIndexValueInput :indexValueInfo="indexValueInfo"></AddCaseIndexValueInput>
  </div>
</template>

<script lang="ts" setup>
const dataInfo= [
  {
    tooltip: "electron-ion energy interchange coefficient",
    label: "fdrint",
    type: "number",
    baseBlock: "block4",
    step: 1
  }
]

const arrayInfo = [
{
  tooltip: "",
  label: "fdr",
  baseBlock: "block4"
},
{
  tooltip: "",
  label: "fig",
  baseBlock: "block4"
},
{
  tooltip: "",
  label: "fec",
  baseBlock: "block4"
},
{
  tooltip: "",
  label: "fkb",
  baseBlock: "block4"
},
{
  tooltip: "",
  label: "frb",
  baseBlock: "block4"
},
{
  tooltip: "",
  label: "fmh",
  baseBlock: "block4"
}
]

const indexValueInfo = [
  {
    label:"cthery",
    baseBlock:"block4"
  },
  {
    label:"lthery",
    baseBlock:"block4"
  },
  {
    label:"ltrnsp",
    baseBlock:"block4"
  }
]
</script>

<style>

</style>