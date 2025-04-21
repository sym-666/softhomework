<template>
    <div class="fixed py-4 w-20 h-[100vh] bg-indigo-100 z-50 transition-all overflow-hidden hover:w-[15rem] hover:z-[52]">
        <ul class="relative h-[100%] w-[100%]">
            <li @click="()=>navigateTo('user')" class="mb-4 w-[100%] flex justify-center items-center">
                <UAvatar  v-if="Boolean(user)" :src="user.data.value.avatar" :alt="user.data.value.username" size="lg" />
            </li>
            <li class=" relative" v-for="navItem in navItems">
                <NuxtLink :to="navItem.path">
                    <div :class="`flex pl-2 ml-1 my-2  rounded-l-full items-center w-[15rem] ${(route.path.includes(navItem.path)&&navItem.path!=='/')||navItem.path===route.path?'bg-indigo-50':''}`">
                        <UIcon :name="navItem.icon" class=" w-5 h-5 m-3" />
                        <div class="mx-6 my-3">
                            {{ navItem.title }}
                        </div>
                    </div>
                </NuxtLink>
            </li>
            <li v-if="user.data.value.roleId === 2" class=" relative">
                <NuxtLink to="/sadmin">
                    <div :class="`flex pl-2  ml-1 my-2  rounded-l-full items-center w-[15rem]`">
                        <UIcon name="i-heroicons-academic-cap-16-solid" class=" w-5 h-5 m-3" />
                        <div class="mx-6 my-3">
                             超级管理 
                        </div>
                    </div>
                </NuxtLink>
            </li>
            <li class=" absolute bottom-3">
                <div @click="signOut" :class="`flex pl-2 ml-1 my-2  rounded-l-full items-center w-[15rem] hover:cursor-pointer active:bg-white`">
                    <UIcon name="i-heroicons-arrow-left-end-on-rectangle-16-solid" class="w-5 h-5 m-3" />
                    <div class="mx-6 my-3">
                        退出登录
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>
<script setup lang="ts">
type NavItem = {
    title: string,
    icon: string,
    path: string
}
const navItems:NavItem[] = [
    {
        title: '首页',
        icon: 'i-heroicons-home-16-solid',
        path: '/'
    },
    {
        title: '我的算例',
        icon: 'i-heroicons-calendar-date-range-16-solid',
        path: '/cases'
    },
    {
        title: '新建算例',
        icon: 'i-heroicons-plus-circle-16-solid',
        path: '/add-case'
    }
]
const route = useRoute()
const user = await useMyFetch("/api/User/GetUser",{method:'GET'})

const signOut = ()=>{
    $$fetch('/api/Auth/Logout',{method:'POST'}).then(()=>{
        navigateTo('/auth/sign-in')
    })
}



</script>