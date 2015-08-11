var transmitter = require('./api.js').transmitter;

var id = 'webofthink';
var password = ''; // anything can be ok.

var observations = [];
var sensorId = 2;

// set up for mock observations 
for (var i = 0; i < 100; i++) {
    var mockObs = {
        "datePublished" : new Date(),
        "value" : i
    }
    observations.push(mockObs);
}

transmitter.login(id, password, function (sender) {
    if (sender) {
        sender.emit(sensorId, observations, function (result) {
            console.log('is it transmitted: ' + result);
        });
    } else {
        console.log('login error!');
    }
});