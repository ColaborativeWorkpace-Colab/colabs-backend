"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBanks = exports.addBankAccountInfo = exports.verify = exports.webHook = exports.update = exports.initializePayment = void 0;
const chapa_node_1 = __importDefault(require("chapa-node"));
const envVars_1 = require("../config/envVars");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const types_1 = require("../types");
const models_1 = require("../models");
const crypto_1 = __importDefault(require("crypto"));
const chapa = new chapa_node_1.default(envVars_1.chapaKey);
const initializePayment = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const { jobId, freelancerId } = req.body;
    const job = await models_1.Job.findById(jobId);
    const jobOwner = await models_1.User.findById(job === null || job === void 0 ? void 0 : job.owner);
    const freelancer = await models_1.User.findById(freelancerId);
    if ((job === null || job === void 0 ? void 0 : job.owner) !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
        res.status(401);
        throw new Error('Unauthorized');
    }
    if (job && jobOwner) {
        const { firstName, lastName, email } = jobOwner;
        const { earnings } = job;
        const txRef = chapa.generateTxRef();
        const response = await chapa.initialize({
            first_name: firstName,
            last_name: lastName,
            email,
            amount: earnings,
            tx_ref: txRef,
            currency: 'ETB',
            return_url: `${envVars_1.frontendURL}/thankyou`,
            callback_url: `${envVars_1.backendURL}/api/v1/chapa/update/${txRef}`,
            subaccounts: [
                {
                    id: freelancer === null || freelancer === void 0 ? void 0 : freelancer.subAccountId,
                    split_type: 'percentage',
                    transaction_charge: 0.5,
                },
            ],
        });
        await models_1.Payment.create({
            freelancerId,
            employerId: jobOwner._id,
            jobId: job._id,
            amount: earnings,
            status: types_1.PaymentStatus.PENDING,
            txRef,
            currency: 'ETB',
        });
        res.send(response);
    }
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }
    if (!jobOwner) {
        res.status(404);
        throw new Error('Job owner not found');
    }
});
exports.initializePayment = initializePayment;
const update = (0, express_async_handler_1.default)(async (req, res) => {
    const { tnxRef } = req.params;
    const payment = await models_1.Payment.findOne({ txRef: tnxRef });
    const job = await models_1.Job.findById(payment === null || payment === void 0 ? void 0 : payment.jobId);
    if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
    }
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }
    const freelancer = await models_1.User.findById(payment === null || payment === void 0 ? void 0 : payment.freelancerId);
    const jobOwner = await models_1.User.findById(payment === null || payment === void 0 ? void 0 : payment.employerId);
    if (!freelancer) {
        res.status(404);
        throw new Error('Freelancer not found');
    }
    if (!jobOwner) {
        res.status(404);
        throw new Error('Job owner not found');
    }
    freelancer.earnings += payment === null || payment === void 0 ? void 0 : payment.amount;
    job.status = types_1.JobStatus.Completed;
    payment.status = types_1.PaymentStatus.PAID;
    await freelancer.save();
    await job.save();
    res.sendStatus(200);
});
exports.update = update;
const webHook = (0, express_async_handler_1.default)(async (req, res) => {
    const colabsHash = crypto_1.default.createHmac('sha256', envVars_1.chapaWebHookHash).update(JSON.stringify(req.body)).digest('hex');
    const chapaHash = req.headers['x-chapa-signature'];
    const { status, tx_ref } = req.body;
    if (colabsHash === chapaHash && status === 'success') {
        const payment = await models_1.Payment.findOne({ txRef: tx_ref });
        const job = await models_1.Job.findById(payment === null || payment === void 0 ? void 0 : payment.jobId);
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }
        if (!job) {
            res.status(404);
            throw new Error('Job not found');
        }
        const freelancer = await models_1.User.findById(payment === null || payment === void 0 ? void 0 : payment.freelancerId);
        const jobOwner = await models_1.User.findById(payment === null || payment === void 0 ? void 0 : payment.employerId);
        if (!freelancer) {
            res.status(404);
            throw new Error('Freelancer not found');
        }
        if (!jobOwner) {
            res.status(404);
            throw new Error('Job owner not found');
        }
        freelancer.earnings += payment === null || payment === void 0 ? void 0 : payment.amount;
        job.status = types_1.JobStatus.Completed;
        payment.status = types_1.PaymentStatus.PAID;
        await freelancer.save();
        await job.save();
        res.sendStatus(200);
    }
    res.status(500);
    throw new Error('Bad Request');
});
exports.webHook = webHook;
const verify = (0, express_async_handler_1.default)(async (req, res) => {
    const { tnxRef } = req.params;
    const transaction = await chapa.verify(tnxRef);
    const payment = await models_1.Payment.findOne({
        txRef: tnxRef,
    }).select(['-v', '-_id']);
    if (payment) {
        res.send({
            message: 'success',
            payment,
            data: transaction,
        });
        return;
    }
    res.status(400);
    throw new Error('No payment with this tnxRef found.');
});
exports.verify = verify;
const addBankAccountInfo = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { bankAccountInfo } = req.body;
    const user = await models_1.User.findById(userId);
    if (user) {
        const subAccountId = await chapa.createSubAccount({
            split_type: 'percentage',
            split_value: 0.5,
            business_name: bankAccountInfo.businessName,
            bank_code: bankAccountInfo.bankCode,
            account_number: bankAccountInfo.accountNumber,
            account_name: bankAccountInfo.accountName,
        });
        const userUpdated = await user.updateOne({ bankAccountInfo, subAccountId });
        if (!userUpdated)
            throw new Error('Bank account info failed to update');
        res.send({
            message: 'Bank account info updated',
        });
    }
    throw new Error('User not found');
});
exports.addBankAccountInfo = addBankAccountInfo;
const getAllBanks = (0, express_async_handler_1.default)(async (_req, res) => {
    const banks = await chapa.getBanks();
    res.send(banks);
});
exports.getAllBanks = getAllBanks;
//# sourceMappingURL=chapa.js.map