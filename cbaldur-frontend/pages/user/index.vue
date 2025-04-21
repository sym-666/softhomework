<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-8">个人信息</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- 用户头像部分 -->
      <div class="flex flex-col items-center mb-8">
        <div class="relative group">
          <UAvatar 
            :src="userData?.avatar || ''" 
            :alt="userData?.username || '用户头像'" 
            size="2xl" 
            class="mb-3"
          />
          <div 
            class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            @click="showAvatarModal = true"
          >
            <UIcon name="i-heroicons-camera" class="text-white text-2xl" />
          </div>
        </div>
        <button 
          @click="showAvatarModal = true"
          class="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          更换头像
        </button>
      </div>

      <!-- 用户信息部分 -->
      <div v-if="!isEditing" class="space-y-4">
        <div class="grid grid-cols-4 gap-4">
          <div class="font-medium">用户名</div>
          <div class="col-span-3">{{ userData?.username }}</div>
          
          <div class="font-medium">邮箱</div>
          <div class="col-span-3">{{ userData?.email }}</div>
          
          
          <div class="font-medium">组织</div>
          <div class="col-span-3">{{ userData?.organization?.name || '无' }}</div>
          
          <div class="font-medium">角色</div>
          <div class="col-span-3">
            {{ 
              userData?.roleId === 0 ? '普通用户' : 
              userData?.roleId === 1 ? '管理员' : 
              userData?.roleId === 2 ? '超级管理员' : '未知' 
            }}
          </div>
        </div>
        
        <div class="flex justify-end mt-6">
          <UButton color="indigo" @click="startEdit">
            编辑信息
          </UButton>
        </div>
      </div>

      <!-- 编辑表单 -->
      <form v-else @submit.prevent="saveUserInfo" class="space-y-4">
        <div class="grid grid-cols-1 gap-y-4">
          <div>
            <label class="block mb-1 font-medium">用户名</label>
            <UInput v-model="editForm.username" placeholder="请输入用户名" />
          </div>
          
          <div>
            <label class="block mb-1 font-medium">邮箱</label>
            <UInput v-model="editForm.email" placeholder="请输入邮箱" />
          </div>
          
          <div>
            <label class="block mb-1 font-medium">姓名</label>
            <UInput v-model="editForm.realName" placeholder="请输入真实姓名" />
          </div>
          
          <div>
            <label class="block mb-1 font-medium">组织</label>
            <UInput 
              :model-value="userData?.organization?.name || '无'" 
              disabled
              class="bg-gray-100 cursor-not-allowed"
            />
            <p class="text-xs text-gray-500 mt-1">组织信息请联系管理员修改</p>
          </div>
        </div>
        
        <div class="flex justify-end gap-4 mt-6">
          <UButton color="gray" @click="cancelEdit">
            取消
          </UButton>
          <UButton type="submit" color="indigo" :loading="isSaving">
            保存
          </UButton>
        </div>
      </form>
    </div>

    <!-- 头像裁剪弹窗 -->
    <UModal v-model="showAvatarModal" :ui="{ width: 'sm:max-w-md' }">
      <div class="p-4">
        <h3 class="text-lg font-bold mb-4">更换头像</h3>
        
        <div v-if="!selectedImage" class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 cursor-pointer" @click="triggerImageSelect">
          <UIcon name="i-heroicons-cloud-arrow-up" class="text-gray-400 text-4xl mb-2" />
          <p class="text-gray-600">点击上传头像图片</p>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            class="hidden"
            @change="onImageSelected"
          >
        </div>

        <div v-if="selectedImage" class="mb-4 w-[400px] h-[400px]">
          <VueCropper
            ref="cropper"
            :img="selectedImage"
            :output-size="1"
            output-type="png"
            :info="true"
            :full="false"
            :can-move="true"
            :can-move-box="true"
            :fixed="true"
            :fixed-number="[1, 1]"
            :center-box="true"
            :auto-crop="true"
            :rounded="true"
            :highlight="false"
          />
        </div>

        <div class="flex justify-between">
          <UButton v-if="selectedImage" color="gray" @click="resetImageSelection">
            重新选择
          </UButton>
          <UButton v-if="selectedImage" color="indigo" :loading="isUploading" @click="uploadAvatar">
            确认上传
          </UButton>
          <UButton v-if="!selectedImage" color="gray" @click="showAvatarModal = false">
            取消
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
//@ts-ignore
import { VueCropper } from 'vue-cropper';


const userData = ref<any>(null);
const isEditing = ref(false);
const isSaving = ref(false);
const showAvatarModal = ref(false);
const selectedImage = ref<Blob| File |ArrayBuffer| string | null>(null);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const cropper = ref<any>(null);

const editForm = reactive({
  username: '',
  email: '',
  realName: ''
});

const {data} = await useMyFetch('/api/User/GetUser', { method: 'GET' });

userData.value = data.value;

const fetchUserData = async () => {
  const user  = await $$fetch('/api/User/GetUser', { method: 'GET' });
  userData.value = user;
};

const startEdit = () => {
  if (userData.value) {
    editForm.username = userData.value.username || '';
    editForm.email = userData.value.email || '';
    editForm.realName = userData.value.realName || '';
    isEditing.value = true;
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
};

// 保存用户信息
const saveUserInfo = async () => {
  isSaving.value = true;
  
  try {
    // 保留原有的组织信息，不进行修改
    const updateData = {
      ...userData.value,
      username: editForm.username,
      email: editForm.email,
      realName: editForm.realName,
      // 不修改 organization 字段
    };
    
    await useMyFetch('/api/User/UpdateUser', {
      method: 'POST',
      body: updateData
    });
    
    // 更新本地数据
    userData.value = updateData;
    isEditing.value = false;
    
    useToast().add({
      color: 'green',
      title: '成功',
      description: '用户信息已更新'
    });
  } catch (error) {
    console.error('更新用户信息失败', error);
    useToast().add({
      color: 'red',
      title: '错误',
      description: '更新用户信息失败'
    });
  } finally {
    isSaving.value = false;
  }
};

// 触发文件选择
const triggerImageSelect = () => {
  fileInput.value?.click();
};

// 选择图片
const onImageSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      selectedImage.value = reader.result
    };
    
    
  }
};

// 重置图片选择
const resetImageSelection = () => {
  selectedImage.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 上传头像
const uploadAvatar = async () => {
  if (!cropper.value) return;
  
  isUploading.value = true;
  
  try {
    // 获取裁剪后的图片数据
    cropper.value.getCropData(async (data: string) => {
      // 将Base64转换为Blob
      const byteString = atob(data.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: 'image/png' });
      
      // 创建FormData
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.png');
      
      try {
        // 提交到服务器
        await $$fetch('/api/User/UploadAvatar', {
          method: 'POST',
          body: formData
        });
        
        // 上传成功后刷新用户数据
        await fetchUserData();
        showAvatarModal.value = false;
        selectedImage.value = null;
        
        useToast().add({
          color: 'green',
          title: '成功',
          description: '头像已更新'
        });
      } catch (uploadError:any) {
        console.error('上传头像失败', uploadError);
        useToast().add({
          color: 'red',
          title: '错误',
          description: '上传头像失败'
        });
      } finally {
        isUploading.value = false;
      }
    });
  } catch (error:any) {
    console.error('处理头像失败', error);
    isUploading.value = false;
    useToast().add({
      color: 'red',
      title: '错误',
      description: '处理头像失败'
    });
  }
};

// 页面加载时获取用户信息
</script>

<style>
@import 'vue-cropper/dist/index.css';
</style>