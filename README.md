## Description
GameAnalytics Node SDK is a server-side wrapper for the [GameAnalytics](https://gameanalytics.com/) v2 REST API. This library offers full support for all of the event types outlined in the REST API documentation. It also covers the best practices specified including automatic batching of events, GZIP compression and validation of event data.

## Installation
* Install with [npm](https://www.npmjs.com/package/gameanalytics-node-sdk): `npm install gameanalytics-node-sdk`
* Install with [Yarn](https://yarnpkg.com/en/package/gameanalytics-node-sdk): `yarn add gameanalytics-node-sdk`

## Examples
First, create a free account at [https://gameanalytics.com](https://gameanalytics.com/). Then, setup a game and get your key and secret to setup your SDK connection. In this example, we setup the SDK, start a new user session (must be the first thing you do) and track a design tutorial event (the events are just pseudocode).

```javascript
const GameAnalytics = require('gameanalytics-node-sdk');

// Setup the SDK.
const GA = new GameAnalytics({
  key: 'GAME_KEY',
  secret: 'GAME_SECRET',
  build: '1.2.3',
  sandbox: false,
});

// Handle a player logging in.
game.on('login', (userId, client) => {
  GA.sessionStart(userId, {
    ua: client.ua,
    ip: client.ip,
    device: client.device,
    manufacturer: client.manufacturer,
    session_num: client.session_num,
  });
});

// Track a tutorial design event.
game.on('tutorial', (userId, step) => {
  GA.track('design', userId, {
    event_id: `Tutorial:${step}`,
  });
});
```

## API
### Constructor
```javascript
new GameAnalytics({
  key: 'GAME_KEY', // Your GameAnalytics game key.
  secret: 'GAME_SECRET', // Your GameAnalytics game secret.
  build: '1.2.3', // The current build version of your game.
  sandbox: false, // Whether or not to use the sandbox for testing.
});
```

### Methods
#### sessionStart(user, data)
Must be the first thing called to initialize the user session.
* **user**: `String` The unique user ID that identifies this player.
* **data**: `Object` The data to send with this event (minimum required are `platform`, `os_version` and `sdk_version` as found in the [REST API docs](https://gameanalytics.com/docs/rest-api-doc#init) for `init`).

#### sessionEnd(user)
Should be the last thing called for a user to identify the end of their game session. This will flush all pending events before this final event is sent.
* **user**: `String` The unique user ID that identifies this player.

#### track(type, user, data)
Everything that happens between session start and end happens with this method to track any type of event.
* **type**: `String` This can be a value of `business`, `resource`, `progression`, `design` or `error`.
* **user**: `String` The unique user ID that identifies this player.
* **data**: `Object` The data to send with this event. Check the [REST API docs](https://gameanalytics.com/docs/rest-api-doc#event-types) for each event type to see what is required for an event.

### Properties
There are a list of default properties that can be sent with any event, which can be found in the [REST API docs](https://gameanalytics.com/docs/rest-api-doc#default-annotations-shared). Some of these properties are required; however, if they are passed with the `sessionStart` method, they will get automatically sent with each event during the player's session.

The `platform` and `os_version` can be identified automatically if you pass the `ua` property the User Agent string from the browser to `sessionStart`.

## License
Copyright (c) 2018 [James Simpson](https://twitter.com/GoldFireStudios) and [GoldFire Studios, Inc.](https://goldfirestudios.com)

Released under the [MIT License](https://github.com/goldfire/gameanalytics-node-sdk/blob/master/LICENSE).