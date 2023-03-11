import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import Debug from 'debug'
import { FastifyInstance } from 'fastify'
import DB, { Container, Stat } from './db'

const debug = Debug('api:src:stats')

const ruta = path.join(__dirname, '../../src/resources/stats.txt')

async function validateContainer(db: DB, container: string) {
  try {
    debug('validando existencia de contenedor: %s', container)
    const response = await db.getOne<Container>('CONTAINERS', {
      key: 'name',
      value: container,
    })
    if (!response.data) {
      const nuevoContenedor = await db.insertOne<Container>('CONTAINERS', {
        name: container,
      })
      return nuevoContenedor.data.id
    }
    return response.data.id
  } catch (error) {
    console.log(error)
  }
}

const getDigits = (value: string, memUsageLimit = false) => {
  const regex = value.match(/\d+(\.\d+)?/g)
  return {
    ['current' + (memUsageLimit ? 'MiB' : 'MB')]: regex?.[0],
    ['total' + (memUsageLimit ? 'GiB' : 'MB')]: regex?.[1],
  }
}
const percentajeSplit = (value: string) => value?.split?.('%')?.[0]
const convertToString = (data: Record<string, any>) => JSON.stringify(data)

export default async function statsWatch(db: DB, instance: FastifyInstance) {
  try {
    fs.watchFile(ruta, { interval: 1000 }, async (status) => {
      try {
        const fecha = dayjs(status.atime)
        instance.log.info(
          `reading file:${ruta} - ${fecha.format('DD/MM/YYYY HH:mm:ss')}`,
        )
        const data = fs.readFileSync(ruta, 'utf8')
        const registro = data?.split(' - ')
        const index = registro.lastIndexOf('NET I/O') + 2
        debug('tomando último lote de escritura posición: %s', index)
        registro.splice(0, index)
        let i = 0
        do {
          const contenedorNombreServicio = registro?.[i]
            ?.split('.')
            ?.filter((item) => !/[a-z0-9]{24}/.test(item))
            ?.join('.')
          if (
            !contenedorNombreServicio ||
            contenedorNombreServicio.includes('--')
          )
            return
          const container_id = await validateContainer(
            db,
            contenedorNombreServicio,
          )
          if (!container_id) {
            return
          }
          const posicion = registro.findIndex((fruta) =>
            fruta.includes(contenedorNombreServicio),
          )
          const clone = JSON.parse(JSON.stringify(registro))
          const stat: string[] = clone?.splice(posicion, 6)
          const nuevoStat = {
            container_id,
            date: fecha.toISOString(),
            cpu_percentaje: percentajeSplit(stat[1]),
            mem_usage_limit: convertToString(getDigits(stat[2], true)),
            mem_percentaje: percentajeSplit(stat[3]),
            netio: convertToString(getDigits(stat[4])),
            blockio: convertToString(getDigits(stat[5].split('\n')[0])),
          }
          debug('extrayendo estadísticas %O', nuevoStat)
          await db.insertOne<Stat>('STATS', nuevoStat)
          i += 6
        } while (registro[i] !== undefined)
      } catch (error) {
        console.error(`Error de lectura: ${error}}`)
      }
    })
  } catch (error) {
    console.error(`Error en la escucha: ${error}`)
  }
}
