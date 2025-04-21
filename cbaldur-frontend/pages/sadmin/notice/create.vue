<template>
  <div class="w-full grid grid-cols-2 gap-4 pr-6">
    <div class="col-span-2">
      <UInput v-model="title" label="Title" placeholder="Enter title" />
    </div>
    <UCard class="h-[80vh] overflow-clip">
      <UTextarea v-model="content" :rows="20" autoresize>

      </UTextarea>
    </UCard>
    <UCard class="h-[80vh] overflow-clip">
      <div v-html="md.render(content)"/>
    </UCard>
    <div class="col-span-2">
      <UButton @click="createNotice" type="primary" block>Create Notice</UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import markdownit from 'markdown-it'
const md = new markdownit()
const content = ref('')
const title = ref('')
const createNotice = async() => {
  $$fetch('/api/Notice/CreateNotice',{
    method: 'PUT',
    body:{
      title: title.value,
      content: content.value
    }
  }).then((res:any)=>{
    if(res.code===200){
      navigateTo('/sadmin/notice')
    } 
  })
}
</script>

<style>
h2 {
  font-size: 1.5rem;
  font-weight: 600;
}
h1 {
  font-size: 2rem;
  font-weight: 600;
}
h3 {
  font-size: 1.2rem;
  font-weight: 600;
}
h4 {
  font-size: 1rem;
  font-weight: 600;
}
 
</style>