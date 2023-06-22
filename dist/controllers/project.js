"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPayment = exports.projectDetail = exports.getProjects = exports.updateProject = exports.addProject = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_status_1 = require("http-status");
const Project_1 = __importDefault(require("../models/Project"));
const octokit_1 = require("octokit");
const models_1 = require("../models");
const addProject = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    const { title, members } = req.body;
    try {
        if ((user === null || user === void 0 ? void 0 : user.type) !== 'Employer') {
            res.status(http_status_1.FORBIDDEN).send({
                message: 'You need client account to create project',
            });
            return;
        }
        const projectValidName = title.replace(/\s/g, '-');
        const project = await Project_1.default.create({
            title: projectValidName,
            owner: user === null || user === void 0 ? void 0 : user._id,
            members,
        });
        const client = new octokit_1.Octokit({
            auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
        });
        if (project) {
            const repoResponse = await client.request(`POST /orgs/${process.env.GITHUB_ORGANIZATION}/repos`, {
                name: projectValidName,
                homepage: 'https://github.com',
                private: true,
            });
            if (repoResponse.status === 201) {
                const repo = await models_1.Repository.create({ name: projectValidName, owner: user._id });
                project.repositoryId = repo._id;
                res.status(http_status_1.CREATED).send({
                    message: 'Project created successfully.',
                    data: project,
                });
                return;
            }
        }
    }
    catch (error) {
        throw new Error(error);
    }
});
exports.addProject = addProject;
const updateProject = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const user = req.user;
    const { id } = req.params;
    const { title, members, status } = req.body;
    const project = await Project_1.default.findById(id);
    if (project) {
        if (((_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString()) !== (project === null || project === void 0 ? void 0 : project.owner.toString())) {
            res.status(http_status_1.FORBIDDEN).send({
                message: 'You are not the owner of this project',
            });
            return;
        }
        const projectValidName = title.replace(/\s/g, '-');
        project.title = projectValidName;
        project.members = [...members];
        project.status = status;
        await project.save();
        res.status(http_status_1.OK).send({
            message: 'Project updated successfully.',
            data: project,
        });
        return;
    }
    else {
        res.status(http_status_1.FORBIDDEN).send({
            message: 'Project not found',
        });
        return;
    }
});
exports.updateProject = updateProject;
const getProjects = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if ((user === null || user === void 0 ? void 0 : user.type) !== 'Employer') {
        res.status(http_status_1.FORBIDDEN).send({
            message: 'You need client account to create project',
        });
        return;
    }
    const projects = await Project_1.default.find({
        owner: user._id,
    });
    res.status(http_status_1.CREATED).send({
        message: 'Projects fetched successfully.',
        data: projects,
    });
    return;
});
exports.getProjects = getProjects;
const projectDetail = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    if ((user === null || user === void 0 ? void 0 : user.type) !== 'Employer') {
        res.status(http_status_1.FORBIDDEN).send({
            message: 'You need client account to create project',
        });
        return;
    }
    const projects = await Project_1.default.findById(id).populate('members.workerId');
    res.status(http_status_1.CREATED).send({
        message: 'Projects fetched successfully.',
        data: projects,
    });
    return;
});
exports.projectDetail = projectDetail;
const requestPayment = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    if ((user === null || user === void 0 ? void 0 : user.type) !== 'Freelancer') {
        res.status(http_status_1.FORBIDDEN).send({
            message: 'You need freelancer account to create project',
        });
        return;
    }
    const project = await Project_1.default.findById(id);
    if (!project)
        throw new Error('Project not found');
    const updatedMembers = project.members.map((member) => {
        var _a;
        if (member.workerId.toString() === ((_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString())) {
            return Object.assign(Object.assign({}, member), { paymentRequested: true });
        }
        return member;
    });
    project.members = [...updatedMembers];
    await project.save();
    res.status(http_status_1.OK).send({
        message: 'Payment successfully.',
    });
    return;
});
exports.requestPayment = requestPayment;
//# sourceMappingURL=project.js.map