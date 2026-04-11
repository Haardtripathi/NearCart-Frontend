import { httpClient } from '@/api/http'
import type { HealthResponse } from '@/types/api'

export async function getHealthStatus() {
  const { data } = await httpClient.get<HealthResponse>('/health')

  return data
}
