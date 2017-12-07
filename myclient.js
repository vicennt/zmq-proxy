var zqm = require('zmq');
var req = zmq.socket('req');
var args = process.argv.slice(2);
var frontend_url = args[0];
var my_id = args[1];
var my_msg = args[2];
var verbose = false;

if(args[args.length - 1] == "-v"){
	verbose = true;
	args.pop();
}

req.connect(frontend_url);
if(verbose){
	console.log('Client (%s) connected to "%s"', my_id, frontend_url);
}

req.send(my_msg);


req.on("message", function(msg){
	console.log('Client (%s) has received rely "%s"', my_id, msg.toString());
	process.exit(0);
});

