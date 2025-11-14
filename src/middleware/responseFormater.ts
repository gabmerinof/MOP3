import { FastifyReply, FastifyRequest } from 'fastify';
import { createErrorResponse, createSuccessResponse } from '../types/ApiResponse';

export function responseFormatter(payload: any, request: FastifyRequest, reply: FastifyReply) {
    if (reply.statusCode >= 400)
        return createErrorResponse('ERROR', payload);

    if (!payload)
        return
    
    if (request.url.includes('/documentation'))
        return payload;

    payload = JSON.parse(payload)
    if (payload && typeof payload === 'object' && payload?.success)
        return payload?.error ? createErrorResponse(payload.error, payload.message) : createSuccessResponse(payload);

    return createSuccessResponse(payload);
}