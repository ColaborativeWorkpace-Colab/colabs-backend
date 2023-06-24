import Chapa from 'chapa-node';
import { backendURL, chapaKey, frontendURL, chapaWebHookHash } from '../config/envVars';
import asyncHandler from 'express-async-handler';
import { BankAccountInfo, PaymentStatus, Request, Response } from '../types';
import { User, Payment, Project } from '../models';
import crypto from 'crypto';

export const chapa = new Chapa(chapaKey);

/**
 * Initialize or start payment process
 * @route POST /api/v1/chapa/init
 * @access Private
 */
const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { freelancerId, projectId, earnings } = req.body;

  const project = await Project.findById(projectId).populate('owner');
  const employer = await User.findById(user?._id);
  const freelancer = await User.findById(freelancerId);

  if (user?._id?.toString() !== project?.owner.toString()) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  if (project && employer && freelancer) {
    const { firstName, lastName, email } = employer;
    const txRef = chapa.generateTxRef();

    const response = await chapa.initialize({
      first_name: firstName,
      last_name: lastName,
      email,
      amount: earnings,
      tx_ref: txRef,
      currency: 'ETB',
      return_url: `${frontendURL}/client/workspace/projects/${projectId}`,
      callback_url: `${backendURL}/api/v1/chapa/update/${txRef}`,
      subaccounts: [
        {
          id: freelancer?.subAccountId as string,
          split_type: 'percentage',
          transaction_charge: 0.3, // todo update me later
        },
      ],
    });

    await Payment.create({
      freelancerId,
      employerId: employer._id,
      projectId,
      amount: earnings,
      status: PaymentStatus.PENDING,
      txRef,
      currency: 'ETB',
    });

    res.send(response);
  }

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!employer) {
    res.status(404);
    throw new Error('Project owner not found');
  }
});

/**
 * Update the initialized payment item- when user get paid
 * @route POST /api/v1/chapa/update/:tnxRef
 * @access Private
 */
const update = asyncHandler(async (req: Request, res: Response) => {
  const { tnxRef } = req.params;
  const payment = await Payment.findOne({ txRef: tnxRef });
  const project = await Project.findById(payment?.projectId);
  if (!payment) {
    res.status(404);

    throw new Error('Payment Information not found with this transaction reference');
  }
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const freelancer = await User.findById(payment?.freelancerId);
  if (!freelancer) {
    res.status(404);
    throw new Error('Freelancer not found');
  }

  project.members.map((member) => {
    if (member.workerId.toString() === freelancer._id.toString()) {
      member.isPaid = true;
    }
  });

  freelancer.earnings += payment?.amount;
  payment.status = PaymentStatus.PAID;
  await freelancer.save();
  await project.save();
  await payment.save();

  res.sendStatus(200);
  return;
});

/**
 * Additional WebHook function to handle after payment- when user get paid
 * @route POST /api/v1/chapa/webhook
 * @access Private
 */
const webHook = asyncHandler(async (req: Request, res: Response) => {
  const colabsHash = crypto.createHmac('sha256', chapaWebHookHash).update(JSON.stringify(req.body)).digest('hex');
  const chapaHash = req.headers['x-chapa-signature'];
  const { status, tx_ref } = req.body;

  if (colabsHash === chapaHash && status === 'success') {
    const payment = await Payment.findOne({ txRef: tx_ref });
    const project = await Project.findById(payment?.projectId);
    if (!payment) {
      res.status(404);

      throw new Error('Payment Information not found with this transaction reference');
    }
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    const freelancer = await User.findById(payment?.freelancerId);
    if (!freelancer) {
      res.status(404);
      throw new Error('Freelancer not found');
    }

    project.members.map((member) => {
      if (member.workerId.toString() === freelancer._id.toString()) {
        member.isPaid = true;
      }
    });
    freelancer.earnings += payment?.amount;
    payment.status = PaymentStatus.PAID;
    await freelancer.save();
    await project.save();
    await payment.save();

    res.sendStatus(200);
    return;
  }

  res.status(500);
  throw new Error('Bad Request');
});

/**
 * Find and Verify payment incase of dispute
 * @route Get /api/v1/chapa/init
 * @access Private/Admin
 */
const verify = asyncHandler(async (req: Request, res: Response) => {
  const { tnxRef } = req.params as { tnxRef: string };
  const transaction = await chapa.verify(tnxRef);
  const payment = await Payment.findOne({
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

/**
 * Add Bank Account Info
 * @route PUT /api/v1/chapa/add-bank-info
 * @access Private
 */
const addBankAccountInfo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { bankAccountInfo } = req.body as { bankAccountInfo: BankAccountInfo };

  const user = await User.findById(userId);

  if (user) {
    const subAccountId = await chapa.createSubAccount({
      split_type: 'percentage',
      split_value: 0.5, // todo update me later
      business_name: bankAccountInfo.businessName,
      bank_code: bankAccountInfo.bankCode,
      account_number: bankAccountInfo.accountNumber,
      account_name: bankAccountInfo.accountName,
    });

    const userUpdated = await user.updateOne({ bankAccountInfo, subAccountId });

    if (!userUpdated) throw new Error('Bank account info failed to update');

    res.send({
      message: 'Bank account info updated',
    });
  }

  throw new Error('User not found');
});

/**
 * Get all Banks
 * @route PUT /api/v1/chapa/banks
 * @access Private
 */
const getAllBanks = asyncHandler(async (_req: Request, res: Response) => {
  const banks = await chapa.getBanks();
  res.send(banks);
});

export { initializePayment, update, webHook, verify, addBankAccountInfo, getAllBanks };
