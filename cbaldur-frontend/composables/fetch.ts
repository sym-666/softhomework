
import type { UseFetchOptions } from "#app"
import type {FetchOptions,ResponseType} from 'ofetch'
export const useMyFetch = async <T = any, R = any>(path: string, opts: UseFetchOptions<T, R> = {}): Promise<{
  data: {value: T | null};
  error: any;
}> => {
  const { public:{backendURL} } = useRuntimeConfig()
  const options: UseFetchOptions<T,R> = {
    ...opts,
    headers: useRequestHeaders(["cookie"]),
    credentials: 'include',
  }
  //@ts-ignore
  return useFetch<T, R>(backendURL + path, options)
}

export const $$fetch = async <T = any>(path: string, opts: FetchOptions<ResponseType,T> = {}): Promise<T> => {
  const { public: {backendURL} } = useRuntimeConfig()
  const options = {
    ...opts,
    headers: {...opts.headers,...useRequestHeaders(["cookie"])},
    credentials: 'include',
  }
  //@ts-ignore
  return $fetch<T>(backendURL + path, options)
}