<template>
  <div class="flex items-center justify-center min-h-screen bg-indigo-50">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex flex-col items-center">
          <img src="https://s2.loli.net/2024/12/04/nCkNI1J5AmgQ9l6.png" alt="Logo" class="h-20 mb-2">
        </div>
      </template>
      
      <form @submit.prevent="handleRegister" class="space-y-4">
        <UFormGroup label="用户名" required>
          <UInput v-model="form.username" placeholder="请输入用户名" />
          <template v-if="errors.username" #hint>
            <span class="text-red-500 text-sm">{{ errors.username }}</span>
          </template>
        </UFormGroup>
        
        <UFormGroup label="邮箱" required>
          <UInput v-model="form.email" placeholder="请输入邮箱地址" />
          <template v-if="errors.email" #hint>
            <span class="text-red-500 text-sm">{{ errors.email }}</span>
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
        
        <UFormGroup label="确认密码" required>
          <UInput 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码" 
          />
          <template v-if="errors.confirmPassword" #hint>
            <span class="text-red-500 text-sm">{{ errors.confirmPassword }}</span>
          </template>
        </UFormGroup>
        
        <UFormGroup label="验证码" required>
          <div class="flex space-x-2">
            <UInput v-model="form.verificationCode" placeholder="请输入验证码" />
            <UButton 
              @click="sendVerificationCode" 
              :disabled="cooldown > 0" 
              :loading="sendingCode"
              color="gray"
            >
              {{ cooldown > 0 ? `${cooldown}秒后重试` : '获取验证码' }}
            </UButton>
          </div>
          <template v-if="errors.verificationCode" #hint>
            <span class="text-red-500 text-sm">{{ errors.verificationCode }}</span>
          </template>
        </UFormGroup>
        
        <div class="pt-4">
          <UButton 
            type="submit" 
            block 
            color="primary" 
            :loading="isLoading"
          >
            注册
          </UButton>
        </div>

        <div class="text-center mt-4">
          <span>已有账号? </span>
          <NuxtLink to="/auth/sign-in" class="text-primary-500 hover:underline">
            立即登录
          </NuxtLink>
        </div>
      </form>
      
      <!-- 添加社交登录分隔线 -->
      <div class="my-6 flex items-center">
        <div class="flex-grow border-t border-gray-300"></div>
        <div class="px-4 text-sm text-gray-500">或使用社交账号注册</div>
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
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
  roleId: 0, // 默认角色
  organizationId: null
});

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: ''
});

const isLoading = ref(false);
const sendingCode = ref(false);
const cooldown = ref(0);



// 邮箱格式验证
const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// 表单验证
const validateForm = () => {
  let isValid = true;
  
  if (!form.username) {
    errors.username = '请输入用户名';
    isValid = false;
  } else if (form.username.length < 3) {
    errors.username = '用户名长度至少为3个字符';
    isValid = false;
  } else {
    errors.username = '';
  }
  
  if (!form.email) {
    errors.email = '请输入邮箱';
    isValid = false;
  } else if (!isValidEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址';
    isValid = false;
  } else {
    errors.email = '';
  }
  
  if (!form.password) {
    errors.password = '请输入密码';
    isValid = false;
  } else if (form.password.length < 8) {
    errors.password = '密码长度至少为8个字符';
    isValid = false;
  } else {
    errors.password = '';
  }
  
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码';
    isValid = false;
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = '两次输入的密码不一致';
    isValid = false;
  } else {
    errors.confirmPassword = '';
  }
  
  if (!form.verificationCode) {
    errors.verificationCode = '请输入验证码';
    isValid = false;
  } else {
    errors.verificationCode = '';
  }
  
  return isValid;
};

// 发送验证码
const sendVerificationCode = async () => {
  if (!form.email) {
    errors.email = '请先输入邮箱';
    return;
  }
  
  if (!isValidEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址';
    return;
  }
  
  sendingCode.value = true;
  const data :any = await $$fetch('/api/Auth/send-verification-code', {
    method: 'POST',
    body: {
      email: form.email
    },
    credentials: 'include', // 确保发送和接收 cookie
  });
  if(data.success){
    toast.add({
      title: '验证码已发送，请查收邮件',
      color: 'green',
      timeout: 3000
    });
    // 启动倒计时
    cooldown.value = 60;
    const timer = setInterval(() => {
      cooldown.value--;
      if (cooldown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }else{
    toast.add({
      title: '发送验证码失败，请稍后再试',
      color: 'red',
      timeout: 3000
    });
  }
};

// 注册处理
const handleRegister = async () => {
  if (!validateForm()) return;
  
  isLoading.value = true;
  
  
    const data:any = await $$fetch('/api/Auth/register', {
      method: 'POST',
      body: {
        username: form.username,
        email: form.email,
        password: form.password,
        verificationCode: form.verificationCode,
        roleId: form.roleId,
        organizationId: form.organizationId
      },
      credentials: 'include', // 确保发送和接收 cookie
    });
    if(data.success){
      toast.add({
        title: '注册成功！',
        color: 'green',
        timeout: 3000
      });
      isLoading.value = false;
      // 注册成功后跳转到登录页面
      setTimeout(() => {
        router.push('/auth/sign-in');
      }, 1500);
    }
    else{
      toast.add({
        title: '注册失败！',
        color: 'red',
        timeout: 3000
      });
      isLoading.value = false;
    }
  }

// GitHub登录处理函数
const handleGithubLogin = async () => {
  try {
    // 重定向到后端的GitHub授权接口
    window.location.href = '/api/Auth/github-login';
  } catch (error) {
    toast.add({
      title: 'GitHub登录跳转失败',
      color: 'red',
      timeout: 3000
    });
  }
};
</script>
