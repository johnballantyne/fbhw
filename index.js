var youtubedl = require('youtube-dl');
var config = require('./config.json');

var videoURL = config.videoURL,
    video = youtubedl(videoURL);

youtubedl.exec(videoURL, ['-x', '--audio-format', 'mp3'], {}, function(err, output) {
      if (err) throw err;
        console.log(output.join('\n'));
});

