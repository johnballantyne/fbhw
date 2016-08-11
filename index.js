var fs = require('fs');
var rtmpdump = require('rtmpdump');
var schedule = require('node-schedule');
var config = require('./config.json');
var vorpal = require('vorpal')();

var videoURL = config.videoURL;
//TODO: Utility function for log formatting

function streamError(err, callback) {
    vorpal.log(new Date().toLocaleString() + ' > ' + 'Connection error.');
    vorpal.log(new Date().toLocaleString() + ' > ' + '**** ' + err);
    if (typeof callback === "function") {
        callback();
    }
}

function pingStream(record = false, timeout = 15, persist = false) {
    //TODO: progress bar to show timeout status
    var frames = ['|', '/', '-', '\\'];
    var options = {
        rtmp: videoURL,
        stop: 1,
        live: null,
        timeout: timeout 
    }

    stream = rtmpdump.createStream(options);

    vorpal.hide();
    var timestamp = new Date().toLocaleString();
    var throbber = setInterval(function () {
        var pos = Math.floor(new Date().getMilliseconds() / 250);
        vorpal.ui.redraw(timestamp + ' > ' + 'Checking if stream is live... ' + frames[pos], 'text');
    }, 250);

    stream.on('connected', function (info) {
        vorpal.ui.redraw(timestamp + ' > ' + 'Checking if stream is live...');
        clearInterval(throbber);
        vorpal.log(new Date().toLocaleString() + ' > ' + 'Stream is live.');
        if (record) {
            var duration = timeToTop() + 3630;
            recordStream(duration);
        }
    });

    stream.on('error', function (err) {
        vorpal.ui.redraw(timestamp + ' > ' + 'Checking if stream is live...');
        clearInterval(throbber);
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

function recordStream(duration = 3630) {
    
    var options = {
        rtmp: videoURL,
        stop: duration,
        live: null,
        timeout: 5
    },
    stream = rtmpdump.createStream(options);

    vorpal.log(new Date().toLocaleString() + ' > ' + 'Stream fetch initiated');

    stream.on('connected', function (info) {
        vorpal.log(new Date().toLocaleString() + ' > ' + 'Stream connected');
        //vorpal.log(info);
    });

    stream.on('progress', function (kBytes, elapsed) {
        //TODO / BUG: This can apparently hang indefinitely without throwing an error
        //TODO: Progress bar
        //TODO: Parse kBytes into mBytes, gBytes
        vorpal.ui.redraw(new Date().toLocaleString() + ' > ' + 'Stream downloading\n'
                         + kBytes + ' kBytes read, ' + elapsed + ' secs elapsed');
    });

    stream.on('error', function (err) {
        streamError(err, function (){
            //TODO: Check against broadcast schedule, resume if necessary
        });
    });

    var timestamp = strippedLocaleDate() + '-' + strippedLocaleTime();
    vorpal.log(timestamp);
    stream.pipe(fs.createWriteStream('dl/' + timestamp + '.mp4'));
}

function recordFirstHour() {
    pingStream(true, 5400, true);
}

function timeToTop(date = new Date()) {
    // Returns the amount of seconds before the top of the hour
    var mins = date.getMinutes(),
        secs = date.getSeconds();
    return (60 - mins) * 60 + (60 - secs); 
}

function strippedLocaleDate(date = new Date()) {
    var day = date.getDate();
    var month = date.getMonth() + 1;
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }
    
    return date.getFullYear() + month + day;
}

function strippedLocaleTime(date = new Date()) {
    // Strips all non-digits from the time and adds padding
    // '9:38:46 AM' becomes '093846'
    var pad = '';
    if (date.getHours() < 10) {
        pad = '0';
    }
    return pad + date.toLocaleTimeString().replace(/\D*/g, '');
}

// M-F, 4:00 - 5:59
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = new schedule.Range(1, 5);
rule.hour = new schedule.Range(5, 10);
rule.minute = [59];
rule.second = 30;

//var rule2 = new schedule.RecurrenceRule();
//rule2.dayOfWeek = new schedule.Range(1, 5);
//rule2.hour = [4];
//rule2.minute = [30];
//rule2.second = 30;
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
        pingStream(args.options.record, args.options.timeout, args.options.persist);
        callback();
    });

vorpal
    .command('record', 'Gets the stream.')
    .option('-d, --duration <seconds>', 'Time in seconds to record')
    .action(function (args, callback) {
        recordStream(args.options.duration);
    });

vorpal
  .delimiter('fbhw$')
  .show();

vorpal.log(new Date().toLocaleString() + ' > ' + 'Script launched');

var j = schedule.scheduleJob(rule, recordStream); 
var k = schedule.scheduleJob(rule2, function () {
    vorpal.log(new Date().toLocaleString() + ' > ' + 'Fetching first hour...');
    recordFirstHour();
}); 

