"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationSchema = exports.JobSchema = void 0;
const types_1 = require("../../../types");
const mongoose_1 = __importStar(require("mongoose"));
const JobSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    earnings: {
        type: Number,
        required: true,
    },
    workers: {
        type: [String],
    },
    pendingworkers: {
        type: [String],
    },
    requirements: {
        type: [String],
    },
    status: {
        type: String,
        enum: Object.values(types_1.JobStatus),
        default: types_1.JobStatus.Pending,
    },
    owner: {
        type: mongoose_1.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    paymentVerified: {
        type: Boolean,
        default: false,
    },
    filesReady: {
        type: [String],
    },
}, {
    timestamps: true,
});
exports.JobSchema = JobSchema;
const JobApplicationSchema = new mongoose_1.default.Schema({
    workerId: {
        type: mongoose_1.SchemaTypes.ObjectId,
        required: true,
        ref: 'User',
    },
    jobId: {
        type: mongoose_1.SchemaTypes.ObjectId,
        required: true,
        ref: 'Job',
    },
    coverLetter: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(types_1.JobApplicationStatus),
        default: types_1.JobApplicationStatus.Pending,
    },
}, {
    timestamps: true,
});
exports.JobApplicationSchema = JobApplicationSchema;
//# sourceMappingURL=index.js.map