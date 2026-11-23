import type { FastifyInstance } from 'fastify';
import { ParkingDirectoryQuerySchema,NearbyParkingQuerySchema } from '@trip-fit/domain';
import type { ParkingDirectoryService } from '../services/parking-directory.js';
export function registerParkingDirectoryRoutes(app:FastifyInstance,directory:ParkingDirectoryService){
 app.get('/api/parking-directory',async(request,reply)=>{reply.header('Cache-Control','no-store');const query=ParkingDirectoryQuerySchema.safeParse(request.query);if(!query.success)return reply.code(400).send({error:'invalid-parking-query'});return directory.list(query.data)??reply.code(503).send({error:'parking-unavailable'});});
 app.get('/api/parking-directory/nearby',async(request,reply)=>{reply.header('Cache-Control','no-store');const query=NearbyParkingQuerySchema.safeParse(request.query);if(!query.success)return reply.code(400).send({error:'invalid-parking-query'});return directory.nearby(query.data.kind,query.data.id)??reply.code(503).send({error:'parking-unavailable'});});
}
