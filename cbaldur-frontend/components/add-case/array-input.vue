<template>
 <div v-for="item in arrayInfo" class="flex mt-4">
      <div class=" flex items-center justify-center w-1/6">
      <UTooltip v-if="item.tooltip" class=" z-[51]" :text="item.tooltip">
        {{ item.label }}
      </UTooltip>
      <span v-else>
        {{ item.label }}
      </span>
      
    </div>
    <div class=" flex items-center justify-center w-5/6">
     <UInput v-if="input[item.baseBlock][item.label].length<=6" class="w-[100%]"  :modelValue="input[item.baseBlock][item.label].map((i)=>{
        if(i >=1e5) return i.toExponential()
        return i.toString()
     }).join()" @change="(value)=>{
      input[item.baseBlock][item.label] = value.split(',').map(i=>{
        return Number(i)
      })
     }"></UInput>
     <UTextarea v-else class="w-[100%]"  :modelValue="input[item.baseBlock][item.label].map((i)=>{
        if(i >=1e5) return i.toExponential()
        return i.toString()
     }).join()" @change="(value)=>{
      input[item.baseBlock][item.label] = value.split(',').map(i=>{
        return Number(i)
      })
     }"></UTextarea>
    </div>
  </div>
</template>

<script  setup>
const input = useInput()
defineProps(['arrayInfo'])
</script>

<style>

</style>