<template>
  <div class="w-full grid grid-cols-5 gap-4 pr-6 h-[90vh]">
    <UCard class=" col-span-2 flex items-center h-full">

      <img src="https://s2.loli.net/2024/12/04/nCkNI1J5AmgQ9l6.png" alt="Logo">
    </UCard>
    <UCard v-if="cases" class=" col-span-2">
      <template #header>
        算例
      </template>
      <div id="case-container"></div>
      目前已运行算例{{ cases.data.value.length }}个
    </UCard>
    <UCard>
      <template #header>
        通知
      </template>
      
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import  { Chart } from '@antv/g2';

const cases = await useMyFetch('/api/Case/GetCases',{method:'GET'})
const padZero = (num:number) => (num < 10 ? `0${num}` : num);
onMounted(()=>{
  const result:any = {}
  cases.data.value.forEach((item:any)=>{
    const date = new Date(item.createdAt);
    const dateStr = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
    if (!result[dateStr]) {
      result[dateStr] = 0;
    }
    result[dateStr]++;
  })
  ;
  const chart = new Chart({
    container: 'case-container',
    autoFit: true
  });
  const data = Object.keys(result).map((key) => ({ time: key, count: result[key] })).sort((a,b)=>new Date(a.time).getTime()-new Date(b.time).getTime())
  console.log(data)
  chart.data(data)

  chart
    .area()
    .encode('x', 'time')
    .encode('y', 'count')
    .style('opacity', 0.2)
    .axis('y', { labelFormatter: '~s', title: false });

  chart.line().encode('x', 'time').encode('y', 'count').encode('shape', 'line'); 
  chart.render()
})
</script>

<style>

</style>