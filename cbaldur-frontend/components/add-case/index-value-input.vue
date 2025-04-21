<template>
  <div v-if="size==='large'" v-for="item in indexValueInfo" >
    <div  class="grid grid-cols-12 gap-2 w-[100%]">
    <div class=" col-span-10 flex justify-center items-center">
      <UTooltip
        :text="item.tooltip"
      >
      {{ item.label }}
    </UTooltip>
      
    </div>
    <div class=" col-span-2">
      <UButton class="w-[75%] flex justify-center" @click="()=>addPair(item)">新建</UButton>
    </div>
    <template v-for="(_, i) in input[item.baseBlock][item.label]['index']">
      <div class="col-span-1">
        <UInput
          v-model="input[item.baseBlock][item.label]['index'][i]"
          type="number"/>
      </div>
      <div class="col-span-1">
        <UInput
          v-model="input[item.baseBlock][item.label]['values'][i]"
          type="number"/>
      </div>
      <div class="col-span-1">
        <UButton @click="()=>removePair(i,item)">删除</UButton>
      </div>
    </template>
  </div>
  </div>
  
  <div v-else v-for="item in indexValueInfo">
    <div    class="grid grid-cols-8 gap-2 w-[100%]">
    <div class="col-span-6 flex justify-center items-center">
      <UTooltip
        :text="item.tooltip"
      >
      {{ item.label }}
    </UTooltip>
      
    </div>
    <div class=" col-span-2">
      <UButton @click="()=>addPair(item)">新建</UButton>
    </div>
    <template v-for="(_, i) in input[item.baseBlock][item.label]['index']">
      <div class="col-span-3">
        <UInput
          v-model="input[item.baseBlock][item.label]['index'][i]"
          type="number"/>
      </div>
      <div class="col-span-3">
        <UInput
          v-model="input[item.baseBlock][item.label]['values'][i]"
          type="number"/>
      </div>
      <div class="col-span-2">
        <UButton @click="()=>removePair(i,item)">删除</UButton>
      </div>
    </template>
  </div>
  </div>

 
</template>


<script setup>
const input = useInput()
defineProps(['indexValueInfo',"size"])
const addPair = (item) => {
  input.value[item.baseBlock][item.label]['index'].push(null);
  input.value[item.baseBlock][item.label]['values'].push(null);
};

const removePair = (index,item) => {
  input.value[item.baseBlock][item.label]['index'].splice(index, 1);
  input.value[item.baseBlock][item.label]['values'].splice(index, 1);
};
</script>

<style>

</style>