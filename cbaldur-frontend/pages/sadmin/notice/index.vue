<template>
  <div class="w-full flex flex-col pr-6">
    <UCard>
      <template #header>
        <div class="w-full flex justify-between items-center">
          <h2 class="font-bold text-xl">公告列表</h2>
          <UButton variant="outline" @click="navigateTo('/sadmin/notice/create')" >新增公告</UButton>
        </div>

      </template>
      <UTable :rows="notices.data.value" :columns="columns">
        <template #isActive-data="{row}">
          <UBadge v-if="row.isActive">激活</UBadge>
          <UBadge v-else variant="outline">未激活</UBadge>
        </template>
        <template #action-data="{row}">
          <UButton variant="outline">删除</UButton>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const notices = await useMyFetch('/api/Notice/GetNotices',{method:'GET'}) as any
const columns =[
  {
    key:'id',
    label:'ID'
  },
  {
    key:'title',
    label:'标题'
  },
  {
    key:'createdAt',
    label:'创建时间'
  },
  {
    key:'updatedAt',
    label:'更新时间'
  },
  {
    key:'isActive',
    label:'状态'
  },
  {
    key:'action',
    label:'操作'
  }
]
</script>

<style>

</style>