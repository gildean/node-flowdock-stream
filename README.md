flowdock-stream v.1
===================

A node module for streaming flowdock flows.
NOTE: for the older API, check version 0.1.3.

Installation
------------

`npm install flowdock-stream`

Usage
-----

```js
var FlowdockStream = require('flowdock-stream');
var flowdockstream = FlowdockStream.createClient('organization', ['flow', 'another'], 'personal-apikey');

flowdockstream.on('ready', function () {
    console.log('flowdockstream is ready, current users in the flows:\r\n', flowdockstream.flows);
});

flowdockstream.on('data', function flowDockEventHandler(data) {
    if (data.event === 'message') {
        var from = (data.user) ? flowdockstream.flows[data.flow].users[data.user] : null;
        console.log('a message from', from, data.content);
    } else if (data.event === 'join') {
        flowdockstream.getUsers(flowdockstream.flows[data.flow].name, function setUsers(err, users) {
            if (err) return flowdockstream.emit('error', err);
            flowdockstream.flows[data.flow].users = users;
            flowdockstream.send(flowdockstream.flows[data.flow].name, 'Hello ' + users[data.user]);
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


__FlowdockStream.createClient(__ *organization*, *flows*, *apikey* __)__
    
  - all three arguments are mandatory, the apikey is a __personal apikey__, not an apikey of a flow (the module accesses the REST-API that requires the personal key)
  - the `flows` argument can be either a string (for a sinlge flow) or an array (for multiple flows)
  - the stream will emit a `ready` event once the stream is about to start emitting data and the `flowUsers` property has been set

The stream itself is a readable node.js stream, but added are a couple of methods for convenience:

__flowdockStream.flows__
    
  - Object that contains the names and urikeys as well as all of the users in the flow at the time of joining.


__flowdockStream.getFlows(__ *callback* __)__
    
  - Function that takes a *callback*-function which returns two arguments *error* (Error), and *flows* (Object), this also gets all of the users for each flow.


__flowdockStream.getUsers(__ *flow*, *callback* __)__
    
  - Function that takes the name of the flow *flow* and a *callback*-function which returns two arguments *error* (Error), and *users* (Object)


__flowdockStream.send(__ *flow*, *message*, [*commentToId*], [*callback*] __)__

  - Function that can be used to send a `message` to the `flow` (you can pick the flow-name from the flows-object by the id in an event-callback). Optionally you can pass an message-id as the third argument to send the message as a comment to a previous message. Also takes an optional callback which is passed to the underlying *request* module.


License
-------
http://ok.mit-license.org
