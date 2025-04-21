<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="5"
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
        <UButton to="/add-case/initialization">上一项</UButton>
        <UButton to="/add-case/gas-puffing-and-pellet-inject">下一项</UButton>
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
    tooltip: "energy of gas puffed neutrals [keV]",
    label: "tcoldp",
    type: "number",
    baseBlock: "block8"
  },
  {
    tooltip: "temperature of recycled neutral hydrogen",
    label: "tcold",
    type: "number",
    baseBlock: "block8"
  }]
const arrayInfo=[
  {
    tooltip: "",
    label: "bdhyde(1,1)",
    baseBlock: "block8"
  },
  {
    tooltip: "",
    label: "bdhyde(1,2)",
    baseBlock: "block8"
  },
  {
    tooltip: "",
    label: "bdimpe(1,1)",
    baseBlock: "block8"
  },
  {
    tooltip: "",
    label: "bdimpe(1,2)",
    baseBlock: "block8"
  },
  {
    tooltip: "",
    label: "bdtime",
    baseBlock: "block8"
  },
  {
    tooltip: "",
    label: "bdtee",
    baseBlock: "block8"
  },
  {
    tooltip: "",
    label: "bdtie",
    baseBlock: "block8"
  },
  {
    tooltip: "",
    label: "flgas",
    baseBlock: "block8"
  }]
</script>

<style>

</style>