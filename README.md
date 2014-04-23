flowdock-stream
===============

A node module for streaming flowdock flows.

Installation
------------

`npm install flowdock-stream`

Usage
-----

```js
var FlowdockStream = require('flowdock-stream');
var flowdockstream = FlowdockStream.createClient('organization', 'flow', 'apikey');

flowdockstream.on('data', function flowDockEventHandler(data) {
    if (data.event === 'message') console.log('a message!', data.content);
});

flowdockstream.on('error', function realGoodErrorHandler(err) {
    throw err;
});
```

Public methods
--------------

A stream is created with the only exported function as follows:


__FlowdockStream.createClient(__ *organization*, *flow*, *apikey* __)__
    - all three arguments are mandatory


The stream itself is a readable node.js stream, but added are a couple of methods for convenience:

__FlowdockStream.flowUsers__
    - Object that contains the ids and nicks of all the users in the flow at the time of joining, set once for your convenience


__FlowdockStream.getUsers(__ *callback* __)__
    - Function that takes a *callback* which returns two arguments *error* (Error), and *users* (Object)


__FlowdockStream.send(__ *message*, [*commentToId*], [*callback*] __)__
    - Function that can be used to send messages to the flow. Optionally you can pass an message-id as the second argument to send the message as a comment to a previous message. Also takes an optional callback which is passed to the underlying *request* module.

License
-------
http://ok.mit-license.org
