import fs from 'fs'
import DB from '../db'
import dayjs from 'dayjs'
import { Stat } from 'src/types/stats'
import { Container } from '../types/containers'

// docker stats --format "table {{.Container}} - {{.Name}} - {{.CPUPerc}} - {{.MemUsage}} - {{.MemPerc}} - {{.NetIO}} - {{.BlockIO}}"

/**
 * Los headers toman las 7 primeras posiciones.
 */

const path = 'src/assets/stats.txt'

async function handleContainer(db: DB, container: string) {
  try {
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

async function handleContainerStats(contenedorId: string) {
  try {
    //
  } catch (error) {
    console.error(error)
  }
}

export default function statsWatch(db: DB) {
  try {
    fs.watchFile(path, { interval: 1000 }, async (status) => {
      try {
        console.log(
          `Archivo a la escucha: ${path}`,
          dayjs(status.atime).format('DD/MM/YYYY HH:mm:ss'),
        )
        const data = fs.readFileSync(path, 'utf8')
        const registro = data.split(' - ')
        registro.splice(0, 7)
        let i = 0
        do {
          console.log('registro', registro)
          const contenedorNombreServicio = registro?.[i]
            .split('.')
            .filter((item) => !/[a-z0-9]{24}/.test(item))
            .join('.')
          const container_id = await handleContainer(
            db,
            contenedorNombreServicio,
          )
          if (!container_id) {
            return
          }
          // const test = registro.indexOf(contenedorNombreServicio)
          // console.log('test', test)
          // await db.insertOne<Stat>('STATS', {
          //   container_id,
          //   name: '',
          //   mem_usage_limit: '',
          //   cpu_percentaje: '',
          //   netio: '',
          //   mem_percentaje: '',
          //   blockio: '',
          // })
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
