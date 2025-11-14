import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { validateLoginSchema, validateRegisterSchema } from '../middleware/validation';
import { AuthService, LoginData, RegisterData } from '../services/auth.service';
import { IController } from './Interfaces/IController';

@injectable('Request')
export default class AuthController implements IController {

  constructor(@inject(AuthService) private authService: AuthService) {}

  getPath(): string {
    return "/auth";
  }

  registerRoutes(app: FastifyInstance) {
    app.post('/register', {
      schema: validateRegisterSchema,
      handler: this.register.bind(this)
    });

    app.post('/login', {
      schema: validateLoginSchema,
      handler: this.login.bind(this)
    });
  }

  private async register(req: FastifyRequest, reply: FastifyReply) {
    const user = await this.authService.register(req.body as RegisterData);
    return reply.status(201).send({
      ...user!.toJSON()
    });
  }

  private async login(req: FastifyRequest, reply: FastifyReply) {
    const result = await this.authService.login(req.body as LoginData, req);

    return ({
      ...result
    });
  }
}