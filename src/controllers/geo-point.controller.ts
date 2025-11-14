import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { PointType } from '../entities/geo-point.entity';
import { User } from '../entities/user.entity';
import { auth } from '../middleware/auth';
import { validateGeoPointSchema, validateProximityFilterSchema } from '../middleware/validation';
import { GeoPointService, UpdatePointData } from '../services/geo-point.service';
import { AppError } from '../utils/AppError';
import { IController } from './Interfaces/IController';

@injectable('Request')
export default class GeoPointController implements IController {

  constructor(@inject(GeoPointService) private geoPointService: GeoPointService) { }

  getPath(): string {
    return "/points";
  }

  registerRoutes(app: FastifyInstance) {
    app.register(async (app) => {
      app.addHook('onRequest', auth);

      app.get('/', {
        schema: validateProximityFilterSchema,
        handler: this.getAllPoints.bind(this)
      });
      app.get('/geojson', this.getGeoJSON.bind(this));
      app.get('/:geoPointId', this.getPointById.bind(this));
      app.get('/user/my-points', this.getUserPoints.bind(this));
      app.post('/', {
        schema: validateGeoPointSchema,
        handler: this.createPoint.bind(this)
      });
      app.put('/:geoPointId', {
        schema: validateGeoPointSchema,
        handler: this.updatePoint.bind(this)
      });
      app.delete('/:geoPointId', this.deletePoint.bind(this));
    });
  }

  private async getAllPoints(req: FastifyRequest, reply: FastifyReply) {
    const { type, lat, lng, radius } = req.query as {
      type?: string;
      lat?: string;
      lng?: string;
      radius?: string;
    };;

    let filter;
    if (lat && lng && radius) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);

      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm))
        throw new AppError('', 'Latitud, Longitud y radio deben ser números válidos', 400);

      filter = {
        lat: latitude,
        lng: longitude,
        radius: radiusKm,
        type: type as PointType
      };
    }

    const points = await this.geoPointService.findAll(filter);
    return reply.code(200).send({
      ...points
    });
  }

  private async getUserPoints(req: FastifyRequest, reply: FastifyReply) {
    const userid = (req.user as any).userId;

    try {
      const geoJSON = await this.geoPointService.getGeoJSOByUser(userid);
      
      return reply.send({
        points: geoJSON,
        count: geoJSON?.length
      });
    } catch (error: any) {
      throw new AppError('', error.message, 500);
    }
  }

  private async getGeoJSON(req: FastifyRequest, reply: FastifyReply) {
    try {
      const geoJSON = await this.geoPointService.getGeoJSON();
      
      return reply.send({
        ...geoJSON
      });
    } catch (error: any) {
      throw new AppError('', error.message, 500);
    }
  }

  private async getPointById(req: FastifyRequest, reply: FastifyReply) {
    const { geoPointId } = req.params as any;
    const point = await this.geoPointService.findById(geoPointId!);
    
    return reply.send({
      ...point
    });
  }

  private async createPoint(req: FastifyRequest, reply: FastifyReply) {
    const { latitude, longitude, type, description } = req.body as any;

    if (!latitude || !longitude || !type)
      throw new AppError('', 'Latitud, longitud y tipo son requeridos', 400);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90)
      throw new AppError('', 'Latitud debe de estar entre -90 y 90', 400);

    if (isNaN(lng) || lng < -180 || lng > 180)
      throw new AppError('', 'Longitud debe de estar entre -180 y 180', 400);

    if (!Object.values(PointType).includes(type))
      throw new AppError('', `Tipo debe de contener uno de éstos valores: ${Object.values(PointType).join(', ')}`, 400);

    const user = new User();
    user.userid = (req.user as any).userId;

    const point = await this.geoPointService.createPoint({
      latitude: lat,
      longitude: lng,
      type,
      description,
      user
    });

    return reply.status(201).send({
      ...point
    });
  }

  private async updatePoint(req: FastifyRequest, reply: FastifyReply) {
    const { geoPointId } = req.params as any;
    const updateData = req.body;
    const userId = (req.user as any).userId;

    const point = await this.geoPointService.updatePoint(geoPointId!, userId, updateData as UpdatePointData);
    reply.send({
      ...point
    });
  }

  private async deletePoint(req: FastifyRequest, reply: FastifyReply) {
    const { geoPointId } = req.params as any;
    const userId = (req.user as any).userId;

    await this.geoPointService.deletePoint(geoPointId!, userId);
    
    return reply.send({
      message: 'Punto eliminado con éxito'
    });
  }
}