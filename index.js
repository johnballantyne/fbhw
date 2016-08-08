var fs = require('fs');
var rtmpdump = require('rtmpdump');
var schedule = require('node-schedule');
var config = require('./config.json');
var vorpal = require('vorpal')();

var videoURL = config.videoURL;
//TODO: Utility function for log formatting

function streamError(err, callback) {
    //TODO: Check against broadcast schedule, resume if necessary
    vorpal.log(new Date().toLocaleString() + ' > ' + 'Connection error.');
    vorpal.log(new Date().toLocaleString() + ' > ' + '**** ' + err);
    if (typeof callback === "function") {
        callback();
    }
}

function pingStream(record) {
    //TODO: progress bar to show timeout status
    var options = {
        rtmp: videoURL,
        stop: 1,
        live: null,
        timeout: 15
    }

    stream = rtmpdump.createStream(options);

    vorpal.hide();
    vorpal.log(new Date().toLocaleString() + ' > ' + 'Checking if stream is live...');

    stream.on('connected', function (info) {
        vorpal.log(new Date().toLocaleString() + ' > ' + 'Stream is live.');
        if (record) {
            getStream();
        }
    });

    stream.on('error', function (err) {
        streamError(err);
        vorpal.show();
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
        //vorpal.log(info);
        vorpal.ui.cancel();
    });

    stream.on('progress', function (kBytes, elapsed) {
        //TODO: Progress bar
        //TODO: Parse kBytes into mBytes, gBytes
        vorpal.ui.redraw(new Date().toLocaleString() + ' > ' + 'Stream downloading\n'
                         + kBytes + ' kBytes read, ' + elapsed + ' secs elapsed');
    });

    stream.on('error', streamError);

    //TODO: Shift to Eastern time zone
    var dateISO = new Date().toISOString();
    dateISO = dateISO.split('.')[0].replace(/-|:/g, '').replace(/T/, '-');
    stream.pipe(fs.createWriteStream('dl/' + dateISO + '.mp4'));
}

// M-F, 4:00 - 5:59
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = new schedule.Range(1, 5);
rule.hour = new schedule.Range(4, 10);
rule.minute = [59];
rule.second = 30;

vorpal
    .command('ping', 'Checks for stream connectivity. Times out after 15 seconds')
    .action(function (args, callback) {
        pingStream(false);
        callback();
    });
    
vorpal
  .delimiter('fbhw$')
  .show();

vorpal.log(new Date().toLocaleString() + ' > ' + 'Script launched');

var j = schedule.scheduleJob(rule, getStream); 

