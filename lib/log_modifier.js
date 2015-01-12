'use strict';

// Based off of https://github.com/hoist/hoist-logger/blob/master/lib/hoist_log_modifier.js

var BBPromise = require('bluebird');
module.exports = function (logObject) {
    return BBPromise.resolve(logObject);
};