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

function pingStream(record = false, timeout = 15, persist = false) {
    //TODO: progress bar to show timeout status
    var options = {
        rtmp: videoURL,
        stop: 1,
        live: null,
        timeout: timeout 
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
        streamError(err, function () {
            if (persist) {
                pingStream(record, timeout, persist);
            }
        });
        vorpal.show();
    });

    if (typeof callback === "function") {
        callback();
    }
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

var rule2 = new schedule.RecurrenceRule();
rule2.dayOfWeek = new schedule.Range(1, 5);
rule2.hour = [4];
rule2.minute = [30];
rule2.second = 30;

vorpal
    .command('ping', 'Checks for stream connectivity.')
    .option('-r, --record', 'Will record the stream on success. Default is false.')
    .option('-t, --timeout <seconds>', 'Time in seconds before failure. Default is 15.')
    .option('-p, --persist', 'Will repeat until success. Default is false.')
    .action(function (args, callback) {
        vorpal.log(args);
        pingStream(args.options.record, args.options.timeout, args.options.persist);
        callback();
    });
    
vorpal
  .delimiter('fbhw$')
  .show();

vorpal.log(new Date().toLocaleString() + ' > ' + 'Script launched');

var j = schedule.scheduleJob(rule, getStream); 
var k = schedule.scheduleJob(rule2, function () {
    vorpal.log(new Date().toLocaleString() + ' > ' + 'Pinging stream for first hour...');
    pingStream(true, 15, true);
}); 

