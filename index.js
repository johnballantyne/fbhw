var forever = require('forever-monitor');

var child = new (forever.Monitor)('lib/fbhw.js', {
    silent: false,
    args: []
});

child.on('exit', function () {
    console.log('fbhw.js has exited');
});

