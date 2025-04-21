<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="6"
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
        <UButton to="/add-case/boundary">上一项</UButton>
        <UButton to="/add-case/nbi-heating">下一项</UButton>
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
const dataInfo= [ 
{
  tooltip: "gas puffing parameters, monitor line average density",
  label: "npuff",
  type: "number",
  baseBlock: "block9"
},
{
  tooltip: "milora-foster pellet model ornl-tm-5776",
  label: "npel2",
  type: "number",
  baseBlock: "block9"
}
]

const arrayInfo = [
{ tooltip: "", label: "gflmax", baseBlock: "block9" },
{ tooltip: "", label: "denmon", baseBlock: "block9" },
{ tooltip: "", label: "gfract", baseBlock: "block9" },
{ tooltip: "", label: "timp", baseBlock: "block9" },
{ tooltip: "", label: "flimp(1,:)", baseBlock: "block9" },
{ tooltip: "", label: "ftzeff", baseBlock: "block9" },
{ tooltip: "", label: "rpa(1)", baseBlock: "block9" },
{ tooltip: "", label: "ypa(1)", baseBlock: "block9" },
{ tooltip: "", label: "tpela(1)", baseBlock: "block9" },
{ tooltip: "", label: "vpela(1)", baseBlock: "block9" },
{ tooltip: "", label: "rpela(1)", baseBlock: "block9" },
{ tooltip: "", label: "npelga(1)", baseBlock: "block9" }
]
</script>

<style>

</style>