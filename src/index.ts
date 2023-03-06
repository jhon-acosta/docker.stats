import DB from './db'
import Debug from 'debug'
import statsWatch from './stats'
import cors from '@fastify/cors'
import { routes } from './routes'
import formbody from '@fastify/formbody'
import fastify, { FastifyInstance } from 'fastify'

const debug = Debug('api:index')

const server: FastifyInstance = fastify({ logger: true })

;(async () => {
  try {
    debug('debug:habilitado')
    server.register(cors)
    server.register(formbody)
    server.register(routes, { prefix: '/api' })
    await statsWatch(new DB())
    await server.listen({ host: '0.0.0.0', port: 3001 })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
})()
