var zmq = require('zmq');
var frontend = zqm.require('router');
var backend = zqm.require('router');

var frontend_port = 8059;
var backend_port = 8060;

var workers = [];
var clients = [];

frontend.bindSync("tcp://*:" + frontend_port);
frontend.bindSync("tcp://*:" + backend_port);

// When the frontend recive a petition
frontend.on("message", function(){
	var args = Array.apply(null, arguments);
	if(workers.length > 0){ // There are one or more workers
		var myWorker = workers.shift(); // Getting the firts id worker
		var m = [myWorker,''].concat(args);
		backend.send(m); // Sending msg to worker
	}else
		clients.push({id: args[0],msg: args.slice(2)});
});

function processPendingClient(workerID){
	if(clients.length > 0) {
		var nextClient = clients.shift();
		var m = [workerID,'',nextClient.id,''].concat(nextClient.msg);
		backend.send(m);
		return true;
	}else
		return false;
}


backend.on("message", function(){
	var args = Array.apply(null, arguments);
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


