<template>
  <UModal v-model="showEditState">
    <UCard>
      <template #header>修改用户信息</template>
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-1">用户ID</div>
        <div class="col-span-2">{{ currentUser.id }}</div>
        <div class="col-span-1">LogtoID</div>
        <div class="col-span-2">{{ currentUser.logtoID }}</div>
        <div class="col-span-1">用户名</div>
        <div class="col-span-2">
          <UInput v-model="currentUser.userName" />
        </div>
        <div class="col-span-1">邮箱</div>
        <div class="col-span-2">{{ currentUser.email }}</div>
        <div class="col-span-1">权限</div>
        <div class="col-span-2">
          <USelectMenu :model-value="switchRole(currentUser.role)" @change="(item)=>{currentUser.role=item.value}" :options="[{label:'普通用户',value:'user'},{label:'组织管理员',value:'admin'},{label:'组织所有者',value:'owner'},{label:'超级管理员',value:'sadmin'}]" />
        </div>
        <div class="col-span-1">所属组织</div>
        <div class="col-span-2">
          <USelectMenu :model-value="organazations.data.value.find((item: any)=>item.id===currentUser.organization)?.name" @change="(item)=>{currentUser.organization=item.value}" :options="[...organazations.data.value.map((item:any)=>({label:item.name,value:item.id})),{label:'无所属组织',value:null}]" />
        </div>
        <div class="col-span-3">
          <UButton @click="updateUser">提交</UButton>
        </div>
      </div>
    </UCard>

  </UModal>
  <div class="w-full flex flex-col pr-6">
    <UCard>
      <template #header>
        <div class="text-xl font-bold ">当前用户</div>
      </template>
      <UTable :rows="users.data.value" :columns="columns" >
        <template #role-data="{row}">
          <UPopover>
            <UBadge >{{ switchRole(row.role) }}</UBadge>
          </UPopover>
        </template>
        <template #organization-data="{row}">
          {{ organazations.data.value.find((item: any)=>item.id===row.organization)?.name }}
        </template>
        <template #action-data="{row}">
          <UButton @click="openEditModal(row)">
            修改信息
          </UButton>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const users = await useMyFetch('/api/User/GetUsers',{method:'GET'}) as any
const organazations = await useMyFetch('/api/Organization/GetOrganizations',{method:'GET'}) as any
const showEditState = ref(false)
const currentUser = ref(users.data.value[0])
const switchRole = (role:string)=>{
  switch(role){
    case 'user':
      return '普通用户'
    case 'admin':
      return '组织管理员'
    case 'owner':
      return '组织所有者'
    case 'sadmin':
      return '超级管理员'
  }
}
const columns = [
  {
    key:"id",
    label:"用户ID"
  },
  {
    key:"logtoID",
    label:"LogtoID"
  },
  {
    key:"userName",
    label:"用户名"
  },
  {
    key:"email",
    label:"邮箱"
  },
  {
    key:"role",
    label:"权限",
    render:switchRole
  },
  {
    key:"organization",
    label:"所属组织"
  },
  {
    key:"action",
    label:"操作"
  }
]

const openEditModal = (user:any) => {
  showEditState.value = true
  currentUser.value = user
}

const updateUser = async () => {
  const res = await $$fetch('/api/User/UpdateUser',{method:'POST',body:currentUser.value}) as any
  if(res.code===200){
    showEditState.value = false
    users.refresh()
  }
}
</script>
