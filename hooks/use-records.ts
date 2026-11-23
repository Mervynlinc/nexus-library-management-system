"use client"
import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
export function useRecords<T>(resource: string) {
  const [items, setItems] = useState<T[]>([])
  const toast = useToast()
  const reload = useCallback(async () => {
    const result = await apiFetch<{items:T[]}>(`/api/manage/${resource}`)
    setItems(result.items)
  }, [resource])
  useEffect(() => {
    const refresh = () => { void reload().catch(err => toast({variant:"error",title:`Could not load ${resource}`,description:err instanceof Error?err.message:"Request failed"})) }
    refresh()
    window.addEventListener("nexus-data-changed", refresh)
    return () => window.removeEventListener("nexus-data-changed", refresh)
  }, [reload, resource, toast])
  return [items, setItems, reload] as const
}
export async function saveRecord<T>(resource: string, values: unknown, id?: string): Promise<T> {
  const result = await apiFetch<{item:T}>(`/api/manage/${resource}${id?`/${id}`:""}`, {method:id?"PUT":"POST",body:JSON.stringify(values)})
  window.dispatchEvent(new Event("nexus-data-changed"))
  return result.item
}
export async function recordAction(resource: string, id: string, action?: string) {
  await apiFetch(`/api/manage/${resource}/${id}${action?`/${action}`:""}`, {method:action?"POST":"DELETE"})
  window.dispatchEvent(new Event("nexus-data-changed"))
}
