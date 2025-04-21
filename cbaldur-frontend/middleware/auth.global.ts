export default defineNuxtRouteMiddleware(async (to, _) => {
  if (to.path.startsWith('/auth/')) {
    return
  }

  try {
    const { data, error } = await useMyFetch<{valid:boolean}>('/api/auth/validate', {
      method: 'GET',
    })
        
    if (error.value || !data.value?.valid) {
      return navigateTo('/auth/sign-in')
    }
    
  } catch {
    return navigateTo('/auth/sign-in')
  }
})
