import { FastifyInstance } from 'fastify'
import containers from '../controllers/containers'

export async function routes(route: FastifyInstance) {
  await route.get('/', containers.getAll)
}
