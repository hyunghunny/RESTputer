
if (typeof module !== 'undefined') {
    var sensorchart = require("./api.js");    
} 

var id = 'webofthink';
var password = ''; // anything can be ok. (in this version only)

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
    //console.log(mockObs.datePublished);
    observations.push(mockObs);
}

sensorchart.login(id, password, function (transmitter) {
    if (transmitter) {
        transmitter.emit(sensorId, observations, function (result) {
            if (result == false) {
                console.log('failed to transmit observations.');
            }
            
        });
    } else {
        console.log('login error!');
    }
});