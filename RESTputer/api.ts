
/*
// load xmlhttprequest module if it is used in server side.
if (typeof module !== 'undefined') {    
XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}
*/

// logger
enum LogFlag { All, Critical, Major };
var logger = {
    flag: LogFlag.Critical,
    e: function (message) {
        console.log('[ERROR] ' + message);
        if (message.stack) {
            console.log(message.stack);
        }
    },
    w: function (message) { if (this.flag != LogFlag.Critical) console.log('[WARN] ' + message); },
    i: function (message) { if (this.flag == LogFlag.All) console.log('[INFO] ' + message); }
}
logger.flag = LogFlag.All;

interface Observation {
    datePublished: Date;
    value: number;
}

class RESTTransmitter {
    public id;
    private password;
    private authKey;
    private apis = [];

    private islogin = false;

    constructor(public baseUrl: string) {
        if (baseUrl.indexOf('/', baseUrl.length - 1) !== -1) {
            this.baseUrl = baseUrl.substring(0, baseUrl.length - 1);
            //console.log(baseUrl);
        }
    }

    private createAuthKey(id: string, password: string) : string {
        // XXX:hard coded for testing only
        return 'KeepYourEyesOnly';
    }

    public login(id: string, password: string, cb: Function) {
        this.id = id;
        this.password = password;
        this.authKey = this.createAuthKey(id, password);
        var ajajson = new AJAJSONManager(this.baseUrl);
        ajajson.setAuthKey(this.authKey);
        var self = this;
        ajajson.get('/' + id,
            function (returnObj) {
                logger.i(JSON.stringify(returnObj)); // shows available APIs
                if (returnObj.api) {
                    self.apis = returnObj.api;
                }
                self.islogin = true;                
                cb(self); // return myself to keep going to next stage
            },
            function (err) {
                logger.e(JSON.stringify(err));
                self.islogin = false;
                cb(null); // return null to stop it
            }
        );
    }

    private getSensorUri(userId: string, sensorId: string): string {
        var targetUri = '/' + userId + '/' + sensorId;
        for (var i = 0; i < this.apis.length; i++) {
            var api = this.apis[i];
            if (api.href == targetUri) {
                return targetUri;
            }
        }
        return ""; // invalid returns empty uri
    }

    public emit(sensorId: string, observations: Observation[], cb: Function) {
        if (!this.islogin) {
            cb(new Error('login required before transmitting.'));  
            return;
        }
        var uri = this.getSensorUri(this.id, sensorId);
        if (uri == "") {
            cb(new Error('invalid sensor Id.'));
            return;
        }
        // TODO:look up to check each observations is valid
        var content = { "observations": [] };
        for (var i = 0; i < observations.length; i++) {
            var obs: Observation = observations[i];
            console.log(obs.datePublished);
            
            var observation = {
                "timestamp": obs.datePublished,
                "value": obs.value
            };
            content.observations.push(observation);
        }
        var self = this;
        var ajajson = new AJAJSONManager(this.baseUrl);
        ajajson.setAuthKey(this.authKey);
        ajajson.post(uri,
            content,
            function () {                
                cb(true); 
            },
            function (err) {
                logger.e(JSON.stringify(err));
                cb(false);
            }
        );
    }
}

// AJAX utility
class AJAJSONManager {
    private xhr = null;
    private authKey = null;

    // XXX: baseUrl SHOULD NOT be ended with '/'
    constructor(public baseUrl: string) {
        this.xhr = new XMLHttpRequest();
        if (!this.xhr) {
            logger.e('XMLHttpRequest object is not supported in this platform.');
        }         
    }

    private setHeaders(): void {
        this.xhr.setRequestHeader('Authorization', this.authKey);
        this.xhr.setRequestHeader('Content-Type', 'application/json');
    }

    public setAuthKey(authKey: string) {
        // TODO:validate it if possible 
        this.authKey = authKey;
        return true;
    }    

    public get(uri: string, scb: Function, ecb: Function): void {

        if (!this.xhr) {
            var err = new Error('XMLHttpRequest object is not supported in this platform.');
            ecb(err);
        }
        var self = this;

        self.xhr.onreadystatechange = function () {
            if (self.xhr.readyState === 4) {
                if (self.xhr.status === 200) {

                    scb(JSON.parse(self.xhr.responseText));
                } else {
                    var err = new Error('Unexpected response: ' + self.xhr.status);
                    logger.w(err);
                    ecb(err);
                }
            }
        };
        logger.i('GET REQUEST: ' + this.baseUrl + uri);
        
        this.xhr.open('GET', this.baseUrl + uri);
        this.setHeaders();
        this.xhr.send();
    }

    public put(uri:string, content: Object, scb: Function, ecb: Function): void {

        if (!this.xhr) {
            var err = new Error('AJAX object is not supported.');
            ecb(err);
        }
        var self = this;
        self.xhr.onreadystatechange = function () {
            if (self.xhr.readyState === 4) {
                if (self.xhr.status === 202) {
                    scb(self.xhr);
                } else {
                    var err = new Error('Unexpected response: ' + self.xhr.status);
                    logger.w(err);
                    ecb(err);
                }
            }
        };
        logger.i('PUT REQUEST: ' + this.baseUrl + uri);
        this.xhr.open('PUT', this.baseUrl + uri);
        this.setHeaders();     
        this.xhr.send(JSON.stringify(content));
    }
    public post(uri: string, content: Object, scb: Function, ecb: Function): void {

        if (!this.xhr) {
            var err = new Error('AJAX object is not supported.');
            ecb(err);
        }
        var self = this;
        self.xhr.onreadystatechange = function () {
            if (self.xhr.readyState === 4) {
                if (self.xhr.status === 202) {
                    scb(self.xhr);
                } else {
                    var err = new Error('Unexpected response: ' + self.xhr.status);
                    logger.w(err);
                    ecb(err);
                }
            }
        };
        logger.i('POST REQUEST: ' + this.baseUrl + uri);
        this.xhr.open('POST', this.baseUrl + uri);        
        this.setHeaders();
        this.xhr.send(JSON.stringify(content));

    }

    public delete(uri: string, scb: Function, ecb: Function): void {

        if (!this.xhr) {
            var err = new Error('XMLHttpRequest object is not supported in this platform.');
            ecb(err);
        }
        var self = this;

        self.xhr.onreadystatechange = function () {
            if (self.xhr.readyState === 4) {
                if (self.xhr.status === 200) {

                    scb(JSON.parse(self.xhr.responseText));
                } else {
                    var err = new Error('Unexpected response: ' + self.xhr.status);
                    logger.w(err);
                    ecb(err);
                }
            }
        };
        logger.i('DELETE REQUEST: ' + this.baseUrl + uri);

        this.xhr.open('DELETE', this.baseUrl + uri);
        this.setHeaders();
        this.xhr.send();
    }
};

/*
// exposes API if the script executes on server side.
if (typeof module !== 'undefined') {
    exports.transmitter = new RESTTransmitter('http://localhost:3000');
    //exports.logger = logger;
}
*/