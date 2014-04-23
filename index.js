var request = require('request');
var JSONParseStream = require('./jsonparser.js');
var PassThrough = require('stream').PassThrough;
require('util').inherits(StreamingClient, PassThrough);

function StreamingClient(org, flow, apikey) {
    if (!(this instanceof StreamingClient)) return new StreamingClient(org, flow, apikey);
    PassThrough.call(this);
    this._writableState.objectMode = true;
    this._readableState.objectMode = true;
    this.org = org;
    this.flow = flow;
    this.apikey = apikey;
    this.apiuri = 'https://api.flowdock.com/flows';
    this.streamuri = 'https://stream.flowdock.com/flows';
    this.urikey =  org + '/' + flow;
}

// "private" methods
StreamingClient.prototype._streamParser = new JSONParseStream();
StreamingClient.prototype._getSendOpts = function _getSendOpts(message, messageId) {
    var self = this;
    var comment = (messageId) ? '/' + messageId + '/comments' : '';
    return {
        uri: self.apiuri + '/' + self.urikey + '/messages' + comment,
        method: 'POST',
        json: {
            event: (messageId) ? 'comment' : 'message',
            content: message
        }
    };
};

StreamingClient.prototype._init = function _init() {
    var self = this;
    this.getUsers(function setUsers(err, users) {
        if (err) self.emit('error', err);
        self.flowUsers = users;
        request.get(self.streamuri + '?filter=' + self.urikey).auth(self.apikey, '', true).pipe(self._streamParser).pipe(self);
        self.emit('ready');
    });
    return this;
};

// public methods
StreamingClient.prototype.flowUsers = {};
StreamingClient.prototype.send = function send(message, messageId, cb) {
    var self = this;
    var options = this._getSendOpts(message, messageId);
    return request(options).auth(self.apikey, '', true, cb);
};

StreamingClient.prototype.getUsers = function getUsers(callback) {
    var self = this;
    var jsonParser = new JSONParseStream();
    jsonParser.once('data', function getUserData(data) {
        jsonParser.removeAllListeners();
        return callback(null, data.reduce(function nickReducer(obj, user) {
            if (user.hasOwnProperty('id') && user.hasOwnProperty('nick')) obj[user.id] = user.nick;
            return obj;
        }, {}));
    });
    jsonParser.once('error', function errorHandler(err) {
        jsonParser.removeAllListeners();
        return callback(err, null);
    });
    return request.get(self.apiuri + '/' + self.urikey + '/users').auth(self.apikey, '', true).pipe(jsonParser);
};

var flowdock = {
    createClient: function createClient(org, flow, apikey) {
        if (!org || !flow || !apikey) throw new Error('missing arguments; org, flow and apikey required');
        var sclient = new StreamingClient(org, flow, apikey);
        setImmediate(function initStream() {
            sclient._init();
        });
        return sclient;
    }
};

module.exports = flowdock;
