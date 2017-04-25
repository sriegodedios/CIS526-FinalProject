
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
var userNames = ["Joe", "Bob", "Bilbo", "Henry", "Hank", "Sean", "Lane", "Krishane", "Ryan", "Shane", "Joe", "Evan", "Kyle", "Matt"];
var user = '';

var countdown = 10;

setInterval(function(){
  countdown--;
  if(countdown === -1){
    countdown = 10;
  }
  io.emit('timer', {countdown: countdown});
}, 1000);

// When a user connects
io.on('connection', function(socket){
  numUsers++;
  io.emit('userCount', numUsers);
  console.log("User connected, total: " + numUsers);

  //Assing user a random username
  var randName = userNames[Math.floor(Math.random() * userNames.length)];
  user = randName + ": ";

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
