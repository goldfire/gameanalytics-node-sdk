/**
 * gameanalytics-node-sdk
 * Copyright (c) 2018, GoldFire Studios, Inc.
 * https://goldfirestudios.com
 */

/**
 * Progression event validation data.
 */
module.exports = {
  event_id: {
    type: 'string',
    pattern : /^(Start|Fail|Complete):[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}(:[A-Za-z0-9\\s\\-_\\.\\(\\)\\!\\?]{1,64}){0,2}$/,
    required: true,
  },
  attempt_num: {
    type: 'number',
    minimum: 0,
    required: false,
  },
  score: {
    type: 'number',
    required: false,
  },
};
