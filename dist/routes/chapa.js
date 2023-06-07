"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chapaValidator_1 = __importDefault(require("../validators/chapaValidator"));
const chapa_1 = require("../controllers/chapa");
const authMiddleware_1 = require("../middleware/authMiddleware");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const route = express_1.default.Router();
route.post('/init', chapaValidator_1.default.init, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, chapa_1.initializePayment);
route.put('/add-bank-info', chapaValidator_1.default.addBankInfo, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, chapa_1.addBankAccountInfo);
exports.default = route;
//# sourceMappingURL=chapa.js.map