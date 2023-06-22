import { Schema, SchemaTypes, Types, model } from 'mongoose';
import { ProjectDocument, ProjectModel, ProjectStatus, IWorkerInfo } from '../../types/project';
import { staticMethods, modelMethods } from './methods';

const WorkerInfo: Schema<IWorkerInfo> = new Schema({
  workerId: {
    type: SchemaTypes.ObjectId,
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

const projectSchema: Schema<ProjectDocument, ProjectModel> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    repositoryId: Types.ObjectId,
    owner: Types.ObjectId,
    status: {
      type: String,
      default: ProjectStatus.ONGOING,
      enum: Object.values(ProjectStatus),
    },
    members: [WorkerInfo],
  },
  {
    timestamps: true,
  },
);

projectSchema.method(modelMethods);
projectSchema.static(staticMethods);

export default model<ProjectDocument, ProjectModel>('Project', projectSchema);
