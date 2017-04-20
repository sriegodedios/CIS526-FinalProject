
"use strict;"

// The port to serve on
const PORT = 3433;

// Global variables
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Start the server
http.listen(PORT, function(){
  console.log("Listening on port", PORT);
});

app.use(express.static('public'));

function onConnection(socket){
  socket.on('draw_line', (data) => socket.broadcast.emit('draw_line', data));
}

io.on('connection', onConnection);
