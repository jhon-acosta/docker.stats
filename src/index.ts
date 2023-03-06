import DB from './db'
import statsWatch from './stats'
import fastify, { FastifyInstance } from 'fastify'

const server: FastifyInstance = fastify({ logger: true })

;(async () => {
  try {
    // api.register(cors)
    // api.register(formbody)
    // api.register(routes, { prefix: '/api/v1' })
    // await db()
    statsWatch(new DB())
    await server.listen({ host: '0.0.0.0', port: 3001 })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
})()
