/**
 * gameanalytics-node-sdk
 * Copyright (c) 2018, GoldFire Studios, Inc.
 * https://goldfirestudios.com
 */

const crypto = require('crypto');
const axios = require('axios');
const pako = require('pako');
const uuid = require('uuid/v4');
const UAParser = require('ua-parser-js');

// Load the validation data.
const defaultParams = require('./validate/default');
const validate = {
  business: require('./validate/business'),
  resource: require('./validate/resource'),
  progression: require('./validate/progression'),
  design: require('./validate/design'),
  error: require('./validate/error'),
};
Object.keys(validate).forEach((key) => {
  validate[key] = Object.assign({}, validate[key], defaultParams);
});

/**
 * Create the GameAnalytics Node.js SDK class.
 */
class GameAnalytics {
  /**
   * Setup the default values of the GameAnalytics system.
   * @param  {String}  options.key     GameAnalytics game key.
   * @param  {String}  options.secret  GameAnalytics secret key.
   * @param  {Boolean} options.sandbox Whether to use the sandbox or not.
   * @param  {String}  options.build   Build number of the game.
   */
  constructor({key, secret, sandbox = false, build}) {
    // Keep track of the init values.
    this.key = sandbox ? '5c6bcb5402204249437fb5a7a80a4959' : key;
    this.secret = sandbox ? '16813a12f718bc5c620f56944e1abc3ea13ccbac' : secret;
    this.build = build;

    // Determine the URL to send requests to.
    this.host = `${sandbox ? 'http://sandbox-' : 'https://'}api.gameanalytics.com`;
    this.url = `${this.host}/v2/${this.key}/`;

    // Create a cache store for all connected players and their event queues.
    this.users = {};
  }

  /**
   * Initialize the user data before sending the request to GameAnalytics.
   * This data will be used for all tracking requests.
   * @param  {String} user User ID.
   * @param  {Object} data Data to send with the user event.
   */
  initUser(user, data) {
    // If the user agent was passed, use it to get platform details.
    if (data.ua) {
      const uaData = UAParser(data.ua);
      
      // Set the platform.
      if (!data.platform) {
        if (uaData.os.name === 'Windows' && uaData.device.type && uaData.device.type.match(/mobile|tablet/)) {
          data.platform = 'windows_phone';
        } else if (uaData.os.name === 'Windows') {
          data.platform = 'windows';
        } else if (uaData.os.name === 'iOS') {
          data.platform = 'ios';
        } else if (uaData.os.name === 'Android' || data.ua.includes('CrOS')) {
          data.platform = 'android';
        } else if (uaData.os.name === 'BlackBerry') {
          data.platform = 'blackberry';
        } else if (uaData.os.name === 'Mac OS') {
          data.platform = 'mac_osx';
        } else if (data.ua.includes('Tizen')) {
          data.platform = 'tizen';
        } else if (data.ua.includes('Linux')) {
          data.platform = 'linux';
        } else {
          data.platform = 'unknown';
        }
      }

      // Get the OS version.
      if (!data.os_version) {
        const version = (uaData.os.version || '0.0.0')
          .replace('Vista', '6.0')
          .replace('x86_64', '8.0'); // Hack to fix Chrome OS reporting until GA supports it.
        data.os_version = `${data.platform} ${version}`;
      }
    }

    // Create the user's cache record in memory.
    this.users[user] = {
      offset: 0,
      start: Math.round(Date.now() / 1000),
      data: JSON.parse(JSON.stringify({
        user_id: `${user}`,
        ip: data.ip,
        device: data.device || 'unknown',
        os_version: data.os_version,
        manufacturer: data.manufacturer || 'unknown',
        platform: data.platform,
        session_id: uuid(),
        session_num: data.session_num,
        limit_ad_tracking: data.limit_ad_tracking,
        logon_gamecenter: data.logon_gamecenter,
        logon_gameplay: data.logon_gameplay,
        jailbroken: data.jailbroken,
        android_id: data.android_id,
        googleplus_id: data.googleplus_id,
        facebook_id: data.facebook_id,
        gender: data.gender,
        birth_year: data.birth_year,
        custom_01: data.custom_01,
        custom_02: data.custom_02,
        custom_03: data.custom_03,
        engine_version: data.engine_version,
        ios_idfv: data.ios_idfv,
        connection_type: data.connection_type,
        ios_idfa: data.ios_idfa,
        google_aid: data.google_aid,
      })),
      events: [],
      interval: setInterval(() => {
        this._flush(user);
      }, 10000),
    };
  }

  /**
   * Start a new user session (this also handles calling init before any events are processed).
   * @param  {String} user User ID.
   * @param  {Object} data Data to send with the user event.
   * @return {Promise}
   */
  sessionStart(user, data) {
    this.initUser(user, data);

    // Send the init request.
    return this._request('init', null, {
      platform: data.platform,
      os_version: data.os_version,
      sdk_version: 'rest api v2',
    }).then((res) => {
      if (!this.users[user]) {
        return;
      }
      
      // Set the server time offset.
      this.users[user].offset = Math.round(Date.now() / 1000) - res.data.server_ts;

      // Send the user session start request.
      return this._request('user', user).then(() => {
        const userData = this.users[user] || {};

        return {
          start: userData.start,
          data: userData.data,
          offset: userData.offset,
        };
      });
    });
  }

