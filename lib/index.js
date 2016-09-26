'use strict';
var bunyan = require('bunyan');
var config = require('config');
var Keen = require('keen.io');
var LogglyLogger = require('./loggly_logger');

var streams = [];
var logLevel = 'debug';

var keenClient;
var hasKeenIO = false;
var hasLoggly = false;

// Setup console for dev environments
if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') {
    streams.push({
        name: 'console',
        level: logLevel,
        stream: process.stdout
    });
}

// Setup KeenIO if we have it for events
if (config.has('KeenIO.ProjectId') && config.KeenIO.ProjectId !== '') {
    keenClient = Keen.configure({
        projectId: config.KeenIO.ProjectId,
        writeKey: config.KeenIO.WriteKey
    });
    hasKeenIO = true;
}

// Setup loggly if we have it
if (config.has('Loggly.Key') && config.Loggly.Key !== '') {
    streams.push({
        type: 'raw',
        stream: new LogglyLogger()
    });
    hasLoggly = true;
}

// Setup the app name
var appName = 'no application name set';
if (config.has('Application.Name') && config.Application.Name !== '') {
    appName = config.Application.Name;
}

// Actually create hte logger
var logger = bunyan.createLogger({
    name: appName,
    streams: streams
});

logger.Event = function(collection, eventModel, callback) {
    if (keenClient !== undefined) {
        keenClient.addEvent(collection, eventModel, callback);
    } else {
        callback();
    }
};

module.exports = logger;