var transmitter = require('./api.js').transmitter;

var id = 'webofthink';
var password = ''; // anything can be ok.

var observations = [];
var sensorId = 2;

var now = new Date();
now.setSeconds(now.getSeconds() - 100);
var ago = new Date(now);

// set up for mock observations 
for (var i = 0; i < 100; i++) {
    ago.setSeconds(ago.getSeconds() + 1);
    
    var mockObs = {
        "datePublished" : ago.getTime(),
        "value" : i
    }
    console.log(mockObs.datePublished);
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