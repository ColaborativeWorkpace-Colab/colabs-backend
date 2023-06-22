"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const project_1 = require("../../types/project");
const methods_1 = require("./methods");
const WorkerInfo = new mongoose_1.Schema({
    workerId: {
        type: mongoose_1.SchemaTypes.ObjectId,
        ref: 'User',
    },
    earnings: Number,
    paymentRequested: {
        type: Boolean,
        default: false,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
});
const projectSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    repositoryId: mongoose_1.Types.ObjectId,
    owner: mongoose_1.Types.ObjectId,
    status: {
        type: String,
        default: project_1.ProjectStatus.ONGOING,
        enum: Object.values(project_1.ProjectStatus),
    },
    members: [WorkerInfo],
}, {
    timestamps: true,
});
projectSchema.method(methods_1.modelMethods);
projectSchema.static(methods_1.staticMethods);
exports.default = (0, mongoose_1.model)('Project', projectSchema);
//# sourceMappingURL=index.js.map