import DB from './libs/db'
import Debug from 'debug'
import cors from '@fastify/cors'
import { routes } from './routes'
import formbody from '@fastify/formbody'
import statsWatch from './libs/stats-watch'
import fastify, { FastifyInstance } from 'fastify'

Debug('api:index')

const server: FastifyInstance = fastify({ logger: true })

;(async () => {
  try {
    server.register(cors)
    server.register(formbody)
    server.register(routes, { prefix: '/api' })

    const dbInstance = new DB()
    await statsWatch(dbInstance)

    await server.listen({ host: '0.0.0.0', port: 3001 })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
})()
