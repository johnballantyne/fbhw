var fs = require('fs');
var rtmpdump = require('rtmpdump');
var schedule = require('node-schedule');
var config = require('./config.json');
var vorpal = require('vorpal')();

var videoURL = config.videoURL;

function pingStream() {
    var options = {
        rtmp: videoURL,
        stop: 1,
        live: null,
        timeout: 15
    }

    stream = rtmpdump.createStream(options);

    vorpal.log(new Date().toISOString());
    vorpal.log('Checking if stream is live...\n');

    stream.on('connected', function (info) {
        vorpal.log(new Date().toISOString());
        vorpal.log('Stream connected. Capturing...\n');
    });

    stream.on('error', function (err) {
        vorpal.log(new Date().toISOString());
        vorpal.log('**** ' + err);
        vorpal.log('Unable to connect. Trying again...\n');
        pingStream();
    });
}

function getStream() {
    
    var options = {
        rtmp: videoURL,
        stop: 3630,
        live: null,
        timeout: 5
    },
    stream = rtmpdump.createStream(options);

    vorpal.log(new Date().toLocaleString() + ' > ' + 'Stream fetch initiated');

    stream.on('connected', function (info) {
        vorpal.log(new Date().toLocaleString() + ' > ' + 'Stream connected');
        vorpal.log(info);
        vorpal.ui.cancel();
    });

    stream.on('progress', function (kBytes, elapsed) {
        //TODO: Progress bar
        //TODO: Parse kBytes into mBytes, gBytes
        vorpal.ui.redraw(new Date().toLocaleString() + ' > ' + 'Stream downloading\n'
        vorpal.ui.redraw(new Date().toLocaleString() + ' > ' + 'Stream downloading\n'
                         + kBytes + ' kBytes read, ' + elapsed + ' secs elapsed');
    });

    stream.on('error', function (err) {
        //TODO: Check against broadcast schedule, resume if necessary
        vorpal.log('**** ' + err);
    });

    //TODO: Shift to Eastern time zone
    var dateISO = new Date().toISOString();
    dateISO = dateISO.split('.')[0].replace(/-|:/g, '').replace(/T/, '-');
    stream.pipe(fs.createWriteStream(dateISO + '.mp4'));
}

// M-F, 4:00 - 5:59
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = new schedule.Range(1, 5);
rule.hour = new schedule.Range(4, 10);
rule.minute = [59];
rule.second = 30;

vorpal
  .delimiter('fbhw$')
  .show();

vorpal.log(new Date().toString());
vorpal.log("Script has started.\n");

var j = schedule.scheduleJob(rule, getStream); 

