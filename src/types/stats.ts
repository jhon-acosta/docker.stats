export interface Stat {
  id?: string // autoincremental
  name: string
  cpu_percentaje: string
  mem_usage_limit: string
  mem_percentaje: string
  netio: string
  blockio: string
  container_id: number | string
}
