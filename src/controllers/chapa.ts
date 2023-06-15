import Chapa from 'chapa-node';
import { backendURL, chapaKey, frontendURL, chapaWebHookHash } from '../config/envVars';
import asyncHandler from 'express-async-handler';
import { BankAccountInfo, JobStatus, PaymentStatus, Request, Response } from '../types';
import { Job, User, Payment } from '../models';
import crypto from 'crypto';

const chapa = new Chapa(chapaKey);

/**
 * Initialize or start payment process
 * @route POST /api/v1/chapa/init
 * @access Private
 */
const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const { jobId, freelancerId } = req.body;
  const job = await Job.findById(jobId);
  const jobOwner = await User.findById(job?.owner);
  const freelancer = await User.findById(freelancerId);

  if (job?.owner !== req.user?._id) {
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
      return_url: `${frontendURL}/thankyou`,
      callback_url: `${backendURL}/api/v1/chapa/update/${txRef}`,
      subaccounts: [
        {
          id: freelancer?.subAccountId as string,
          split_type: 'percentage',
          transaction_charge: 0.5, // todo update me later
        },
      ],
    });

    await Payment.create({
      freelancerId,
      employerId: jobOwner._id,
      jobId: job._id,
      amount: earnings,
      status: PaymentStatus.PENDING,
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

/**
 * Update the initialized payment item- when user get paid
 * @route POST /api/v1/chapa/update
 * @access Private
 */
const update = asyncHandler(async (req: Request, res: Response) => {
  const { tnxRef } = req.params;
  const payment = await Payment.findOne({ txRef: tnxRef });
  const job = await Job.findById(payment?.jobId);
  if (!payment) {
    res.status(404);

    throw new Error('Payment not found');
  }
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  const freelancer = await User.findById(payment?.freelancerId);
  const jobOwner = await User.findById(payment?.employerId);

  if (!freelancer) {
    res.status(404);
    throw new Error('Freelancer not found');
  }

  if (!jobOwner) {
    res.status(404);
    throw new Error('Job owner not found');
  }

  freelancer.earnings += payment?.amount as number;
  job.status = JobStatus.Completed;
  payment.status = PaymentStatus.PAID;
  await freelancer.save();
  await job.save();

  res.sendStatus(200);
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
    const job = await Job.findById(payment?.jobId);
    if (!payment) {
      res.status(404);

      throw new Error('Payment not found');
    }
    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    const freelancer = await User.findById(payment?.freelancerId);
    const jobOwner = await User.findById(payment?.employerId);

    if (!freelancer) {
      res.status(404);
      throw new Error('Freelancer not found');
    }

    if (!jobOwner) {
      res.status(404);
      throw new Error('Job owner not found');
    }

    freelancer.earnings += payment?.amount as number;
    job.status = JobStatus.Completed;
    payment.status = PaymentStatus.PAID;
    await freelancer.save();
    await job.save();

    res.sendStatus(200);
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
