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
frontend.bindSync("tcp://*:" + backend_port);

// When the frontend recive a petition
frontend.on("message", function(){ // Socket add ID client automatically
    var args = Array.apply(null, arguments); // Ex. ["Client1","","Work"]
    console.log("arguments in msg socket frontend: " + args);
	if(workers.length > 0){ // There is any available worker
		var myWorker = workers.shift(); // Getting the oldest id worker
		var m = [myWorker,''].concat(args); // Ex. ["Worker1","","Client1","","Work"]
		backend.send(m); // Sending msg to worker
	}else // No available worker exist
		// Save the client ID and message into the clients array
		clients.push({id: args[0],msg: args.slice(2)});
});

function processPendingClient(worker_id){
	// Check whether there is any pending client
	if(clients.length > 0) {
		// Get first client data
		var client = clients.shift();
		var m = [worker_id,'',client.id,''].concat(client.msg);
		sendToWorker(m);
		return true;
	}else // no client is there
		return false;
}

function sendToWorker(msg){
    if(verbose){
        console.log('Sending client (%s) request to worker (%s) through backend.',
            msg[2], msg[0]);
        aux.showMessage(msg);
    }
    backend.send(msg);
}


backend.on("message", function(){
	console.log("arguments in msg socket backend: " + arguments.toString());
	var args = Array.apply(null, arguments); // Ex. ["Client1","","Work"]
	if(args.length == 3) {
		if(!processPendingClient(args[0])) {
            workers.push(args[0]);
        }else{
			var workerID = args[0];
			args.args.slice(2);
			frontend.send(args);
			if(!processPendingClient(workerID))
				workers.push(workerID);
		}
	}
});


