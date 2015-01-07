var config = require('config');
var Keen = require('keen.io');

var keenClient = Keen.configure({
    projectId: config.KeenIO.ProjectId,
    writeKey: config.KeenIO.WriteKey
});

exports.Event = function (collection, eventModel, callback) {
    keenClient.addEvent(collection, eventModel, callback);
};