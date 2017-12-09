// Execution example -> $node myclient.js "tcp://localhost:8059" "Client1" "Work" -v

var zmq = require('zmq');
var req = zmq.socket('req');

// Getting atributes from command line arguments
var args = process.argv.slice(2);
var frontend_url = args[0] || "tcp://localhost:8059";
var my_id = args[1] || "NONE";
var my_msg = args[2] || "Work";
var class_id = args[3] || "B";
var verbose = false;


if(args[args.length - 1] == "-v"){
	verbose = true;
	args.pop();
}

if(my_id != "NONE")
    req.identity = my_id;

req.connect(frontend_url);
req.send([my_msg, class_id]); // Ex. ["","Work","B"] (socket add delimiter)
if(verbose)
    console.log('Client (%s), class (%s) connected to %s', my_id, class_id, frontend_url);
req.on("message", function(msg){
    if(verbose)
	    console.log('Client (%s) has received reply "%s"', my_id, msg.toString());
	process.exit(0);
});

