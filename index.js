var youtubedl = require('youtube-dl');
var schedule = require('node-schedule');
var config = require('./config.json');

var videoURL = config.videoURL;

var getStream = youtubedl.exec(videoURL, ['-x', '--audio-format', 'mp3'], {}, function(err, output) {
      if (err) throw err;
        console.log(output.join('\n'));
});

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = new schedule.Range(1, 5);
rule.hour = 4;
rule.minute = 30;

var j = schedule.scheduleJob(rule, getStream);

