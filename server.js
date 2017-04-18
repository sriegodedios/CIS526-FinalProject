
"use strict;"

// The port to serve on
const PORT = 3433;

// Global variables
const http = require('http');
const fs = require('fs');
const server = new http.Server(handleRequest);
const io = require('socket.io')(server);

// Start the server
server.listen(PORT, function(){
  console.log("Listening on port", PORT);
});

function onConnection(socket){
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
}

io.on('connection', onConnection);

/** @function serveFile
*
*
*/
function serveFile(file, type, req, res){
  fs.readFile(file, function(err, data){
    if(err){
      console.error(err);
      res.statusCode = 500;
      res.end("Server error");
      return;
    }
    res.setHeader('ContentType', type);
    res.end(data);
  });
}

/**
*
*/
function handleRequest(req, res){
  switch(req.url){
    case '/':
    case '/index.html':
      serveFile('public/index.html', 'text/html', req, res);
      break;
    case '/style.css':
        serveFile('public/style.css', 'text/css', req, res);
        break;
    case '/script.js':
      serveFile('public/script.js', 'text/javascript', req, res);
      break;
    default:
      res.statusCode = 404;
      res.end("Not found");
  }
}
