<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="2"
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
        <UButton to="/add-case/impurity">上一项</UButton>
        <UButton to="/add-case/transport-model">下一项</UButton>
      </div>
    </UCard>
  </div>
  <div class="w-[100%] pr-4">
    <AddCaseIndexValueInput :indexValueInfo="indexValueInfo" size="large"></AddCaseIndexValueInput>
  </div>
</template>

<script lang="ts" setup>
const indexValueInfo=[{
  label:"cfutz",
  baseBlock:"block2"
}]
</script>

<style>

</style>