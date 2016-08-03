var fs = require('fs');
var rtmpdump = require('rtmpdump');
var schedule = require('node-schedule');
var config = require('./config.json');


function getStream() {
    
    var videoURL = config.videoURL,
        options = {
            rtmp: videoURL,
            stop: 960,
            live: null,
            timeout: 5,
        },
        stream = rtmpdump.createStream(options);

    console.log(new Date().toISOString());
    console.log('Stream fetch initiated');

    stream.on('connected', function (info) {
        console.log(info);
    });

    stream.on('progress', function (kBytes, elapsed) {
        console.log('%s kBytes read, %s secs elapsed', kBytes, elapsed);
    });

    stream.on('error', function (err) {
        console.log('**** ' + err);
    });

    var dateISO = new Date().toISOString();
    dateISO = dateISO.split('.')[0].replace(/-|:/g, '').replace(/T/, '-');
    stream.pipe(fs.createWriteStream(dateISO + '.mp4'));
}

// M-F, 4:00 - 5:59
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = new schedule.Range(1, 5);
rule.hour = new schedule.Range(4, 10);
rule.minute = [5, 20, 35, 50];
rule.second = 0;

var j = schedule.scheduleJob(rule, getStream); 

console.log(new Date().toString());
console.log("Script has started.");

