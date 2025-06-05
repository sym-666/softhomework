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
      <div class="w-[100%] flex mt-3 justify-between items-center">
        <UButton to="/add-case/baldur-control">上一项</UButton>
        <USelect v-model="selectedSupercomputer" :options="supercomputerOptions" option-attribute="name" value-attribute="id" class="w-1/3" />
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
    <MonacoEditor class="h-[70vh]  bg-indigo-100" @update:model-value="updateFinalValue" :model-value="JSON.stringify(finalValue,null,2)" lang="json"/>
  </div>
</template>

<script setup>
const input = useInput()
const selectedSupercomputer = ref('auto') // 默认选中 auto
const supercomputerOptions = [
  { name: '后端超算：Auto', id: 'auto' },
  { name: 'Hubei', id: 'mhd' },
  { name: 'Beijing', id: 'bscct' }
]

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

// 反向转换函数：将 finalValue 转换回 input 格式
function reverseTransformObject(finalObj, originalInput) {
  const result = {};
  
  // 遍历原始 input 的结构
  for (const [block, data] of Object.entries(originalInput)) {
    result[block] = { ...data };
    
    // 获取对应的 namelist
    const correspondingNamelist = data.namelist;
    
    for (const [key, value] of Object.entries(data)) {
      // 跳过 namelist 字段本身
      if (key === 'namelist') {
        continue;
      }
      
      if (value && typeof value === 'object' && value.hasOwnProperty('index') && value.hasOwnProperty('values')) {
        // 对于有 index 和 values 的项，从 finalObj 中提取对应值
        const newValues = [];
        value.index.forEach((index, i) => {
          const finalKey = `${key}(${index})`;
          
          if (finalObj[correspondingNamelist] && finalObj[correspondingNamelist].hasOwnProperty(finalKey)) {
            newValues[i] = finalObj[correspondingNamelist][finalKey];
          } else {
            newValues[i] = value.values[i]; // 保持原值
          }
        });
        result[block][key] = {
          ...value,
          values: newValues
        };
      } else {
        // 对于普通字段，从 finalObj 中查找对应值
        if (finalObj[correspondingNamelist] && finalObj[correspondingNamelist].hasOwnProperty(key)) {
          result[block][key] = finalObj[correspondingNamelist][key];
        } else {
          result[block][key] = value; // 保持原值
        }
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

// 处理编辑器值更新的函数
const updateFinalValue = (value) => {
  try {
    // 解析新的 JSON 值
    const newFinalValue = JSON.parse(value);
    finalValue.value = newFinalValue;
    
    // 立即将变化反馈给 input
    const updatedInput = reverseTransformObject(newFinalValue, input.value);
    Object.assign(input.value, updatedInput);
  } catch (error) {
    console.error('JSON 解析错误:', error);
  }
};

const submit = () =>{
  $$fetch("/api/Case/CreateCase",{
    method:"PUT",
    body:{
      caseJson: JSON.stringify(finalValue.value),
      caseJsonPrototype: JSON.stringify(input.value),
      comment: comment.value,
      superComputer: selectedSupercomputer.value,
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