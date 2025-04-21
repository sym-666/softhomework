<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="1"
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
        <UButton to="/add-case/base">上一项</UButton>
        <UButton to="/add-case/transport">下一项</UButton>
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
const input = useInput()
const dataInfo = [
  {
    tooltip: "non-equilibrium impurity radiation model",
    label: "natomc",
    type: "number",
    baseBlock: "block3",
    step: 1
  },
  {
    tooltip: "z effective",
    label: "extzef",
    type: "number",
    baseBlock: "block3",
    step: 0.1
  },
  {
    tooltip: "ne/ni dilution factor",
    label: "extf",
    type: "number",
    baseBlock: "block3",
    step: 1
  },
  {
    tooltip: "recycling off wall",
    label: "grecyc",
    type: "number",
    baseBlock: "block3",
    step: 0.01
  },
  {
    tooltip: "recycling off wall",
    label: "ngprof",
    type: "number",
    baseBlock: "block3",
    step: 1
  },
  {
    tooltip: "recycling off wall",
    label: "ngpart",
    type: "number",
    baseBlock: "block3",
    step: 1
  },
  {
    tooltip: "recycling factor for diffusive losses to the wall",
    label: "recflx",
    type: "number",
    baseBlock: "block11"
  },
  {
    tooltip: "recycling factor for scrape-off losses",
    label: "recscr",
    type: "number",
    baseBlock: "block11"
  },
  {
    tooltip: "print local and vol rad power, electron cooling rate",
    label: "nwcool",
    type: "number",
    baseBlock: "block11"
  },
  {
    tooltip: "print local and vol rad power, line radiation",
    label: "nwline",
    type: "number",
    baseBlock: "block11"
  },
  {
    tooltip: "ionization losses",
    label: "nwioni",
    type: "number",
    baseBlock: "block11"
  },
  {
    tooltip: "recombination radiation",
    label: "nwreko",
    type: "number",
    baseBlock: "block11"
  },
  {
    tooltip: "charge exchange radiation",
    label: "nwchex",
    type: "number",
    baseBlock: "block11"
  },
  {
    tooltip: "bremsstrahlung radiation",
    label: "nwbrem",
    type: "number",
    baseBlock: "block11"
  }]
const indexValueInfo = [
  {
    label:"cimprd",
    baseBlock:"block3"
  },
  {
    label:"xfutz",
    baseBlock:"block3"
  }
]
</script>

<style>

</style>