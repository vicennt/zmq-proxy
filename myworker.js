var zmq = require("zmq");
var resp = zmq.socket("req");
var args = process.argv.slice(2);
var backend_url = args[0];
var my_id = args[1];
var con_text = "id";
var resp_text = args[2];

resp.indentity = my_id;
resp.connect(backend_url);
resp.on("message", function(client, delimiter, msg){
	setTimeout(function(){
		resp.send([client,'',resp_text]);
	}, 1000);
});

resp.send(con_text);



