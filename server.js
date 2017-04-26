
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

// Array of topics
var topics = ["Football", "Basketball", "Soccer", "Video Games", "Baseball", "Hockey", "Bitcoin", "Random"];
var topic = topics[Math.floor(Math.random() * topics.length)];;


// Seconds till canvas reset
var countdown = 300;

// Start counter
setInterval(function(){
  countdown--;
  if(countdown === -1){
    countdown = 300;
    topic = topics[Math.floor(Math.random() * topics.length)];
  }
  io.emit('timer', {countdown: countdown,
  topic: topic});
}, 1000);

// When a user connects
io.on('connection', function(socket){
  numUsers++;
  io.emit('userCount', numUsers);
  console.log("User connected, total: " + numUsers);

  // Assign user a random username
  //var randName = userNames[Math.floor(Math.random() * userNames.length)];
  //user = randName;

  // Emit welcome message
  socket.emit('welcome', "Welcome ");

  // Emit lines drawn by users
  socket.on('draw_line', function(data){
    socket.broadcast.emit('draw_line', data);
  });

  socket.on('typing', function(data){
    socket.emit('typing', data);
    socket.broadcast.emit('typing', data);
  });

  // Emit message
  socket.on('message', function(text){
    // Check to see if message is a string
    if(typeof(text) != 'string'){
      socket.disconnect();
      return;
    }
    socket.emit('message', {
      text: text,
      username: user
    });
    socket.broadcast.emit('message', {
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
