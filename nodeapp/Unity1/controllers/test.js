var http = require('http')
var fs = require('fs');
var server = http.createServer();

module.exports.test = function(req, res){
server.on('request', function(req, res){
	console.log('client request');
	var filename = '/bootstrap/img/house.png';
	fs.readFile(filename, function(err, data){
		res.writeHead(200, {"Content-Type" : "image/png"});
		res.write(data);
		res.end();
	});
});
};
