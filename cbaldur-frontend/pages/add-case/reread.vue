<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="8"
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
        <UButton to="/add-case/nbi-heating">上一项</UButton>
        <UButton to="/add-case/baldur-control">下一项</UButton>
      </div>
    </UCard>
  </div>
  <div class="grid grid-cols-4 gap-4 pr-4">
    <AddCaseBaseInput :dataInfo="dataInfo"></AddCaseBaseInput>
  </div>
  <div class="grid grid-cols-2 gap-4 pr-4 mt-4">
    <AddCaseIndexValueInput :indexValueInfo="indexValueInfo"></AddCaseIndexValueInput>
  </div>
</template>

<script lang="ts" setup>
const dataInfo=[
  {
  tooltip: "Reread1 time [sec] to reread namelist",
  label: "reread",
  type: "number",
  baseBlock: "block13"
  },
  {
  tooltip: "Reread2. time [sec] to reread namelist",
  label: "reread",
  type: "number",
  baseBlock: "block14"
  },
  {
  tooltip: "Reread2. maximum allowed time step",
  label: "dtmax",
  type: "number",
  baseBlock: "block14"
  },
  {
  tooltip: "Reread3. maximum allowed time step",
  label: "dtmax",
  type: "number",
  baseBlock: "block15"
  },
  {
  tooltip: "Reread3. time [sec] to reread namelist",
  label: "reread",
  type: "number",
  baseBlock: "block15"
  },
  {
  tooltip: "Reread4.maximum allowed time step",
  label: "dtmax",
  type: "number",
  baseBlock: "block16"
  }]
  const indexValueInfo=[
  {
    label:"cimprd",
    baseBlock:"block13",
    tooltip:"Reread1"
  },
  {
    label:"cimprd",
    baseBlock:"block14",
    tooltip:"Reread2"
  }
  ]
</script>

<style>

</style>