import Joi from 'joi';
import * as dotenv from 'dotenv';
dotenv.config();

const envSchema = Joi.object({
  MONGO_URL_DEV: Joi.string().required().description('MongoDb connection URL'),
  MONGO_URL_PROD: Joi.string().required().description('MongoDb connection URL'),
  PORT: Joi.string().required().description('PORT'),
  JWT_SECRET_KEY: Joi.string().required().description('JWT secrete'),
  NODE_ENV: Joi.string().allow('development', 'test', 'production').default('development'),
  GOOGLE_CLIENT_ID: Joi.string().required().description('Google client id'),
  GOOGLE_CLIENT_SECRET: Joi.string().required().description('Google client secret'),
  GOOGLE_CALLBACK_URL: Joi.string().required().description('Google callback url'),
})
  .unknown()
  .required();

const { error, value } = envSchema.validate(process.env);

if (error) throw new Error(`evn variables error ${error.message}`);

export const port = value.PORT;
export const jwtSecrete = value.JWT_SECRET_KEY;
export const nodeEnv = value.NODE_ENV;
export const mongoUrl = nodeEnv === 'development' ? value.MONGO_URL_DEV : value.MONGO_URL_PROD;
export const googleClientId = value.GOOGLE_CLIENT_ID;
export const googleClientSecret = value.GOOGLE_CLIENT_SECRET;
export const googleCallbackUrl = value.GOOGLE_CALLBACK_URL;
