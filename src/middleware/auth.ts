import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/AppError';

export const auth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader)
            throw new AppError('TOKEN_ERROR', 'Header de autorización no presente', 401);

        if (!authHeader.startsWith('Bearer '))
            throw new AppError('TOKEN_ERROR', 'Formato de autorización inválido. Use: Bearer <token>', 401);

        const token = authHeader.substring(7);
        if (!token)
            throw new AppError('TOKEN_ERROR', 'Token no proporcionado', 401);

        await request.jwtVerify();
    } catch (err) {
        let errorMessage = 'Error de autenticación';

        if (err instanceof Error) {
            if (err.message === 'Authorization token expired') {
                errorMessage = 'Token expirado. Por favor, inicie sesión nuevamente';
            } else if (err.message.includes('token')) {
                errorMessage = 'Token inválido. Verifique sus credenciales';
            } else {
                errorMessage = err.message;
            }
        }

        return reply.status(401).send(
            errorMessage
        );
    }
};