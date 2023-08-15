import DB, { Container } from '../utils/db'
import { FastifyPluginAsync } from 'fastify'

const db = new DB()

const indexController: FastifyPluginAsync = async (instance) => {
  instance.get<{
    Querystring: { startDate?: string; endDate?: string }
  }>('/stats', async (request, reply) => {
    const { startDate, endDate } = request.query
    const containers = await db.getAll<Container>('CONTAINERS')
    if (containers.data.length > 0) {
      const promesas = containers.data.map((item) =>
        db.joinTable('CONTAINERS', 'STATS', item.id!, { startDate, endDate }),
      )
      const data = await Promise.all(promesas)
      reply.send({ data })
      return
    }
    reply.send([])
  })
}

export default indexController
