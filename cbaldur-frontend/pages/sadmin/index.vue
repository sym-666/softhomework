<template>
<UModal v-model="createOrganizationState">
  <UCard>
    <template #header>
      <div class="text-xl font-bold">创建新组织</div>
    </template>
    <div class="grid grid-cols-6 gap-4">
      <div class="col-span-1">组织名称</div>
      <div class="col-span-5">
        <UInput v-model="newOrganizationName" label="组织名称" placeholder="请输入组织名称" />
      </div>
      <div class="col-span-1">组织描述</div>
      <div class="col-span-5">
        <UInput v-model="newOrganizationDesc" label="组织描述" placeholder="请输入组织描述" />
      </div>
      <UButton @click="createOrganization">创建</UButton>
    </div> 
  </UCard>
</UModal>

<USlideover v-model="showOrganizationState">
  <div class="w-full flex flex-col p-6">
    <div class="text-xl font-bold mb-4">当前已有组织</div>
    <div>
      <UTable :rows="organizations.data.value">

      </UTable>
    </div>
  </div>
</USlideover>

<div class="w-full grid grid-cols-5 gap-4 pr-6 h-[30vh]">

    <UCard class=" col-span-2 h-full">
      <template #header>
        <div class=" text-xl font-bold">组织管理</div>
      </template>
      <div>
        当前共有组织{{ organizations.data.value.length }}个
      </div>
      <div class="mt-4">
        <UButton class="mr-4" @click="createOrganizationState=true">创建组织</UButton>
        <UButton class="mr-4" @click="showOrganizationState=true">查看组织</UButton>
      </div>
    </UCard>
    <UCard class=" col-span-3 h-full">
      <template #header>
        <div class=" text-xl font-bold">用户管理</div>
      </template>
      <div>
        当前共有用户{{ users.data.value.length }}个
      </div>
      <div class="mt-4">
        <UButton class="mr-4" @click="navigateTo('/sadmin/user')">查看用户</UButton>
      </div>
    </UCard>
  </div>
  <div  class="w-full grid grid-cols-6 gap-4 pr-6 h-[30vh] mt-6">
    <UCard class=" col-span-5 h-full">
      <template #header>
        <div class=" text-xl font-bold">公告管理</div>
      </template>
      <div>当前共有{{ notices.data.value.length }}条公告,其中{{ notices.data.value.filter((item:any) => item.isActive === true).length }}条启用</div>
      <div>
        <UButton class="mr-4" @click="navigateTo('/sadmin/notice')">公告修改</UButton>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const users = await useMyFetch('/api/User/GetUsers',{method:'GET'}) as any
const organizations = await useMyFetch('/api/Organization/GetOrganizations',{method:'GET'}) as any
const notices = await useMyFetch('/api/Notice/GetNotices',{method:'GET'}) as any
const createOrganizationState = ref(false)
const showOrganizationState = ref(false)
const newOrganizationName = ref('')
const newOrganizationDesc = ref('')
const toast = useToast()
const createOrganization = async () => {
  const res = await $$fetch('/api/Organization/CreateOrganization',{
    method:'PUT',
    body:{name:newOrganizationName.value,description:newOrganizationDesc.value}
  }) as any
  if(res.code === 200){
    createOrganizationState.value = false
    newOrganizationName.value = ''
    newOrganizationDesc.value = ''
    toast.add({title:'创建成功'})
    organizations.refresh()
  }
}
</script>
