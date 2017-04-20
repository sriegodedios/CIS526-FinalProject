
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

var numUsers = 0;

io.on('connection', function(socket){
  numUsers++;
  io.emit('userCount', numUsers);
  console.log("User connected, total: " + numUsers);

  // Emit lines drawn by users
  socket.on('draw_line', function(data){
    socket.broadcast.emit('draw_line', data);
  });

  // Emit message
  socket.on('message', function(text){
    io.emit('message', text);
  });

  // On user disconnect
  socket.on('disconnect', function(){
    numUsers--;
    io.emit('userCount', numUsers);
    console.log("User disconnected, total: ", numUsers);
  })
});
