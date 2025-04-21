<template>
  <div class="flex items-center justify-center min-h-screen bg-indigo-50">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex flex-col items-center">
          <img src="https://s2.loli.net/2024/12/04/nCkNI1J5AmgQ9l6.png" alt="Logo" class="h-20 mb-2">
        </div>
      </template>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormGroup label="用户名或邮箱" required>
          <UInput v-model="form.usernameOrEmail" placeholder="请输入用户名或邮箱" />
          <template v-if="errors.usernameOrEmail" #hint>
            <span class="text-red-500 text-sm">{{ errors.usernameOrEmail }}</span>
          </template>
        </UFormGroup>
        
        <UFormGroup label="密码" required>
          <UInput 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
          />
          <template v-if="errors.password" #hint>
            <span class="text-red-500 text-sm">{{ errors.password }}</span>
          </template>
        </UFormGroup>
        
        <div class="flex items-center justify-between">
          <UCheckbox v-model="rememberMe" label="记住我" />
          <UButton variant="link" to="#" size="sm">忘记密码?</UButton>
        </div>
        
        <div class="pt-4">
          <UButton 
            type="submit" 
            block 
            color="primary" 
            :loading="isLoading"
          >
            登录
          </UButton>
        </div>

        <div class="text-center mt-4">
          <span>还没有账号? </span>
          <NuxtLink to="/auth/sign-up" class="text-primary-500 hover:underline">
            立即注册
          </NuxtLink>
        </div>
      </form>

      <!-- 添加社交登录分隔线 -->
      <div class="my-6 flex items-center">
        <div class="flex-grow border-t border-gray-300"></div>
        <div class="px-4 text-sm text-gray-500">或使用社交账号登录</div>
        <div class="flex-grow border-t border-gray-300"></div>
      </div>
      
      <!-- 添加GitHub登录按钮 -->
      <div class="flex justify-center mb-4">
        <UButton
          variant="outline"
          color="black"
          class="flex items-center justify-center"
          @click="handleGithubLogin"
        >
          <div class="flex items-center">
            <UIcon name="i-mdi-github" class="mr-2" />
            <span>GitHub 登录</span>
          </div>
        </UButton>
      </div>
      
      <UNotifications />
    </UCard>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: false
});

const router = useRouter();
const toast = useToast();
const form = reactive({
  usernameOrEmail: '',
  password: ''
});

const errors = reactive({
  usernameOrEmail: '',
  password: ''
});

const rememberMe = ref(false);
const isLoading = ref(false);


const validateForm = () => {
  let isValid = true;
  
  // 验证用户名/邮箱
  if (!form.usernameOrEmail) {
    errors.usernameOrEmail = '请输入用户名或邮箱';
    isValid = false;
  } else {
    errors.usernameOrEmail = '';
  }
  
  // 验证密码
  if (!form.password) {
    errors.password = '请输入密码';
    isValid = false;
  } else {
    errors.password = '';
  }
  
  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;
  isLoading.value = true;
  try{
    const data :any  = await $$fetch('/api/Auth/login', {
    method: 'POST',
    body: {
      usernameOrEmail: form.usernameOrEmail,
      password: form.password
    }
  });
  if(data.success){
      toast.add({
      title: '登录成功！',
      color: 'green',
      timeout: 3000
    });
    isLoading.value = false;
    // 登录成功后跳转到首页
    setTimeout(() => {
      router.push('/');
    }, 1500);
  }
  else{
    toast.add({
      title: '登录失败！',
      color: 'red',
      timeout: 3000
    });
    isLoading.value = false;
  }
  }catch(e:any){
    if(e.status===401){
      toast.add({
        title: '用户名或密码错误',
        color: 'red',
        timeout: 3000
      });
      isLoading.value = false;
  }
}
};

// GitHub登录处理函数
const handleGithubLogin = async () => {
  try {
    // 重定向到后端的GitHub授权接口
    $$fetch('/api/Auth/github-login', {
      method: 'GET',
      params: {
        redirectUri:   'http://localhost:5168/api/auth/github-callback'
      }
    }).then(data=>{
      window.location=data.url
    });
  } catch (error) {
    toast.add({
      title: 'GitHub登录跳转失败',
      color: 'red',
      timeout: 3000
    });
  }
};
</script>
