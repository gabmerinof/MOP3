import { FastifyRequest, FastifyReply } from 'fastify';

// export const corsMiddleware = cors({
//     origin: function (origin, callback) {
//         if (!origin) return callback(null, true);

//         const allowedOrigins = [
//             'http://localhost:4200'
//         ];

//         if (allowedOrigins.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('No permitido por políticas de CORS' + origin));
//         }
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
// });

export async function corsMiddleware(request: FastifyRequest, reply: FastifyReply) {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (request.method === 'OPTIONS') {
    reply.status(204).send();
  }
}