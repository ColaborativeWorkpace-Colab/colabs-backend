"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const types_1 = require("../../types");
const methods_1 = require("./methods");
const PaymentSchema = new mongoose_1.Schema({
    freelancerId: {
        type: String,
        required: true,
    },
    employerId: {
        type: String,
        required: true,
    },
    jobId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(types_1.PaymentStatus),
        default: types_1.PaymentStatus.PENDING,
    },
    txRef: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        default: 'ETB',
    },
}, { timestamps: true });
PaymentSchema.method(methods_1.modelMethods);
PaymentSchema.static(methods_1.staticMethods);
exports.default = (0, mongoose_1.model)('Payment', PaymentSchema);
//# sourceMappingURL=index.js.map