// Execution example -> $node mybroker.js 8059 8060 -v

var zmq = require('zmq');
var aux = require('./auxfunctions')
var frontend = zmq.socket('router');
var backend = zmq.socket('router');

var args = process.argv.slice(2);
var frontend_port = args[0] || 8059;
var backend_port = args[1] || 8060;

// Array of available workers
var workers = [];
// Array of pending clients
var clients = [];

var verbose = false;
if(args[args.length - 1] == "-v"){
    verbose = true;
    args.pop();
}

frontend.bindSync("tcp://*:" + frontend_port);
backend.bindSync("tcp://*:" + backend_port);

if(verbose)
    console.log("Proxy are online now");


// When the frontend recive a client petition
frontend.on("message", function(){ // Socket add ID client automatically
    if(verbose) {
        console.log("[FRONTEND LOG] New petition from a client");
        console.log("[FRONTEND LOG] Arguments: " + aux.convertArrayToString(arguments));
    }

    var args = Array.apply(null, arguments);
	if(workers.length > 0){ // There is any available worker
        if(verbose)
            console.log("[FRONTEND LOG] Worker available, forwarding client request");
        var myWorker = workers.shift(); // Getting the oldest id worker
		var m = [myWorker,''].concat(args); // Ex. ["Worker1","","Client1","","Work"]
		backend.send(m); // Sending msg to worker
	}else // No available worker exist
        if(verbose)
            console.log("[FRONTEND LOG] No worker available, saving client petition");
	    clients.push({id: args[0],msg: args.slice(2)}); // Save client petition

});

// This function is called for two reasons (1.New worker online 2. Worker end your job)
function processPendingClient(worker_id){
	// Check whether there is any pending client
	if(clients.length > 0) {
		// Get first client data
		var client = clients.shift();
		var msg = [worker_id,'',client.id,''].concat(client.msg);
        backend.send(msg);
        if(verbose) {
            console.log("[BACKEND LOG] Sending client (%s) request to worker (%s) through backend.", msg[2], msg[0]);
            console.log("[BACKEND LOL] Message: " + aux.convertArrayToString(msg));
        }
        return true;
	}else // no client is there
		return false;
}

backend.on("message", function(){
    if(verbose)
        console.log("[BACKEND LOG] Arguments: " + aux.convertArrayToString(arguments));

	var args = Array.apply(null, arguments);
	if(args.length == 3) { // Msg from worker  Ex. ["Worker1","","Ready"] or ["Client1","","Done"]
        if(verbose)
            console.log("[BACKEND LOG] Message recived from worker");
        if(!processPendingClient(args[0])) // Check if there are clients waiting
            workers.push(args[0]);
	}else{ // Response msg for the client through the frontend
        if(verbose)
	        console.log("[BACKEND LOG] Trasmitting the msg to the client");
        var workerID = args[0];
        args = args.slice(2); // Delete worker id and delimitter
        frontend.send(args);
        if(!processPendingClient(workerID)) // Check if there are clients waiting
            workers.push(workerID);
	}
});


