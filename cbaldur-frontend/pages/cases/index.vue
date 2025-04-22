<template>
  <div class="w-full pr-6">
    <div class="w-full flex flex-col justify-between min-h-[90vh] max-h-[90vh] pb-4 overflow-hidden bg-white rounded-2xl">
      <UTable v-if="data" :columns="columns" :rows="rows">
        <template #status-data = {row}>
          <UBadge color="gray" v-if="row.status=='running'">Running</UBadge>
          <UBadge color="violet" v-else-if="row.status=='success'">Success</UBadge>
          <UBadge color="rose" v-else> Error </UBadge>
        </template>
        <template #action-data = {row}>
          <UButton v-if="row.caseJsonPrototype!==null" color="gray" class="mr-2" v-on:click="()=>newWith(row.jsonOrNamelist,row.jsonOrNamelist?row.id:row.caseJsonPrototype)">以此为模板新建</UButton>
          <UButton v-else color="gray" class="mr-2" disabled>以此为模板新建</UButton>
          <UButton v-if="row.status=='success'" v-on:click="()=>navigateTo(`/cases/${row.userId}/${row.id}`)">详细信息</UButton>
          <UButton v-else-if="row.status=='running'" disabled>详细信息</UButton>
        </template>
        <template #tags-data = {row}>
          <UBadge v-if="row.tags" v-for="tag in row.tags.split(',')" :key="tag" variant="subtle" class="mr-1">{{ tag }}</UBadge>
        </template>
      </UTable>
      <div class="w-full px-10 flex justify-between">
        <div>每页显示{{ pageCount }},共{{ data.length }}项</div>
        <UPagination v-model="page" :page-count="pageCount" :total="data.length" />
      </div>
      
    </div>
  </div>
</template>

<script lang="ts" setup>

const input = useInput()

const {data}:{data:any} = await useMyFetch('/api/Case/GetCases',{
  method:'GET'
})
const page = ref(1)
const pageCount = 8

const rows = computed(() => {
  return data.value.map((item: any) => ({
    ...item,
    runTime: ((new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()) / 1000).toFixed(3),
    createdAt: formatDate(item.createdAt)
  })).slice((page.value - 1) * pageCount, (page.value) * pageCount)
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const columns = [
  {
    key:"id",
    label:"ID",
    sortable:true,
    direction: 'desc' as const
  },
  {
    key:"status",
    label:"状态"
  },
  {
    key:"createdAt",
    label:"创建时间"
  },
  {
    key:"runTime",
    label:"运行时间(秒)"
  },
  {
    key:"tags",
    label:"标签"
  },
  {
    key:"action",
  }

]
const newWith=(jsonOrNamelist:boolean,jsonProtypeOrNamelistPrototype:string)=>{
  if(jsonOrNamelist){
    input.value = JSON.parse(jsonProtypeOrNamelistPrototype)
    navigateTo('/add-case/namelist?caseId='+jsonProtypeOrNamelistPrototype)
  }else{
    input.value = JSON.parse(jsonProtypeOrNamelistPrototype)
    navigateTo('/add-case/base')
  }
}
</script>

<style>

</style>