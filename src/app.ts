import compress from '@fastify/compress';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { RequestContext } from '@mikro-orm/postgresql';
import ajvErrors from 'ajv-errors';
import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import disableCache from 'fastify-disablecache';
import { DatabaseMikro } from './config/database';
import { IController } from './controllers/Interfaces/IController';
import { ContainerConfig } from './inversify.config';
import { responseFormatter } from './middleware/responseFormater';

const API_PREFIX = '/api';
const app = fastify({
    logger: true,
    bodyLimit: 1073741824, // 1GB
    ajv: {
        customOptions: {
            allErrors: true,
            coerceTypes: true,
            useDefaults: true,
            removeAdditional: true
        },
        plugins: [ajvErrors]
    },
    connectionTimeout: 60 * 1000, // 60 segundos
    keepAliveTimeout: 5000, // 5 segundos
    requestTimeout: 30000 // 30 segundos
});


const startServer = async () => {
    try {
        await app.register(import('@fastify/swagger'))
        await app.register(import('@fastify/swagger-ui'), {
            routePrefix: '/documentation',
            uiConfig: {
                docExpansion: 'full',
                deepLinking: false
            },
            uiHooks: {
                onRequest: function (request, reply, next) { next() },
                preHandler: function (request, reply, next) { next() }
            },
            staticCSP: true,
            transformStaticCSP: (header) => header,
            transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
            transformSpecificationClone: true
        })

        await app.register(disableCache);
        await app.register(helmet);
        await app.register(compress, { encodings: ['deflate', 'gzip'], inflateIfDeflated: true });
        await app.register(cors, { origin: true });
        await app.register(rateLimit, {
            max: 100,
            timeWindow: '15 minutes'
        });

        app.addContentTypeParser(
            'application/x-www-form-urlencoded',
            { parseAs: 'string' },
            (req, body, done) => {
                try {
                    const parsed = new URLSearchParams(body as string);
                    const result: any = {};
                    for (const [key, value] of parsed.entries()) {
                        result[key] = value;
                    }

                    done(null, result);
                } catch (err) {
                    done(err as Error, undefined);
                }
            }
        );

        app.addHook('onSend', (request: FastifyRequest, reply: FastifyReply, payload, done) => {
            if (request.url.includes('/documentation')) {
                done(null, payload);
                return;
            }

            if (reply.statusCode >= 400)
                reply.headers({ 'content-type': 'application/json' });

            done(null, responseFormatter(payload, request, reply));
        });

        await DatabaseMikro.Initialize();

        app.get('/', (request: FastifyRequest, reply: FastifyReply) => {
            reply.code(200).send('Sistema de gestión de tráfico georeferencial');
        });

        app.get('/health', (request: FastifyRequest, reply: FastifyReply) => {
            reply.code(200).send({
                status: 'OK',
                service: 'Traffic Geo API',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });

        const containerConfig = new ContainerConfig();
        await containerConfig.configure();
        const controllers = containerConfig.getAllControllers();
        controllers.forEach((controller: IController) => app.register((app) => controller.registerRoutes(app), { prefix: `${API_PREFIX}${controller.getPath()}` }));

        app.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done) => {
            RequestContext.create(DatabaseMikro.getServices()!.em, done);
        });

        app.addHook('onClose', async () => {
            await DatabaseMikro.getServices()!.orm.close();
        });

        app.setErrorHandler((error: any, request, reply) => {
            if (error.statusCode === 429)
                reply.status(429).send('Límite de solicitudes excedido');

            reply.status(error.statusCode || 500).send(process.env["NODE_ENV"] === 'development' ? error.message : 'Algo salió mal');
        });

        app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
            reply.code(404).send('Ruta no encontrada');
        });

        await app.register(fastifyJwt, {
            secret: process.env["JWT_SECRET"] ?? 'a1b2c3d4e5f67890abcdef1234567890',
        });

        const port = parseInt(process.env['PORT'] ?? '0');
        app.listen({
            port: port,
            host: '0.0.0.0'
        }, (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            console.log(`Servidor ejecutándose en http://localhost:${port}`);
            console.log(`Documentación disponible en http://localhost:${port}/health`);
            console.log(`Documentación disponible en http://localhost:${port}/documentation`);
        });

        const listeners = ['SIGINT', 'SIGTERM']
        listeners.forEach((signal) => {
            process.on(signal, async () => {
                await app.close()
                process.exit(0)
            })
        })
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();