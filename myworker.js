var zmq = require("zmq");
var resp = zmq.socket("req");
var args = process.argv.slice(2);
var backend_url = args[0] || "tcp://localhost:8059";
var my_id = args[1] || "NONE";
var disp_text = args[2] || "Ready";
var reply_text = args[3] || "Done";

var verbose = false;

if(args[args.length - 1] == "-v"){
    verbose = true;
    args.pop();
}

resp.indentity = my_id;
resp.connect(backend_url);

if(verbose){
    console.log('Worker (%s) connected to "%s"', my_id, backend_url);
}

resp.on("message", function(client, delimiter, msg){
    if(verbose){
        console.log('Worker (%s) has received request "%s" from client (%s)',
            my_id, msg.toString(), client);
    }
	setTimeout(function(){
		resp.send([client,'',reply_text]);
		if(verbose){
		    console.log('Worker (%s) has sent its reply "%s"', my_id, reply_text);
        }
	}, 1000);
});

resp.send(con_text);

if(verbose){
    console.log('Worker (%s) has sent its first connection message: "%s"', my_id, disp_text);
}



