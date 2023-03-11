export const configs = {
  ENV: process.env.NODE_ENV || 'DEVELOPMENT',
  HOST: process.env.HOST || '127.0.0.1',
  PORT: (process.env.PORT && parseInt(process.env.PORT)) || 8082,
  ENV_DEV: function (): boolean {
    return this.ENV === 'DEVELOPMENT'
  },
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'hostname,pid,reqId,responseTime',
        singleLine: true,
        translateTime: 'SYS:dd/mm/yy HH:MM:ss',
      },
    },
  },
}

export function convertirStringToObject(
  item: Record<string, any>,
  key: string,
) {
  item[key] = JSON.parse(item[key])
}

export function convertirStringToNumber(
  registro: Record<string, any>,
  args?: { excludes: string[] },
) {
  for (const key in registro) {
    if (args?.excludes.includes(key)) {
      continue
    } else if (typeof registro[key] === 'object') {
      convertirStringToNumber(registro[key])
    } else if (typeof registro[key] === 'string') {
      registro[key] = parseFloat(registro[key])
    }
  }
}

export function validarRegistroNumerico(rows: Record<string, object>[]) {
  for (const item of rows) {
    convertirStringToObject(item, 'mem_usage_limit')
    convertirStringToObject(item, 'netio')
    convertirStringToObject(item, 'blockio')
    convertirStringToNumber(item, {
      excludes: ['id', 'name', 'date', 'container_id'],
    })
  }
}
