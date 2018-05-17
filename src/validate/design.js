/**
 * gameanalytics-node-sdk
 * Copyright (c) 2018, GoldFire Studios, Inc.
 * https://goldfirestudios.com
 */

/**
 * Design event validation data.
 */
module.exports = {
  event_id: {
    type: 'string',
    pattern : /^[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}(:[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}){0,4}$/,
    required: true,
  },
  value: {
    type: 'number',
    required: false,
  },
};
