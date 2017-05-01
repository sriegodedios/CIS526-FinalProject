
"use strict;"

// The port to serve on
const PORT = 3433;

// Global variables
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const trends = require('node-google-search-trends');
const bodyParser = require('body-parser');

// Start the server
http.listen(PORT, function(){
  console.log("Listening on port", PORT);
});

// Load in files
app.use(express.static('public'));

app.use(bodyParser.urlencoded({
   extended: false
}));

app.use(bodyParser.json());

var numUsers = 0;
var user = '';
var userNames = [];

app.get('/', function(req, res){
  res.sendFile('username-form.html');
});

app.post('/', function(req, res){
  user = req.body.username;
  res.sendFile(__dirname + '/public/index.html');
});

// Array of topics
var topics = [];
var topic;
trends('United States', 8, function(err, data) {
    if (err) console.err(err);
    for (i = 0; i < Object.keys(data).length; i++) {
        topics[i] = data[i].title[0];
    }
    topic = topics[Math.floor(Math.random() * topics.length)];
});

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
  userNames[socket.id] = user;
  numUsers++;
  io.emit('userCount', numUsers);
  console.log("User connected, total: " + numUsers);

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
    socket.emit('message', text);
    socket.broadcast.emit('message',text);
  });

  // On user disconnect
  socket.on('disconnect', function(){
    numUsers--;
    io.emit('userCount', numUsers);
    delete userNames[socket.id];
    console.log("User disconnected, total: ", numUsers);
  })
});
