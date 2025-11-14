import { FastifyInstance } from "fastify";

export default interface IController {
    registerRoutes(app: FastifyInstance): void;
    getPath(): string;
}