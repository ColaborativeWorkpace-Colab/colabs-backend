"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const projectValidator = {
    addProject: [
        (0, express_validator_1.body)('members').not().isEmpty().withMessage('Members is required'),
        (0, express_validator_1.body)('title').not().isEmpty().withMessage('Title is required'),
    ],
};
exports.default = projectValidator;
//# sourceMappingURL=projectValidator.js.map