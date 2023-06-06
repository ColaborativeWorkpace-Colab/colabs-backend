"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const chapaValidator = {
    init: [
        (0, express_validator_1.body)('jobId').trim().isMongoId().withMessage('jobId should be valid mongodb Id'),
        (0, express_validator_1.body)('freelancerId').trim().isMongoId().withMessage('freelancerId should be valid mongodb Id'),
    ],
    addBankInfo: [
        (0, express_validator_1.body)('bankCode').isString().trim().withMessage('bankCode is required and should be string'),
        (0, express_validator_1.body)('accountNumber').isString().trim().withMessage('accountNumber is required and should be string'),
        (0, express_validator_1.body)('accountName').isString().trim().withMessage('accountName is required and should be string'),
        (0, express_validator_1.body)('businessName').isString().trim().withMessage('businessName is required and should be string'),
    ],
};
exports.default = chapaValidator;
//# sourceMappingURL=chapaValidator.js.map