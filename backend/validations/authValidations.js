import Joi from 'joi';

export const registerValidation = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    location: Joi.string().max(100).allow('', null),
    occupation: Joi.string().max(100).allow('', null),
    avatar: Joi.string().allow('', null)
});

export const loginValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});
