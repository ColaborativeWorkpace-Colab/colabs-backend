"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllApplicationsSelf = exports.getApplication = exports.getAllApplications = exports.applicationApprove = exports.getJobsPublic = exports.getJobDetail = exports.downloadJobResultPackage = exports.jobReady = exports.addTeamMembers = exports.applyJob = exports.completeJob = exports.deleteJob = exports.postJob = exports.getJobsSelf = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const models_1 = require("../models");
const octokit_1 = require("octokit");
const download_1 = require("../utils/download");
const types_1 = require("../types");
const config_1 = require("../config");
const mailFormats_1 = require("../utils/mailFormats");
const mongoose_1 = require("mongoose");
const getJobsSelf = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const jobs = await models_1.Job.find({ $or: [{ status: types_1.JobStatus.Available }, { status: types_1.JobStatus.Pending }], owner: userId });
    res.json({
        jobs,
    });
});
exports.getJobsSelf = getJobsSelf;
const getJobsPublic = (0, express_async_handler_1.default)(async (req, res) => {
    const searchQuery = req.query;
    const data = await models_1.Job.aggregate([
        {
            $facet: {
                jobs: [
                    {
                        $match: {
                            status: searchQuery.status || types_1.JobStatus.Pending,
                            earnings: { $gte: Number(searchQuery.earnings) || 0 },
                            paymentVerified: { $eq: !!searchQuery.paymentVerified },
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                        },
                    },
                    {
                        $unwind: {
                            path: '$owner',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            earnings: 1,
                            requirements: 1,
                            paymentVerified: 1,
                            createdAt: 1,
                            owner: {
                                _id: 1,
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                imageUrl: 1,
                            },
                        },
                    },
                    {
                        $sort: {
                            createdAt: searchQuery.order === 'asc' ? 1 : -1,
                        },
                    },
                    {
                        $skip: Number(searchQuery.start * searchQuery.limit) || 0,
                    },
                    {
                        $limit: Number(searchQuery.limit) || 10,
                    },
                ],
                total: [
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                        },
                    },
                ],
            },
        },
    ]);
    const total = data[0].total[0].count;
    const hasNextPage = total > Number(searchQuery.start * searchQuery.limit) + Number(searchQuery.limit);
    res.json({
        data: data[0].jobs,
        filters: Object.assign({}, searchQuery),
        hasNextPage,
        total,
    });
});
exports.getJobsPublic = getJobsPublic;
const getJobDetail = (0, express_async_handler_1.default)(async (_req, res) => {
    const jobId = _req.params.jobId;
    const job = await models_1.Job.findById(jobId);
    const applications = await models_1.JobApplication.find({ jobId }).populate('workerId').populate('jobId');
    if (job) {
        res.json({
            job,
            applications,
        });
    }
    else {
        res.status(404);
        throw new Error('Job not found');
    }
});
exports.getJobDetail = getJobDetail;
const postJob = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const recruiterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { title, description, requirements, earnings } = req.body;
    const employer = await models_1.Employer.findById(recruiterId);
    let errorMessage = 'User not found or not an employer';
    if (employer) {
        errorMessage = 'Job Posting Failed';
        const job = await models_1.Job.create({
            title,
            description,
            earnings,
            requirements,
            owner: recruiterId,
        });
        if (job) {
            res.json({
                message: `The ${title} job is successfully posted.`,
            });
            return;
        }
    }
    res.status(404);
    throw new Error(errorMessage);
});
exports.postJob = postJob;
const deleteJob = (0, express_async_handler_1.default)(async (req, res) => {
    const { jobId } = req.query;
    let errorMessage = 'Job not found';
    const job = await models_1.Job.findById(jobId);
    if (job) {
        errorMessage = 'Job is currently being worked on';
        if (job.status === types_1.JobStatus.Available || job.status === types_1.JobStatus.Pending || job.status === types_1.JobStatus.Completed) {
            res.json({
                message: `${job === null || job === void 0 ? void 0 : job.title} is successfully deleted.`,
            });
            return;
        }
    }
    res.status(404);
    throw new Error(errorMessage);
});
exports.deleteJob = deleteJob;
const completeJob = (0, express_async_handler_1.default)(async (req, res) => {
    const { jobId } = req.params;
    const job = await models_1.Job.findByIdAndUpdate(jobId, { status: types_1.JobStatus.Completed });
    let errorMessage = 'Job not found';
    if (job) {
        errorMessage = 'Notification Request Failed';
        const pendingNotifications = job.workers.map((worker) => {
            return {
                title: `${job.title} Completed`,
                message: `Congratulations!! You have completed the ${job.title} job.`,
                userId: worker,
            };
        });
        const notification = await models_1.Notification.insertMany(pendingNotifications);
        if (notification) {
            res.json({
                message: `${job === null || job === void 0 ? void 0 : job.title} completed successfully.`,
            });
            return;
        }
    }
    else {
        res.status(404);
        throw new Error(errorMessage);
    }
});
exports.completeJob = completeJob;
const applyJob = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const workerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const job = await models_1.Job.findById(jobId);
    const worker = await models_1.User.findById(workerId);
    let errorMessage = worker ? 'User is not verified for jobs' : 'User not found';
    if (!job)
        errorMessage = 'Job not found.';
    let statusCode = worker ? 403 : 404;
    const alreadyApplied = await models_1.JobApplication.findOne({
        jobId: job === null || job === void 0 ? void 0 : job._id,
        workerId: worker === null || worker === void 0 ? void 0 : worker._id,
    });
    if ((job === null || job === void 0 ? void 0 : job.owner.toString()) === (workerId === null || workerId === void 0 ? void 0 : workerId.toString()))
        throw new Error('You can`t apply to your own job');
    if (alreadyApplied)
        throw new Error('Already applied for this job');
    if (worker) {
        const jobApplication = await models_1.JobApplication.create({
            workerId,
            jobId,
            coverLetter,
        });
        errorMessage = 'Failed to submit job proposal';
        statusCode = 500;
        if (jobApplication) {
            const job = await models_1.Job.findByIdAndUpdate(jobId, { status: 'Pending', $push: { pendingworkers: workerId } });
            const jobApplicationNotification = {
                title: `Your job has new application`,
                message: `${worker === null || worker === void 0 ? void 0 : worker.firstName} has applied to your job.`,
                userId: worker,
            };
            await models_1.Notification.create(jobApplicationNotification);
            if (job) {
                res.json({
                    message: 'Your proposal has been sent and is pending for approval',
                });
                return;
            }
        }
    }
    res.status(statusCode);
    res.json({
        message: errorMessage,
    });
});
exports.applyJob = applyJob;
const addTeamMembers = (0, express_async_handler_1.default)(async (req, res) => {
    const { jobId } = req.params;
    const { team } = req.body;
    const job = await models_1.Job.findById(jobId);
    const jobOwner = await models_1.User.findById(job === null || job === void 0 ? void 0 : job.owner);
    let errorMessage = 'Job not found';
    if (job) {
        const workers = [...job.workers, ...team];
        const newMembersAdded = await models_1.Job.findByIdAndUpdate(jobId, { workers });
        errorMessage = 'Failed to add new members.';
        if (newMembersAdded) {
            errorMessage = 'Notification Request Failed';
            const pendingNotifications = workers.map((worker) => {
                return {
                    title: `Joined a job team`,
                    message: `${jobOwner === null || jobOwner === void 0 ? void 0 : jobOwner.firstName} has added you to work on their job as a team.`,
                    userId: worker,
                };
            });
            const notification = await models_1.Notification.insertMany(pendingNotifications);
            if (notification) {
                res.json({
                    message: `You have added new members to the job.`,
                });
                return;
            }
        }
    }
    res.status(404);
    throw new Error(errorMessage);
});
exports.addTeamMembers = addTeamMembers;
const jobReady = (0, express_async_handler_1.default)(async (req, res) => {
    const { jobId } = req.params;
    const { projectShas } = req.body;
    const projects = projectShas.split(',');
    const job = await models_1.Job.findByIdAndUpdate(jobId, { status: types_1.JobStatus.Ready, filesReady: projects });
    let errorMessage = 'Job not found';
    if (job) {
        const notification = await models_1.Notification.create({
            title: 'Files Ready',
            message: `Your workers are ready with the files on the ${job.title} job.`,
            userId: job.owner,
        });
        errorMessage = 'Notification Request Failed';
        if (notification) {
            res.json({
                message: `The job is ready to be viewed by the owner.`,
            });
        }
    }
    else {
        res.status(404);
        throw new Error(errorMessage);
    }
});
exports.jobReady = jobReady;
const downloadJobResultPackage = (0, express_async_handler_1.default)(async (req, res) => {
    const { projectName, files } = req.body;
    const client = new octokit_1.Octokit({
        auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });
    const projectRootURL = `GET /repos/${process.env.GITHUB_ORGANIZATION}/${projectName}/contents`;
    const repoResponse = await client.request(projectRootURL);
    const selectedFiles = files.split(',');
    if (repoResponse) {
        const downloadUrls = [];
        repoResponse.data.forEach((value) => {
            if (selectedFiles.includes(value.name)) {
                downloadUrls.push({ name: value.name, download_url: value.download_url });
            }
        });
        const { downloadFileName, data } = await (0, download_1.getFilesfromRepo)(projectName, downloadUrls);
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${downloadFileName}`);
        res.set('Content-Length', data.length);
        res.send(data);
    }
    else {
        res.status(404);
        throw new Error('File Package not found');
    }
});
exports.downloadJobResultPackage = downloadJobResultPackage;
const getAllApplications = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const { jobId } = req.params;
    const { start, limit } = req.query;
    const job = await models_1.Job.findById(jobId);
    if (!job)
        throw new Error('Job not found.');
    const applications = await models_1.JobApplication.aggregate([
        {
            $facet: {
                applications: [
                    {
                        $match: {
                            jobId: new mongoose_1.Types.ObjectId(jobId),
                        },
                    },
                    {
                        $lookup: {
                            from: 'jobs',
                            localField: 'jobId',
                            foreignField: '_id',
                            as: 'job',
                        },
                    },
                    {
                        $unwind: {
                            path: '$job',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'workerId',
                            foreignField: '_id',
                            as: 'worker',
                        },
                    },
                    {
                        $unwind: {
                            path: '$worker',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            coverLetter: 1,
                            status: 1,
                            job: {
                                title: 1,
                                description: 1,
                                earnings: 1,
                                requirements: 1,
                                paymentVerified: 1,
                                createdAt: 1,
                            },
                            worker: {
                                _id: 1,
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                imageUrl: 1,
                            },
                        },
                    },
                    {
                        $skip: Number(start * limit) || 0,
                    },
                    {
                        $limit: Number(limit) || 10,
                    },
                    {
                        $sort: {
                            createdAt: -1,
                        },
                    },
                ],
                total: [
                    {
                        $match: {
                            jobId: new mongoose_1.Types.ObjectId(jobId),
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            count: {
                                $sum: 1,
                            },
                        },
                    },
                ],
            },
        },
    ]);
    const data = applications[0].applications;
    const total = ((_a = applications[0].total[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
    const hasNextPage = total > Number(start * limit) + Number(limit);
    res.send({
        data,
        total,
        hasNextPage,
    });
});
exports.getAllApplications = getAllApplications;
const getAllApplicationsSelf = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const applications = await models_1.JobApplication.aggregate([
        {
            $match: {
                workerId: new mongoose_1.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'job',
            },
        },
        {
            $unwind: {
                path: '$job',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'job.owner',
                foreignField: '_id',
                as: 'owner',
            },
        },
        {
            $unwind: {
                path: '$owner',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 1,
                coverLetter: 1,
                status: 1,
                job: {
                    title: 1,
                    description: 1,
                    earnings: 1,
                    requirements: 1,
                    paymentVerified: 1,
                    createdAt: 1,
                },
                owner: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    imageUrl: 1,
                },
            },
        },
    ]);
    res.send({
        applications,
    });
});
exports.getAllApplicationsSelf = getAllApplicationsSelf;
const applicationApprove = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { applicationId } = req.params;
    const { action } = req.body;
    const jobApplication = await models_1.JobApplication.findById(applicationId).populate('workerId');
    const job = await models_1.Job.findById(jobApplication === null || jobApplication === void 0 ? void 0 : jobApplication.jobId);
    const worker = await models_1.User.findById(jobApplication === null || jobApplication === void 0 ? void 0 : jobApplication.workerId);
    let errorMessage = 'Error';
    if (!job)
        errorMessage = 'Job not found';
    if (!jobApplication)
        throw new Error('Job application not found');
    if (jobApplication.status !== types_1.JobApplicationStatus.Pending)
        throw new Error(`Job application already ${jobApplication.status}`);
    if (userId === jobApplication.workerId) {
        throw new Error(`You can't ${action} your own job`);
    }
    if (jobApplication && job) {
        if (action === types_1.JobApplicationStatus.Accepted) {
            jobApplication.status = types_1.JobApplicationStatus.Accepted;
            await jobApplication.save();
            const link = `${config_1.frontendURL}/freelancer/jobs/${jobApplication.jobId}`;
            await config_1.transport.sendMail({
                to: worker === null || worker === void 0 ? void 0 : worker.email,
                from: config_1.appEmail,
                subject: 'Job application approved.',
                html: (0, mailFormats_1.acceptJobApplicationFormat)(job === null || job === void 0 ? void 0 : job.title, link),
            });
            res.send({
                message: 'Job application approved.',
            });
            return;
        }
        if (action === types_1.JobApplicationStatus.Rejected) {
            jobApplication.status = types_1.JobApplicationStatus.Rejected;
            const link = `${config_1.frontendURL}/jobs/${jobApplication.jobId}`;
            await jobApplication.save();
            await config_1.transport.sendMail({
                to: worker === null || worker === void 0 ? void 0 : worker.email,
                from: config_1.appEmail,
                subject: 'Job application rejected.',
                html: (0, mailFormats_1.rejectJobApplicationFormat)(job === null || job === void 0 ? void 0 : job.title, link),
            });
            res.send({
                message: 'Job application rejected.',
            });
            return;
        }
        if (action === types_1.JobApplicationStatus.Cancelled) {
            if (userId === jobApplication.workerId) {
                jobApplication.status = types_1.JobApplicationStatus.Cancelled;
                await jobApplication.save();
                res.send({
                    message: 'You canceled your job application.',
                });
                return;
            }
        }
    }
    else {
        res.status(404);
        throw new Error(errorMessage);
    }
});
exports.applicationApprove = applicationApprove;
const getApplication = (0, express_async_handler_1.default)(async (req, res) => {
    const { applicationId } = req.params;
    const application = await models_1.JobApplication.findById(applicationId).populate('workerId');
    if (!application)
        throw new Error('Job application not found');
    res.send({
        application,
    });
    return;
});
exports.getApplication = getApplication;
//# sourceMappingURL=jobs.js.map