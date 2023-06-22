"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_1 = require("../controllers/project");
const projectValidator_1 = __importDefault(require("../validators/projectValidator"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router
    .route('/')
    .get(authMiddleware_1.protect, project_1.getProjects)
    .post(projectValidator_1.default.addProject, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, project_1.addProject);
router.route('/:id').get(authMiddleware_1.protect, project_1.projectDetail).put(authMiddleware_1.protect, project_1.updateProject);
router.route('/request-payment/:id').get(authMiddleware_1.protect, project_1.requestPayment);
exports.default = router;
//# sourceMappingURL=project.js.map