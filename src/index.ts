import Debug from 'debug'
import DB from './utils/db'
import cors from '@fastify/cors'
import { configs } from './utils'
import controllers from './controllers'
import formbody from '@fastify/formbody'
import statsWatch from './utils/stats-watch'
import fastify, { FastifyInstance } from 'fastify'

if (!!configs.ENV_DEV === true) Debug('api:index')

const server: FastifyInstance = fastify({ logger: configs.logger })

;(async () => {
  try {
    server.register(cors)
    server.register(formbody)
    server.register(controllers, { prefix: '/api' })

    await statsWatch(new DB(), server)

    await server.listen({ host: configs.HOST, port: configs.PORT })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
})()
