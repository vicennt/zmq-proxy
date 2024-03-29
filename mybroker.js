// Execution example -> $node mybroker.js 8059 8060 A B C D-v

var zmq = require('zmq');
var aux = require('./auxfunctions')
var frontend = zmq.socket('router');
var backend = zmq.socket('router');

var args = process.argv.slice(2);
var frontend_port = args[0] || 8059;
var backend_port = args[1] || 8060;
var args = args.slice(2); // Remove ports
// Array of available workers
var workers = [];
// Array of pending clients
var clients = [];
// Array with requests counters
var request_per_worker = [];
const answer_interval = 2000;
var busy_workers = [];

var verbose = false;
if(args[args.length - 1] == "-v"){
    verbose = true;
    args.pop();
}

// Create class array from args
var class_ids = [];
for(var i = 0; i < args.length; i++){
    class_ids[i] = args[i];
}

for(var i in class_ids){
    workers[class_ids[i]] = []; // workers['R'] = [] ....
    clients[class_ids[i]] = []; // clients['R'] = [] ....
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
    send_request(args);
});


backend.on("message", function(){
    if(verbose)
        console.log("[BACKEND LOG] Arguments: " + aux.convertArrayToString(arguments));
    var args = Array.apply(null, arguments);
    var class_id = args.pop(); // Get last arg -> Type
    if(args.length == 3) { // Msg from worker  Ex. ["Worker1","","Ready"] or ["Client1","","Done"]
        if(verbose)
            console.log("[BACKEND LOG] Message recived from worker");
        request_per_worker[args[0]] = 0;
        var worker_id = args[0];
        if(!processPendingClient(worker_id, class_id)) // Check if there are clients waiting
            workers[class_id].push(args[0]);
    }else{ // Response msg for the client through the frontend
        if(verbose)
            console.log("[BACKEND LOG] Trasmitting the msg to the client");
        request_per_worker[args[0]]++;
        var worker_id = args[0];
        clearTimeout(busy_workers[worker_id].timeout);
        args = args.slice(2); // Delete worker id and delimitter
        frontend.send(args);
        if(!processPendingClient(worker_id, class_id)) // Check if there are clients waiting
            workers[class_id].push(worker_id);
    }
});

// This function is called for two reasons (1.New worker online 2. Worker end your job)
function processPendingClient(worker_id, class_id){
	// Check whether there is any pending client
	if(clients[class_id].length > 0) {
		// Get first client data
		var client = clients[class_id].shift();
		var msg = [worker_id,'',client.id,''].concat(client.msg);
        send_msg_worker(msg);
        if(verbose) {
            console.log("[BACKEND LOG] Sending client (%s) request to worker (%s) through backend.", msg[2], msg[0]);
            console.log("[BACKEND LOL] Message: " + aux.convertArrayToString(msg));
        }
        return true;
	}else // no client is there
		return false;
}

function showStatistics(){
    if(verbose){
        var total_amount = 0;
        console.log('Current amount of requests server by each worker:');
        for (var i in request_per_worker) {
            console.log(' %s : %d requests', i, request_per_worker[i]);
            total_amount += request_per_worker[i];
        }
        console.log("Requets already serverd (total): %d", total_amount);
    }
}

function send_msg_worker(msg){
    var my_worker = msg[0];
    backend.send(msg);
    busy_workers[my_worker] = {};
    busy_workers[my_worker].msg = msg.slice(2);
    busy_workers[my_worker].timeout = setTimeout(generateTimeoutHandler(my_worker), answer_interval);
}

function send_request(args){
    var class_id = args.pop(); // Get last arg -> type
    if(workers[class_id].length > 0){
        if(verbose)
            console.log("[FRONTEND LOG] Worker available, forwarding client request");

        var my_worker = workers[class_id].shift();
        var msg = [my_worker,''].concat(args);
        send_msg_worker(msg);
    }else{
        if(verbose)
            console.log("[FRONTEND LOG] No worker available, saving client petition");
        clients[class_id].push({id: args[0],msg: args.slice(2)});
    }
}

function generateTimeoutHandler(worker_id){
    return function(){
        var msg = busy_workers[worker_id].msg;
        delete busy_workers[worker_id];
        send_request(msg);
    }
}

// Only in mode verbose
process.on('SIGINT', showStatistics);



