import { FastifyReply, FastifyRequest } from 'fastify';
import { createErrorResponse, createSuccessResponse } from '../types/ApiResponse';

export function responseFormatter(payload: any, request: FastifyRequest, reply: FastifyReply) {
    if (request.url.includes('/documentation'))
        return payload;

    const contentType = reply.getHeader('content-type') as string;
    try {
        if (contentType && String(payload) !== '[object Object]' && contentType.indexOf('application/json') > -1) {
            const responseData = JSON.parse(String(payload));

            if (reply.statusCode >= 400)
                return createErrorResponse('ERROR', responseData);

            if (responseData && typeof responseData === 'object' && !responseData?.success)
                return JSON.stringify(responseData?.error ? createErrorResponse(responseData.error, responseData.message) : createSuccessResponse(responseData));
        }
    } catch (e) { }

    return JSON.stringify(reply.statusCode >= 400 ? createErrorResponse('ERROR', payload) : createSuccessResponse(payload));
}