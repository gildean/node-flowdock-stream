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

flowdockstream.on('ready', function () {
    console.log('flowdockstream is ready, current users in the flow:', flowdockstream.flowUsers);
});

flowdockstream.on('data', function flowDockEventHandler(data) {
    if (data.event === 'message') {
        var from = (data.user) ? flowdockstream.flowUsers[data.user] : null;
        console.log('a message from', from, data.content);
    } else if (data.event === 'join') {
        flowdockstream.getUsers(function setUsers(err, users) {
            if (err) return flowdockstream.emit('error', err);
            flowdockstream.flowUsers = users;
        });
    }
});

flowdockstream.on('error', function realGoodErrorHandler(err) {
    throw err;
});
```

Public methods
--------------

A stream is created with the only exported function as follows:


__FlowdockStream.createClient(__ *organization*, *flow*, *apikey* __)__
    
  - all three arguments are mandatory, the apikey is a __personal apikey__, not an apikey of a flow (the bot accesses the REST-API that requires the personal key)
  - the stream will emit a `ready` event once the stream is about to start emitting data and the `flowUsers` property has been set

The stream itself is a readable node.js stream, but added are a couple of methods for convenience:

__flowdockStream.flowUsers__
    
  - Object that contains the ids and nicks of all the users in the flow at the time of joining, set once for your convenience


__flowdockStream.getUsers(__ *callback* __)__
    
  - Function that takes a *callback* which returns two arguments *error* (Error), and *users* (Object)


__flowdockStream.send(__ *message*, [*commentToId*], [*callback*] __)__
    
  - Function that can be used to send messages to the flow. Optionally you can pass an message-id as the second argument to send the message as a comment to a previous message. Also takes an optional callback which is passed to the underlying *request* module.

License
-------
http://ok.mit-license.org
