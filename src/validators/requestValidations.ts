import { body, param, query } from 'express-validator';
import { RequestStatus, RequestType } from '../types/request';

const requestValidations = {
  submitRequest: [
    body('type')
      .isIn([RequestType.COMPLAIN, RequestType.VERIFICATION])
      .withMessage('Request type is incorrect or missign'),
    body('legalInfo').isObject().withMessage('LegalInfo should be an object'),
    body('legalInfo.bank').isObject().withMessage('LegalInfo bank should be a object'),
    body('legalInfo.legalDoc').isString().withMessage('LegalInfo legalDoc should be a string'),
    body('legalInfo.tradeLicense').isString().withMessage('LegalInfo tradeLicense should be a string'),
  ],
  // TODO: update request validation
  updateRequest: [
    param('id').not().isEmpty().isMongoId().withMessage('Invalid request id'),
    query('action').isIn([RequestStatus.APPROVED, RequestStatus.REJECTED]).withMessage('Invalid request status'),
  ],
};

export default requestValidations;
