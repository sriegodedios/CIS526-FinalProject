var name;

// When page loads serve login page
$(document).ready(function(){
  $('.main-page').hide();
  var form = document.getElementsByClassName('userform');
  //$('body').append(form);
  $('#log').load('username-form.html', function(){
    $('body').css("background-color","gray");
    $('#title-box').removeClass("col-lg-4");
    $('#title').removeClass("text-left");
    $('#title').addClass('text-center');
    $('#title').css("font-size", "60px");
    $('#loginbox').on('keydown', function(e){
      if(e.keyCode === 13){
        $('#loginbtn').trigger('click');
      }
    });

    $('#loginbox').on('input', function(){
      if($(this).val().length > 10){
        $(this).val(name);
        return;
      }
      name = $(this).val().trim().replace(/\s/g, '');
      $(this).val(name);
    });

    $('#loginbtn').click(function(){
      $('#log').empty();
      loadBoard();
      return false;
    })
  });
});

function loadBoard(){
  var socket = io();
  var canvas = $('#whiteboard')[0];
  var colors = $('.color')
  var context = canvas.getContext('2d');

  // Current color
  var current = {
    color: 'black'
  };

  var drawing = false;

  // Change classes and css
  $('body').css("background-color", "white");
  $('#title-box').addClass("col-lg-4");
  $('#title').addClass("text-left");
  $('#title').removeClass('text-center');
  $('#title').css("font-size", "36px");
  $("#log").empty();
  $(".main-page").show();

  // Add events to canvas
  canvas.addEventListener('mousedown', mouseDown, false);
  canvas.addEventListener('mouseup', mouseUp, false);
  canvas.addEventListener('mouseout', mouseUp, false);
  canvas.addEventListener('mousemove', throttle(mouseMove, 10), false);

  // Changes users line color
  for(var i=0; i < colors.length; i++){
    colors[i].addEventListener('click', colorUpdate, false);
  }

  // Draws line
  socket.on('draw_line', drawingEvent);

  // Checks to see if window has been resized
  window.addEventListener('resize', resize, false);
  resize();

  // Gets the position of the cursor
  function getMousePos(canvas, e){
    var rect = canvas.getBoundingClientRect();
    return{
        x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
      };
  }

  //Draw Line
  function draw(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    if(color === '#E3D8D5'){
      context.lineWidth = 35;
      context.stroke();
      context.closePath();
    }
    context.lineWidth = 7;
    context.stroke();
    context.closePath();

    // Get size of canvas
    if(!emit){ return; }
    var width = canvas.width;
    var height = canvas.height;

    // Draw from (x0, y0) to (x1, y1)
    socket.emit('draw_line', {
      x0: x0 / width,
      y0: y0 / height,
      x1: x1 / width,
      y1: y1 / height,
      color: color
    });
  }

  // Begin drawing on click at current position
  function mouseDown(e){
    drawing = true;
    var pos = getMousePos(canvas, e);
    posx = pos.x;
    posy = pos.y;
    current.x = posx;
    current.y = posy;
  }

  // Stop drawing when mouse is released
  function mouseUp(e){
    if(!drawing){return; }
    drawing = false;
    var pos = getMousePos(canvas, e);
    posx = pos.x;
    posy = pos.y;
    draw(current.x, current.y, posx, posy, current.color, true);
  }
 // Draw where mouse is moved
  function mouseMove(e){
    if(!drawing){return; }
    var pos = getMousePos(canvas, e);
    posx = pos.x;
    posy = pos.y;
    draw(current.x, current.y, posx, posy, current.color, true);
    current.x = posx;
    current.y = posy;
  }

  // Updates users color
  function colorUpdate(e){
    current.color = e.target.className.split(' ')[1];
    if(e.target.className.split(' ')[1] === 'eraser'){
      context.lineWidth = 20;
      current.color = ('#E3D8D5');
    }
  }

  // Limit the number of events per second
  function throttle(callback, delay){
    var previousCall = new Date().getTime();
    return function(){
      var time = new Date().getTime();

      if((time - previousCall) >= delay){
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }
 // Draws lines based on window size
  function drawingEvent(data){
    var width = canvas.width;
    var height = canvas.height;
    draw(data.x0 * width, data.y0 * height, data.x1 * width, data.y1 * height, data.color);
  }

  // Updates size of canvas on window resize
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
 // Displays that a user is typing
  $('#chat-text').keyup(function(){
    socket.emit('typing', {
      name: name
    });
  });

  // Creates a message when user is typing
  socket.on('typing', function(data){
    $("#typing").text(data.name + " is typing");
    setTimeout(function(){
      $("#typing").text('');
    }, 3000);
  });

  // Displays the number of users online
  socket.on('userCount', function(count){
    $('#numUsers').text("Number of users: " + count);
  });

  // Emits a welcome message and clears after 10 seconds
  var count = 10;

  socket.on('welcome', function(message){
    $('<li>').attr('id', 'welcome-text').text(message + name).appendTo('#message-log');
    setInterval(function(){
      count--;
      if(count === 0){
        $("#welcome-text").text("");
      }
    }, 1000);
  });

  // Appends messages to an li tag and then to the unordered list
  socket.on('message', function(text){
    var li = $('<li>')
    .addClass('messages')
    .text(text.text)
    .appendTo('#message-log');
    $('<strong>').text(text.name + ": ").prependTo(li);
  });

  // Emits the message when the send button is clicked
  $('#chat-send').on('click', function(){
    var text = $('#chat-text').val();
    socket.emit('message', {
    text: text,
    name: name
  });
    $('#chat-text').val('');
  });

// Emits the message when enter is pressed while textbox has focus
  $('#chat-text').keypress(function(e){
    if(e.which === 13){
      var text = $('#chat-text').val();
      socket.emit('message', {
        text: text,
        name: name
      });
      $('#chat-text').val('');
    }
  });

 // Displays the countdown in (m:s) and clears canvas when timer is 0
  socket.on('timer', function(data){
    var time =$("#time");
    var topic = $('#topic');
    minutes = parseInt(data.countdown / 60, 10);
    seconds = parseInt(data.countdown % 60, 10);

    seconds = seconds < 10 ? "0" + seconds: seconds;
    time.text(minutes + ":" + seconds);
    topic.text("Topic: " + data.topic);
    if(data.countdown === 0){
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
}
