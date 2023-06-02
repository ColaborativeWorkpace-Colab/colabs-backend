import { Chapa, SplitType } from 'chapa-nodejs';
import { backendURL, chapaKey, frontendURL } from '../config/envVars';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'src/types';

const chapa = new Chapa(chapaKey);

/**
 * Initialize or start payment process
 * @route POST /api/v1/chapa/init
 * @access Private
 */
const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, amount } = req.body;
  const txRef = await chapa.generateTransactionReference();

  const response = await chapa.initialize({
    first_name: firstName,
    last_name: lastName,
    email,
    amount,
    tx_ref: txRef,
    currency: 'ETB',
    return_url: `${frontendURL}/thankyou`,
    callback_url: `${backendURL}/api/v1/chapa/update/${txRef}`,
    // todo discuss this at the meeting
    subaccounts: [
      {
        id: 'subaccountId',
        split_type: SplitType.PERCENTAGE,
        transaction_charge: 0,
      },
    ],
  });

  res.send(response);
});

/**
 * Update the initialized payment item- when user get paid
 * @route POST /api/v1/chapa/update
 * @access Private
 */
const update = asyncHandler(async (req: Request, res: Response) => {
  console.log(req.body),
    res.send({
      message: 'success',
      data: req.body,
    });
});

/**
 * Additional WebHook function to handle after payment- when user get paid
 * @route POST /api/v1/chapa/webhook
 * @access Private
 */
const webHook = asyncHandler(async (req: Request, res: Response) => {
  console.log(req.body),
    res.send({
      message: 'success',
      data: req.body,
    });
});

/**
 * Find and Verify payment incase of dispute
 * @route Get /api/v1/chapa/init
 * @access Private/Admin
 */
const verify = asyncHandler(async (req: Request, res: Response) => {
  console.log(req.body),
    res.send({
      message: 'success',
      data: req.body,
    });
});

export { initializePayment, update, webHook, verify };
