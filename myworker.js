// Execution example -> $node myworker.js "tcp://localhost:8060" "Worker1" "Ready" "Done" -v

var zmq = require("zmq");
var req = zmq.socket("req");

// Getting atributes from command line arguments
var args = process.argv.slice(2);
var backend_url = args[0] || "tcp://localhost:8060";
var my_id = args[1] || "NONE";
var disp_text = args[2] || "Ready";
var reply_text = args[3] || "Done";
var class_id = args[4] || "B";
var verbose = false;

if(args[args.length - 1] == "-v"){
    verbose = true;
    args.pop();
}

if(my_id != "NONE")
    req.identity = my_id;

req.connect(backend_url);
req.send([disp_text, class_id]);

if(verbose){
    console.log('Worker (%s) class (%s) connected to "%s"', my_id, class_id, backend_url);
    console.log('Worker (%s) has sent its first connection message: "%s"', my_id, disp_text);
}

req.on("message", function(client, delimiter, msg){
    if(verbose)
        console.log('Worker (%s) has received request ["%s"] from client (%s)', my_id, msg.toString(), client);

	setTimeout(function(){
		req.send([client,'',reply_text, class_id]);
		if(verbose)
		    console.log('Worker (%s) has sent its reply "%s"', my_id, reply_text);
	}, 1000);
});






