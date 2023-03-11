import DB from './libs/db'
import Debug from 'debug'
import cors from '@fastify/cors'
import { routes } from './routes'
import { configs } from './libs/utils'
import formbody from '@fastify/formbody'
import statsWatch from './libs/stats-watch'
import fastify, { FastifyInstance } from 'fastify'

if (!!configs.ENV_DEV === true) {
  Debug('api:index')
}

const server: FastifyInstance = fastify({ logger: configs.logger })

;(async () => {
  try {
    server.register(cors)
    server.register(formbody)
    server.register(routes, { prefix: '/api' })

    await statsWatch(new DB(), server)

    await server.listen({ host: configs.HOST, port: configs.PORT })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
})()
