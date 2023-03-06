export interface Stat {
  id?: string // PK
  container_id: number | string // FK
  cpu_percentaje: string
  mem_usage_limit: string
  mem_percentaje: string
  netio: string
  blockio: string
}
