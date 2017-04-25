
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

// Load in files
app.use(express.static('public'));

var numUsers = 0;
var userNames = {};
var user = '';

// When a user connects
io.on('connection', function(socket){
  numUsers++;
  io.emit('userCount', numUsers);
  console.log("User connected, total: " + numUsers);

  //var nameTag = socket.handshake.query.nameTag.trim().replace(/\s/g, '');
  //nameTag = nameTag.substr(0, 10);
  user = "User " + numUsers + ": ";

  // Emit lines drawn by users
  socket.on('draw_line', function(data){
    socket.broadcast.emit('draw_line', data);
  });

  // Emit message
  socket.on('message', function(text){
    // Check to see if message is a string
    if(typeof(text) != 'string'){
      socket.disconnect();
      return;
    }

    var thisUser = userNames[socket.id];

    io.emit('message', {
      text: text,
      username: user
    });
  });

  // On user disconnect
  socket.on('disconnect', function(){
    numUsers--;
    io.emit('userCount', numUsers);
    delete userNames[socket.id];
    console.log("User disconnected, total: ", numUsers);
  })
});
