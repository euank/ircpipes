var program = require('commander');
var stream = require('stream');
var irc = require('irc');
var child_process = require('child_process');
var readline = require('readline');
var pkg = JSON.parse(require('fs').readFileSync("./package.json"));

program
  .version([pkg.name, pkg.version].join(' - '))
  .option('-i --irc-server <server>', 'Set the irc server to connect to')
  .option('-n --nick <nick>', 'Set the irc nick [ircpipe]', 'ircpipe')
  .option('-p --port <num>', 'Set the port [6667]', parseInt, 6667)
  .option('-c --channel <channel>', 'Set the channel to join [#ircpipe]', '#ircpipe')
  .option('-s --ssl', 'Use ssl')
  .parse(process.argv);

var client = new irc.Client(program.ircServer, program.nick, {
  userName: 'ircpipes',
  realName: 'ircpipes: github.com/euank/ircpipes',
  port: program.port,
  debug: false,
  showErrors: false,
  autoRejoin: true,
  autoConnect: false,
  channels: [],
  secure: program.ssl,
  selfSigned: true,
  floodProtection: false,
  floodProtectionDelay: 0,
  stripColors: true
});

client.connect(function(){
  client.join(program.channel, function(){
    var child = child_process.spawn(program.args[0],program.args.slice(1), {cwd: process.cwd(),env: process.env});
    child.on('close', function(code) {
        client.disconnect("Exited with code: " + code);
    });

    child.stdout.on('data', function(chunk) {
      client.say(program.channel, chunk);
    });
    child.stderr.on('data', function(chunk) {
      client.say(program.channel, chunk);
    });

    client.on('message', function(nick, to, text, message) {
      if(to.toLowerCase() !== program.channel.toLowerCase()) return;
      child.stdin.write(text);
    });
  });
});
