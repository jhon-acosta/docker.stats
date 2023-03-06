import DB from './db'
import Debug from 'debug'
import statsWatch from './stats'
import fastify, { FastifyInstance } from 'fastify'

const debug = Debug('api:index')

const server: FastifyInstance = fastify({ logger: true })

;(async () => {
  try {
    debug('debug:habilitado')
    // api.register(cors)
    // api.register(formbody)
    // api.register(routes, { prefix: '/api/v1' })
    const db = new DB()
    console.log('first', await db.getAll('CONTAINERS'))
    // await db.deleteTable('STATS')
    // await db.deleteTable('CONTAINERS')
    statsWatch(db)
    await server.listen({ host: '0.0.0.0', port: 3001 })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
})()
