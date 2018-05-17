/**
 * gameanalytics-node-sdk
 * Copyright (c) 2018, GoldFire Studios, Inc.
 * https://goldfirestudios.com
 */

/**
 * Resource event validation data.
 */
module.exports = {
  event_id: {
    type: 'string',
    pattern : /^(Sink|Source):[A-Za-z]{1,64}:[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}:[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}$/,
    required: true,
  },
  amount: {
    type: 'number',
    required: true,
  },
};
