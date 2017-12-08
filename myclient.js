var zmq = require('zmq');
var req = zmq.socket('req');
var args = process.argv.slice(2);
var frontend_url = args[0] || "tcp://localhost:8059";
var my_id = args[1] || "NONE";
var my_msg = args[2] || "Work";
var verbose = false;

if(args[args.length - 1] == "-v"){
	verbose = true;
	args.pop();
}

req.identity = my_id;
req.connect(frontend_url);

if(verbose){
	console.log('Client (%s) connected to "%s"', my_id, frontend_url);
}

req.send(my_msg); // Ex. ["","Work"] (socket add delimiter)


req.on("message", function(msg){
	console.log('Client (%s) has received rely "%s"', my_id, msg.toString());
	process.exit(0);
});

