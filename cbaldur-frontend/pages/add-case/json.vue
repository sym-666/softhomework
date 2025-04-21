<template>
  <div class="w-[100%] mb-4 pr-4">
    <UCard>
      <UProgress
        :value="10"
        size="sm"
        :max="[
          '这是Basic模块',
          '这是Impurity模块',
          '这是Transport模块',
          '这是Transport Modal模块',
          '这是系统的初始条件',
          '这是系统的边界条件',
          '这是系统的Gas puffing and pellet injection模块',
          '这是系统的NBI heating模块',
          '这是系统的Reread模块',
          '这是系统的Baldur Control部分(最后一个部分了)',
          '请填写Comment以及检查生成的JSON！'
          ]"
      />
      <div class="w-[100%] flex mt-3 justify-between">
        <UButton to="/add-case/baldur-control">上一项</UButton>
        <UButton v-on:click="submit">提交</UButton>
      </div>
  </UCard>
  </div>
  
  <div class="w-full min-h-[10vh] grid grid-cols-5 pr-6 mb-6">
    <div class="col-span-1 flex justify-center items-center">
      Comment
    </div>
    <div class="col-span-4">
      <UTextarea v-model="comment" :rows="4"/>
    </div>
  </div>
  <div class="h-[70vh] w-[100%] pr-6 rounded-2xl">
    <MonacoEditor class="h-[70vh]  bg-indigo-100" @update:model-value="(value)=>finalValue=JSON.parse(value)" :model-value="JSON.stringify(finalValue,null,2)" lang="json"/>
  </div>
</template>

<script setup>
const input = useInput()

function transformObject(obj) {
  const result = {};
  for (const [block, data] of Object.entries(obj)) {
    result[block] = {};
    for (const [key, value] of Object.entries(data)) {
      if (value.hasOwnProperty('index') && value.hasOwnProperty('values')) {
        value.index.forEach((index, i) => {
          result[block][`${key}(${index})`] = value.values[i];
        });
      } else {
        result[block][key] = value;
      }
    }
  }
  
  return result;
}
function mergeObjectsByNamelist(obj) {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
        const { namelist, ...rest } = value; 
        if (result[namelist]) {
            result[namelist] = mergeBlocks(result[namelist], rest);
        } else {
            result[namelist] = rest;
        }
    }
    let i=1
    for(i=1;i<26;i++){
     if (i<6) {
      result["nurun1"][`nlpomt(${i})`] = false
     }else if (i<10) {
      result["nurun1"][`nlpomt(${i})`] = true
     }else if (i<20) {
      result["nurun1"][`nlpomt(${i})`] = false
     }else if (i<22) {
      result["nurun1"][`nlpomt(${i})`] = true
     }else if (i==22) {
      result["nurun1"][`nlpomt(${i})`] = false
     }else {
      result["nurun1"][`nlpomt(${i})`] = true
     }
    }
    return result;
}

function mergeBlocks(block1, block2) {
    const result = { ...block1 };
    for (const [key, value] of Object.entries(block2)) {
        if (key === 'index' || key === 'values') {
            result[key] = result[key] ? result[key].concat(value) : value;
        } else {
            result[key] = value;
        }
    }

    return result;
}
const comment = useComment()
const finalValue = ref(mergeObjectsByNamelist(transformObject(input.value)))
const submit = () =>{
  $$fetch("/api/Case/CreateCase",{
    method:"PUT",
    body:{
      caseJson: JSON.stringify(finalValue.value),
      caseJsonPrototype: JSON.stringify(input.value),
      comment: comment.value,
    }
  }).then((data)=>{
    if(data.success){
      alert('提交成功！')
      setTimeout(()=>{
        navigateTo('/cases')
      },1000)
    }else{
      alert('提交失败！')
    }
  })
}
</script>

<style>

</style>