  /**
   * End a user session and flush all remaining events.
   * @param  {String} user User ID.
   * @return {Promise}
   */
  sessionEnd(user) {
    const userData = this.users[user];

    if (!userData) {
      return Promise.resolve();
    }

    // Calculate the session length.
    const length = Math.round(Date.now() / 1000) - userData.start;

    // Send the session end request.
    this._request('session_end', user, {length});

    // End the queue interval.
    clearInterval(user.interval);

    // Flush the player's cache.
    this._flush(user);

    // Clear out the player data from the cache.
    delete this.users[user];

    return Promise.resolve();
  }

  /**
   * Queue an event for the specified type.
   * @param  {String} type Type of event ('business', 'resource', etc).
   * @param  {String} user User ID.
   * @param  {Object} data Event data.
   * @return {Promise}
   */
  track(type, user, data) {
    return this._request(type, user, data);
  }

  /**
   * Verify the data against the validation data.
   * @param  {String} type Type of event.
   * @param  {Object} data Data to validate.
   * @return {Boolean}      True if data is valid.
   */
  _verify(type, data) {
    const params = validate[type];
    let valid = true;

    Object.keys(params).forEach((key) => {
      // Check if a required property is missing.
      if (params[key].required && !data[key]) {
        console.error(new Error(`Missing required property "${key}". ${JSON.stringify(data)}`));
        valid = false;
        return;
      } else if (!data[key]) {
        return;
      }

      // Check if enum values are contained in the list.
      if (params[key].enum && !params[key].enum.includes(data[key])) {
        console.error(new Error(`Invalid value "${data[key]}" for property "${key}".`));
        valid = false;
        return;
      }

      // Check that the data is of the right type.
      if (typeof data[key] !== params[key].type) {
        console.error(new Error(`Property "${key}" must be of type "${params[key].type}".`));
        valid = false;
        return;
      }

      // Verify the data if a pattern is specified.
      if (params[key].pattern && !params[key].pattern.test(`${data[key]}`)) {
        console.error(new Error(`Invalid value "${data[key]}" supplied for property "${key}".`));
        valid = false;
      }
    });

    return valid;
  }

  /**
   * Flush the event queue for a player.
   * @param  {String} user User ID.
   */
  _flush(user) {
    if (this.users[user] && this.users[user].events && this.users[user].events.length) {
      this._makeRequest('events', this.users[user].events);
      this.users[user].events.length = 0;
    }
  }

  /**
   * Send or queue a request to track an event/init.
   * @param  {String} type 'init' or type of event.
   * @param  {String} user User ID.
   * @param  {Object} data Data to send with the request.
   * @return {Promise}
   */
  _request(type, user, data = {}) {
    const userData = this.users[user];
    let body = data;

    // Add in the extra event data if this isn't an init event.
    if (userData) {
      body = Object.assign(data, {
        category: type,
        v: 2,
        sdk_version: 'rest api v2',
        client_ts: Math.round(Date.now() / 1000) + userData.offset,
        build: this.build,
      }, userData.data);
    }

    // If this is a regular event, then just queue the data.
    if (!/init|user/.test(type)) {
      // Verify the data.
      if (type !== 'session_end' && !this._verify(type, body)) {
        return Promise.resolve();
      }

      // Add the data to the queue.
      this.users[user].events.push(body);

      return Promise.resolve();
    }

    return this._makeRequest(type, [body]);
  }

  /**
   * Send a request to the GameAnaltyics service.
   * Also, gzip the data and generate the auth token.
   * @param  {String} type 'init' or type of event.
   * @param  {Object} body Body data to send with the request.
   * @return {Promise}
   */
  _makeRequest(type, body) {
    // Extract the IP from the body.
    const ip = body.ip;
    delete body.ip;

    // Gzip the body data.
    body = pako.gzip(JSON.stringify(body));

    // Calculate the authentication header.
    const auth = crypto
      .createHmac('sha256', this.secret)
      .update(body)
      .digest('base64');

    // Determine what headers to send.
    const headers = {
      'Content-Encoding': 'gzip',
      'Content-Type': 'json',
      'Authorization': auth,
    };
    if (ip) {
      headers['X-Forward-For'] = ip;
    }

    // Send the request and get the response in a promise.
    return axios({
      method: 'post',
      url: `${this.url}${type === 'init' ? 'init' : 'events'}`,
      data: body,
      headers,
    }).catch((res) => {
      console.error(res && res.response ? res.response.data[0].errors : 'unknown response');
    });
  }
}

module.exports = GameAnalytics;
