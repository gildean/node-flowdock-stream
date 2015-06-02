var request = require('request');
var JSONParseStream = require('./jsonparser.js');
var PassThrough = require('stream').PassThrough;

function parameterize(name) {
    return name.toLowerCase().replace(/ /g, '-');
}

function nickReducer(obj, user) {
    if (user.hasOwnProperty('id') && user.hasOwnProperty('nick')) obj[user.id] = user.nick;
    return obj;
}

require('util').inherits(StreamingClient, PassThrough);
function StreamingClient(org, flow, apikey) {
    if (!(this instanceof StreamingClient)) return new StreamingClient(org, flow, apikey);
    PassThrough.call(this);
    this._writableState.objectMode = true;
    this._readableState.objectMode = true;
    this.org = parameterize(org);
    this.apikey = apikey;
    this.apiuri = 'https://api.flowdock.com/flows';
    this.streamuri = 'https://stream.flowdock.com/flows';
    this.flow = ('string' === typeof flow) ? [parameterize(flow)] : flow.map(parameterize);
    this.flowMap = {};
}

// "private" methods
StreamingClient.prototype._streamParser = new JSONParseStream();
StreamingClient.prototype._getSendOpts = function _getSendOpts(flowId, message, messageId) {
    var comment = (messageId) ? '/' + messageId + '/comments' : '';
    var uri = this.apiuri + '/' + this.flows[flowId].urikey + '/messages' + comment;
    return {
        uri: uri,
        method: 'POST',
        json: {
            event: (messageId) ? 'comment' : 'message',
            content: message
        }
    };
};

StreamingClient.prototype._init = function _init() {
    var self = this;
    this.getFlows(function gotFlows(err, flows) {
        if (err) return self.emit('error', err);
        self.flows = flows;
        return self._createStreams();
    });
    return this;
};

StreamingClient.prototype._createStreams = function _createStreams() {
    var self = this;
    var filter = '?filter=' + Object.keys(this.flows).map(function (flow) { return self.flows[flow].urikey; }).join(',');
    var url = this.streamuri + filter
    request.get(url).auth(this.apikey, '', true).pipe(this._streamParser).pipe(this);
    this.emit('ready');
};

// public methods
StreamingClient.prototype.send = function send(flow, message, messageId, cb) {
    if ('function' === typeof messageId) cb = messageId;
    var options = this._getSendOpts(this.flowMap[parameterize(flow)], message, messageId);
    return request(options).auth(this.apikey, '', true, cb);
};

StreamingClient.prototype.getUsers = function getUsers(flowName, callback) {
    var self = this;
    var jsonParser = new JSONParseStream();
    jsonParser.once('data', function getUserData(data) {
        jsonParser.removeAllListeners();
        if (data.message || data.error && data.error.message) return callback(new Error(data.message || data.error.message));
        return callback(null, data.reduce(nickReducer, {}));
    });
    jsonParser.once('error', function errorHandler(err) {
        jsonParser.removeAllListeners();
        return callback(err, null);
    });
    var url = this.apiuri + '/' + this.flows[this.flowMap[parameterize(flowName)]].urikey + '/users';
    return request.get(url).auth(this.apikey, '', true).pipe(jsonParser);
};

StreamingClient.prototype.getFlows = function getFlows(callback) {
    var self = this;
    var jsonParser = new JSONParseStream();
    jsonParser.once('data', function getUserData(data) {
        jsonParser.removeAllListeners();
        if (data.message || data.error && data.error.message) return callback(new Error(data.message || data.error.message));
        var flows = data.reduce(function flowReducer(obj, flow) {
            var flowName = flow['parameterized_name'];
            if (self.flow.indexOf(flowName) !== -1) {
                obj[flow.id] = {
                    users: flow.users.reduce(nickReducer, {}),
                    name: flowName,
                    urikey: self.org + '/' + flowName
                };
                self.flowMap[flowName] = flow.id;
            }
            return obj;
        }, {});
        return callback(null, flows);
    });
    jsonParser.once('error', function errorHandler(err) {
        jsonParser.removeAllListeners();
        return callback(err);
    });
    return request.get(this.apiuri + '?users=1').auth(this.apikey, '', true).pipe(jsonParser);
};

var flowdock = {
    createClient: function createClient(org, flow, apikey) {
        if (!org || !flow || !apikey) throw new Error('missing arguments; org, flow and apikey required');
        var sclient = new StreamingClient(org, flow, apikey)._init();
        return sclient;
    }
};

module.exports = flowdock;
