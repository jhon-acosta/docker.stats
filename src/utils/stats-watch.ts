import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import Debug from 'debug'
import { FastifyInstance } from 'fastify'
import DB, { Container, Stat } from './db'

const debug = Debug('api:src:stats')

const ruta = path.join(__dirname, '../../src/static/stats.txt')

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

const getUnit = (value: string, memUseLimit = false) =>
  value.match(memUseLimit ? /[MGT]?iB/g : /[kMG]?B(?=\s|$)/g)
const getDigits = (value: string) => value.match(/\d+(\.\d+)?/g)

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
        console.log('registro', registro)
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
          const containerId = await validateContainer(
            db,
            contenedorNombreServicio,
          )
          if (!containerId) {
            return
          }
          const posicion = registro.findIndex((fruta) =>
            fruta.includes(contenedorNombreServicio),
          )
          const clone = JSON.parse(JSON.stringify(registro))
          const stat: string[] = clone?.splice(posicion, 6)
          const nuevoStat: Stat = {
            container_id: containerId as number,
            date: fecha.toISOString(),
            mem_percentaje: parseFloat(percentajeSplit(stat[3])),
            cpu_percentaje: parseFloat(percentajeSplit(stat[1])),
            mem_usage_limit: convertToString({
              value: getDigits(stat[2])?.[0],
              unit: getUnit(stat[2], true)?.[0],
            }),
            mem_usage_limit_total: convertToString({
              value: getDigits(stat[2])?.[1],
              unit: getUnit(stat[2], true)?.[1],
            }),
            netio: convertToString({
              value: getDigits(stat[4])?.[0],
              unit: getUnit(stat[4])?.[0],
            }),
            netio_total: convertToString({
              value: getDigits(stat[4])?.[1],
              unit: getUnit(stat[4])?.[1],
            }),
            blockio: convertToString({
              value: getDigits(stat[5].split('\n')[0])?.[0],
              unit: getUnit(stat[5].split('\n')[0])?.[0],
            }),
            blockio_total: convertToString({
              value: getDigits(stat[5].split('\n')[0])?.[1],
              unit: getUnit(stat[5].split('\n')[0])?.[1],
            }),
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
