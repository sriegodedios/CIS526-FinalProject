(function (){
  $('.main-page').css('visibility', 'visible');
  var socket = io();
  var canvas = $('#whiteboard')[0];
  var colors = $('.color')
  var context = canvas.getContext('2d');

  // Current color
  var current = {
    color: 'black'
  };

  var drawing = false;

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
    context.lineWidth = 3;
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

  // Displays the number of user online
  socket.on('userCount', function(count){
    $('#numUsers').text("Number of users: " + count);
  });

  // Appends messages to an li tag and then to the unordered list
  socket.on('message', function(message){
    var li = $('<li>')
    .text(message.text)
    .appendTo('#message-log');
    $('<strong>').text(message.username).prependTo(li);
  });

  // Emits the message when the send button is clicked
  $('#chat-send').on('click', function(){
    var text = $('#chat-text').val();
    socket.emit('message', text);
    $('#chat-text').val('');
  });

  $('#chat-text').keypress(function(e){
    if(e.which === 13){
      var text = $('#chat-text').val();
      socket.emit('message', text);
      $('#chat-text').val('');
    }
  });


  socket.on('timer', function(data){
    var time =$("#time");
    minutes = parseInt(data.countdown / 60, 10);
    seconds = parseInt(data.countdown % 60, 10);

    seconds = seconds < 10 ? "0" + seconds: seconds;
    time.text(minutes + ":" + seconds);
    console.log(data.countdown);
    if(data.countdown === 0){
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

  });
})();
