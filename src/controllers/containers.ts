import DB, { Container } from '../utils/db'
import { FastifyReply, FastifyRequest } from 'fastify'

const db = new DB()

export default {
  async getAll(
    req: FastifyRequest<{
      Querystring: { startDate?: string; endDate?: string }
    }>,
    res: FastifyReply,
  ) {
    try {
      const { startDate, endDate } = req.query
      const containers = await db.getAll<Container>('CONTAINERS')
      console.log('containers', containers)
      if (containers.data.length > 0) {
        const promesas = containers.data.map((item) =>
          db.joinTable('CONTAINERS', 'STATS', item.id!, { startDate, endDate }),
        )
        const data = await Promise.all(promesas)
        return res.send({ data })
      }
      res.send([])
    } catch (error) {
      console.error(error)
      res.send(error)
    }
  },
}
