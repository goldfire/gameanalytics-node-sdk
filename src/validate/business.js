/**
 * gameanalytics-node-sdk
 * Copyright (c) 2018, GoldFire Studios, Inc.
 * https://goldfirestudios.com
 */

/**
 * Business event validation data.
 */
module.exports = {
  amount: {
    type: 'number',
    required: true,
  },
  currency: {
    type: 'string',
    pattern: /^[A-Z]{3}$/,
    required: true,
  },
  event_id: {
    type: 'string',
    pattern: /^[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}:[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}$/,
    required: true,
  },
  cart_type: {
    type: 'string',
    maxLength: 32,
    required: false,
  },
  transaction_num: {
    type: 'number',
    minimum: 0,
    required: true,
  },
  receipt_info: {
    type: 'object',
    required: false,
  },
};
