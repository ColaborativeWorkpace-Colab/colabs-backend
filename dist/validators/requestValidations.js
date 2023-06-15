"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const request_1 = require("../types/request");
const requestValidations = {
    submitRequest: [
        (0, express_validator_1.body)('type')
            .isIn([request_1.RequestType.COMPLAIN, request_1.RequestType.VERIFICATION])
            .withMessage('Request type is incorrect or missign'),
        (0, express_validator_1.body)('legalInfo').isObject().withMessage('LegalInfo should be an object'),
        (0, express_validator_1.body)('legalInfo.bank').isObject().withMessage('LegalInfo bank should be a object'),
        (0, express_validator_1.body)('legalInfo.legalDoc').isString().withMessage('LegalInfo legalDoc should be a string'),
        (0, express_validator_1.body)('legalInfo.tradeLicense').isString().withMessage('LegalInfo tradeLicense should be a string'),
    ],
    updateRequest: [
        (0, express_validator_1.param)('id').not().isEmpty().isMongoId().withMessage('Invalid request id'),
        (0, express_validator_1.query)('action').isIn([request_1.RequestStatus.APPROVED, request_1.RequestStatus.REJECTED]).withMessage('Invalid request status'),
    ],
};
exports.default = requestValidations;
//# sourceMappingURL=requestValidations.js.map