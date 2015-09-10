var fs = require('fs');
var path = require('path');
var youtubedl = require('youtube-dl');
var config = require('./config.json');

var videoURL = config.videoURL,
    video = youtubedl(videoURL);

video.on('info', function(info) {
    var output;

    console.log('Download started');
    console.log(JSON.stringify(info));
    output = path.join(__dirname, 'out.mp4');
    video.pipe(fs.createWriteStream(output));
});

video.on('error', function(error) {
    console.log(error);
});

