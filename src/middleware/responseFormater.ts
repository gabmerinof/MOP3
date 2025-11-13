import { FastifyReply, FastifyRequest } from 'fastify';
import { createErrorResponse, createSuccessResponse } from '../types/ApiResponse';

export function responseFormatter(payload: any, request: FastifyRequest, reply: FastifyReply) {
    if (reply.statusCode >= 400)
        return createErrorResponse('ERROR', payload);

    if (!payload)
        return
    // if (typeof payload === 'string') {
    //     return createSuccessResponse(payload);
    // }
    
    console.log('2222222222222')
    console.log(payload)
    console.log('2222222222222')

    payload = JSON.parse(payload)
    if (payload && typeof payload === 'object' && payload?.success)
        return payload?.error ? createErrorResponse(payload.error, payload.message) : createSuccessResponse(payload);

    return createSuccessResponse(payload);
}