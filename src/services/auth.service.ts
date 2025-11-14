import { FastifyRequest } from 'fastify';
import { injectable } from 'inversify';
import { DatabaseMikro } from '../config/database';
import { User } from '../entities/user.entity';
import { AppError } from '../utils/AppError';
import { UserRepository } from './../repositories/user.repository';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
}

@injectable('Request')
export class AuthService {

  async register(data: RegisterData) {
    const { username, password, email } = data;

    if (!username || !password) 
      throw new AppError('AUTH_ERROR', 'Username and password are required', 400);

    if (await this.getRepository().usernameExists(username)) 
      throw new AppError('AUTH_ERROR', 'Username already exists', 400);

    if (email && await this.getRepository().emailExists(email)) 
      throw new AppError('AUTH_ERROR', 'Email already exists', 400);

    const user = this.getRepository().create({
      username,
      password,
      email
    });

    await this.getRepository().insert(user!);

    return user;
  }

  async login(data: LoginData, req: FastifyRequest) {
    const { username, password } = data;

    if (!username || !password) 
      throw new AppError('AUTH_ERROR', 'Username y password son requeridos', 400);

    const user = await this.getRepository().findByUsername(username);
    if (!user) 
      throw new AppError('AUTH_ERROR', 'Credenciales inválidas', 401);

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) 
      throw new AppError('AUTH_ERROR', 'Credenciales inválidas', 401);

    const token = req.server.jwt.sign(
      { userId: user.userid, username: user.username },
      { expiresIn: '24h' }
    );

    return {
      message: 'Autenticación exitosa',
      token,
      user: user.toJSON()
    };
  }

  public getRepository(): UserRepository{

    return DatabaseMikro.getRepository(User);
  }
}