/**
 * gameanalytics-node-sdk
 * Copyright (c) 2018, GoldFire Studios, Inc.
 * https://goldfirestudios.com
 */

/**
 * Error event validation data.
 */
module.exports = {
  severity: {
    type: 'string',
    enum: [
      'debug',
      'info',
      'warning',
      'error',
      'critical',
    ],
    required: true,
  },
  message: {
    type: 'string',
    maxLength : 8192,
    required: true,
  },
};
