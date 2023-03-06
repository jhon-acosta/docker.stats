import DB, { Container } from '../libs/db'
import { FastifyReply, FastifyRequest } from 'fastify'

const db = new DB()

export default {
  async getAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const containers = await db.getAll<Container>('CONTAINERS')
      if (containers.data.length > 0) {
        const promesas = containers.data.map((item) =>
          db.joinTable('CONTAINERS', 'STATS', item.id!),
        )
        const data = await Promise.all(promesas)
        const response = data.map((item) => {
          return {
            container: containers.data.find((item) => item.id === item.id)
              ?.name,
            ...item,
          }
        })
        return res.send({ data: response })
      }
      res.send([])
    } catch (error) {
      console.error(error)
      res.send(error)
    }
  },
}
