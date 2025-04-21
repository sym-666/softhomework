<template>
  <div v-for="item in dataInfo" class="flex">
    <div class=" flex items-center justify-center w-3/12">
      <UTooltip v-if="item.tooltip" class=" z-[51]" :text="item.tooltip">
        {{ item.label }}
      </UTooltip>
      <span v-else>
        {{ item.label }}
      </span>
      
    </div>
    <div class=" flex items-center justify-center w-9/12">
      <UToggle v-if="item.type==='bool'" v-model="input[item.baseBlock][item.label]"/>
      <UInput v-else-if="item.type==='number'" :step="item.step?item.step:1" v-model="input[item.baseBlock][item.label]" type="number"></UInput>
    </div>
  </div>
</template>

<script  setup>
const input = useInput()
defineProps(['dataInfo'])
</script>

<style>

</style>