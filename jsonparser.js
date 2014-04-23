// parses json-strings delimited by \r and streams them out as objects
var StringDecoder = require('string_decoder').StringDecoder;
var Transform = require('stream').Transform;
require('util').inherits(JSONParseStream, Transform);

function JSONParseStream(options) {
  if (!(this instanceof JSONParseStream)) return new JSONParseStream(options);
  Transform.call(this, options);
  this._writableState.objectMode = false;
  this._readableState.objectMode = true;
  this._buffer = '';
  this._decoder = new StringDecoder('utf8');
}

JSONParseStream.prototype._transform = function _transform(chunk, encoding, cb) {
    this._buffer += this._decoder.write(chunk);
    var lines = this._buffer.split(/\r/);
    this._buffer = lines.pop();
    for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        var obj;
        try {
            obj = JSON.parse(line);
        } catch (er) {
            this.emit('error', er);
            return;
        }
        this.push(obj);
    }
    cb();
};

JSONParseStream.prototype._flush = function _flush(cb) {
    var rem = this._buffer.trim();
    if (rem) {
        var obj;
        try {
            obj = JSON.parse(rem);
        } catch (er) {
            this.emit('error', er);
            return;
        }
        this.push(obj);
    }
    cb();
};

module.exports = JSONParseStream;
