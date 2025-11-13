import { AppError } from '../utils/AppError';
// import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

export const validateRegisterSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50
      },
      password: {
        type: 'string',
        minLength: 6
      },
      email: {
        type: 'string',
        format: 'email'
      }
    },
    errorMessage: {
      properties: {
        username: 'username debe tener entre 3 y 50 caracteres.',
        password: 'password debe tener al menos 6 caracteres.',
        email: 'email debe ser un correo válido.'
      },
      required: {
        username: 'username es requerido.',
        password: 'password es requerido.'
      }
    }
  }
};

export const validateLoginSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string'
      },
      password: {
        type: 'string'
      }
    },
    errorMessage: {
      type: 'El cuerpo debe ser un objeto JSON válido',
      required: {
        username: 'username es requerido.',
        password: 'password es requerido.'
      },
      properties: {
        username: 'username debe ser una cadena de texto.',
        password: 'password debe ser una cadena de texto.'
      }
    }
  }
};

export const validateGeoPointSchema = {
  body: {
    type: 'object',
    required: ['latitude', 'longitude', 'type', 'userid'],
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180
      },
      type: {
        type: 'string',
        enum: ['accidente', 'congestión', 'obstrucción', 'otro']
      },
      description: {
        type: 'string',
        maxLength: 500
      },
      userid: {
        type: 'string'
      }
    },
    errorMessage: {
      type: 'El cuerpo debe ser un objeto JSON válido',
      required: {
        latitude: 'latitude es requerido',
        longitude: 'longitude es requerido',
        type: 'type es requerido',
        userid: 'userid es requerido'
      },
      properties: {
        latitude: 'latitude debe ser un número entre -90 y 90',
        longitude: 'longitude debe ser un número entre -180 y 180',
        type: 'type debe ser uno de: accidente, congestión, obstrucción, otro',
        description: 'description no puede exceder los 500 caracteres',
        userid: 'userid debe ser una cadena de texto'
      }
    }
  }
};

export const validateProximityFilterSchema = {
  querystring: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['accidente', 'congestión', 'obstrucción', 'otro']
      },
      lat: {
        type: 'number',
        minimum: -90,
        maximum: 90
      },
      long: {
        type: 'number',
        minimum: -180,
        maximum: 180
      },
      radius: {
        type: 'number',
        minimum: 0.1,
        maximum: 100
      }
    },
    errorMessage: {
      type: 'Los parámetros de consulta deben ser válidos',
      properties: {
        type: 'type debe ser: accidente, congestión, obstrucción u otro',
        lat: 'lat debe ser un número entre -90 y 90',
        long: 'long debe ser un número entre -180 y 180',
        radius: 'radius debe ser un número entre 0.1 y 100'
      }
    }
  }
};