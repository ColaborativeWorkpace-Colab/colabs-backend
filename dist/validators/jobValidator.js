"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const types_1 = require("../types");
const jobValidation = {
    createJob: [
        (0, express_validator_1.body)('title').not().isEmpty().withMessage('Title is required'),
        (0, express_validator_1.body)('description').not().isEmpty().withMessage('Description is required'),
        (0, express_validator_1.body)('earnings').not().isEmpty().withMessage('Earnings is required'),
        (0, express_validator_1.body)('requirements').isArray().withMessage('Requirements should be an array'),
    ],
    applyToJob: [
        (0, express_validator_1.param)('jobId').not().isEmpty().isMongoId().withMessage('JobId param is required'),
        (0, express_validator_1.body)('coverLetter').not().isEmpty().withMessage('CoverLetter is required'),
    ],
    applicationApprove: [
        (0, express_validator_1.param)('applicationId').not().isEmpty().isMongoId().withMessage('ApplicationId param is required'),
        (0, express_validator_1.body)('action')
            .isIn([types_1.JobApplicationStatus.Accepted, types_1.JobApplicationStatus.Rejected, types_1.JobApplicationStatus.Cancelled])
            .withMessage('Job Application actions is incorrect or missign'),
    ],
    getAllApplication: [(0, express_validator_1.body)('jobId').not().isEmpty().isMongoId().withMessage('jobId is required')],
    team: [
        (0, express_validator_1.param)('jobId').not().isEmpty().isMongoId().withMessage('JobId param is required'),
        (0, express_validator_1.body)('team').not().isEmpty().isArray().withMessage('team is required to have atleast one element in the array'),
    ],
};
exports.default = jobValidation;
//# sourceMappingURL=jobValidator.js.map