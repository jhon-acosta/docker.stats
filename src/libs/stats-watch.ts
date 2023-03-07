import fs from 'fs'
import dayjs from 'dayjs'
import Debug from 'debug'
import DB, { Container, Stat } from './db'
import path from 'path'

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

export default async function statsWatch(db: DB) {
  try {
    fs.watchFile(ruta, { interval: 1000 }, async (status) => {
      try {
        debug(
          'archivo a la escucha/lectura: %s - %s',
          path,
          dayjs(status.atime).format('DD/MM/YYYY HH:mm:ss'),
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
          const stat = clone?.splice(posicion, 6)
          const nuevoStat = {
            container_id,
            cpu_percentaje: stat[1],
            mem_usage_limit: stat[2],
            mem_percentaje: stat[3],
            netio: stat[4],
            blockio: stat[5].split('\n')[0],
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
