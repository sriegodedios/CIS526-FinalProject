(function(){
  var socket = io();
  var canvas = $('#whiteboard')[0];
  var colors = $('.color')
  var context = canvas.getContext('2d');

  var current = {
    color: 'black'
  };

  var drawing = false;

  canvas.addEventListener('mousedown', mouseDown, false);
  canvas.addEventListener('mouseup', mouseUp, false);
  canvas.addEventListener('mouseout', mouseUp, false);
  canvas.addEventListener('mousemove', throttle(mouseMove, 10), false);

  for(var i=0; i < colors.length; i++){
    colors[i].addEventListener('click', colorUpdate, false);
  }

  socket.on('drawing', drawingEvent);

  window.addEventListener('resize', resize, false);
  resize();

  function draw(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if(!emit){ return; }
    var width = canvas.width;
    var height = canvas.height;

    socket.emit('drawing', {
      x0: x0 / width,
      y0: y0 / height,
      x1: x1 / width,
      y1: y1 / height,
      color: color
    });
  }

  function mouseDown(e){
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function mouseUp(e){
    if(!drawing){return; }
    draw(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function mouseMove(e){
    if(!drawing){return; }
    draw(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function colorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

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

  function drawingEvent(data){
    var width = canvas.width;
    var height = canvas.height;
    draw(data.x0 * width, data.y0 * height, data.x1 * width, data.y1 * height, data.color);
  }

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
})();
