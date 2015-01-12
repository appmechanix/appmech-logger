'use strict';

// BASED OFF OF https://github.com/hoist/hoist-logger/blob/master/lib/loggly_logger.js

var loggly = require('loggly');
var config = require('config');
var BBPromise = require('bluebird');
var logModifier = require('./log_modifier');

function LogglyLogger(logglyConfig, buffer) {
    this.logglyConfig = {
        token: config.Loggly.Key,
        subdomain: config.Loggly.Domain
    };

    // define the log as being json (because bunyan is a json logger)
    this.logglyConfig.json = true;

    this.logglyConfig.useTagHeader = false;
    // define the buffer count, unless one has already been defined
    this.buffer = buffer || 1;
    this._buffer = [];

    // add the https tag by default, just to make the loggly source setup work as expect
    this.logglyConfig.tags = this.logglyConfig.tags || [];
    if (config.has('Loggly.Tags')) {
        this.logglyConfig.tags = this.logglyConfig.tags.concat(config.Loggly.Tags);
    }

    // create the client
    this.client = loggly.createClient(this.logglyConfig);
}

LogglyLogger.prototype.write = function (rec) {
    /* istanbul ignore if */
    if (typeof rec !== 'object' && !Array.isArray(rec)) {
        throw new Error('LogglyLogger requires a raw stream. Please define the type as raw when setting up the bunyan stream.');
    }
    return BBPromise.try(function (logObject) {
        /* istanbul ignore else */
        if (typeof logObject === 'object') {

            // loggly prefers timestamp over time
            /* istanbul ignore else */
            if (logObject.time !== undefined) {
                logObject.timestamp = rec.time;
                delete logObject.time;
            }

        }
        return logModifier(logObject)
            .bind(this)
            .then(function (log) {
                // write to our array buffer
                this._buffer.push(log);

                // check the buffer, we may or may not need to send to loggly
                this.checkBuffer();
            });

    }, [rec], this).done();
};

LogglyLogger.prototype.checkBuffer = function () {

    /* istanbul ignore if */
    if (this._buffer.length < this.buffer) {

        return;
    }

    // duplicate the array, because it could be modified before our HTTP call succeeds
    var content = this._buffer.slice();
    this._buffer = [];
    // log multiple (or single) requests with loggly
    this.client.log(content);

};

module.exports = LogglyLogger;