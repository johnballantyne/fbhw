var youtubedl = require('youtube-dl');
var schedule = require('node-schedule');
var config = require('./config.json');

var videoURL = config.videoURL;

function getStream() {
    youtubedl.exec(videoURL, [], {},
        function(err, output) {
            if (err) {
                console.log("Error thrown");
                console.log(err);
                return;
            }
            console.log(output.join('\n'));
        }
    ); 
}

// M-F, 4:00 - 5:59
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = new schedule.Range(1, 5);
rule.hour = new schedule.Range(4, 5);
rule.minute = new schedule.Range(0, 59);
rule.second = 0;

var j = schedule.scheduleJob(rule, function () {
    console.log('Attempting download...');
    getStream();
});

