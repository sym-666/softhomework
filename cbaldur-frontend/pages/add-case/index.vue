<template>
  <div class="w-[100%] h-[90vh] flex justify-around items-center">
      <UCard v-for="event in events"  class=" w-3/12 h-[40%] bg-indigo-100 flex justify-center transition-all items-center hover:bg-indigo-200 hover:cursor-pointer">
        <NuxtLink :to="event.to">
          <div class="text-3xl  w-[100%] h-[100%] flex justify-center items-center">
            {{event.text}}
          </div>
        </NuxtLink>
      </UCard>
  </div>
</template>

<script lang="ts" setup>
const events = [
  {
    text:"逐步输入",
    to:"/add-case/base"
  },
  {
    text:"从JSON输入",
    to:"/add-case/json"
  },
  {
    text:"从Namelist创建",
    to:"/add-case/namelist"
  }
]
</script>
