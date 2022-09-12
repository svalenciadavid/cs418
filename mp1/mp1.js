/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author David Valencia <dvalen25@illinois.edu>
 * 
 * Updated Spring 2021 to use WebGL 2.0 and GLSL 3.00
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The vertex array object for the triangle */
var vertexArrayObject;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

// /** @global The speed for our ball */
var xspeed = 0.05;
var yspeed = 0.02;

/** @global The ModelView matrix contains any modeling and viewing transformations, model2 is the circle */
var modelViewMatrix = glMatrix.mat4.create();
var model2ViewMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;


/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


/**
 * Loads a shader.
 * Retrieves the source code from the HTML document and compiles it.
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}


/**
 * Set up the fragment and vertex shaders.
 */
function setupShaders() {
  // Compile the shaders' source code.
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program.
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  // We only use one shader program for this example, so we can just bind
  // it as the current program here.
  gl.useProgram(shaderProgram);
    
  // Query the index of each attribute in the list of attributes maintained
  // by the GPU. 
  shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexColor");
    
  //Get the index of the Uniform variable as well
  shaderProgram.modelViewMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
}


/**
 * Set up the buffers to hold the I's vertex positions and colors.
 */
function setupBuffers(xScale) { 
    
  // Create the vertex array object, which holds the list of attributes for
  // the triangle.
  vertexArrayObject = gl.createVertexArray();
  gl.bindVertexArray(vertexArrayObject); 

  // Create a buffer for positions, and bind it to the vertex array object.
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  vertices = [];
  // Define a UofI I with triangles
  if (document.getElementById("I").checked == true) {
    vertices = [
      // Top I
      -4.0/5 * xScale,  5/5,  0.0/5,
      -4.0/5 * xScale, 3.0/5,  0.0/5,
      -2.0/5 * xScale, 3.0/5,  0./5,

      -4.0/5 * xScale,  5/5,  0.0/5,
      2.0/5 * xScale, 3.0/5,  0.0/5,
      -2.0/5 * xScale, 3.0/5,  0./5,

      -4.0/5 * xScale,  5/5,  0.0/5,
      2.0/5 * xScale, 3.0/5,  0.0/5,
      4.0/5 * xScale, 5.0/5,  0./5,

      4.0/5 * xScale,  5/5,  0.0/5,
      4.0/5 * xScale, 3.0/5,  0.0/5,
      2.0/5 * xScale, 3.0/5,  0./5,

      // Middle I
      -2.0/5 * xScale,  3/5,  0.0/5,
      2.0/5 * xScale, 3.0/5,  0.0/5,
      -2.0/5 * xScale, -3.0/5,  0./5,

      2.0/5 * xScale,  -3/5,  0.0/5,
      2.0/5 * xScale, 3.0/5,  0.0/5,
      -2.0/5 * xScale, -3.0/5,  0./5,


      // Bottom I
      
      -4.0/5 * xScale,  -5/5,  0.0/5,
      -4.0/5 * xScale, -3.0/5,  0.0/5,
      -2.0/5 * xScale, -3.0/5,  0./5,

      -4.0/5 * xScale,  -5/5,  0.0/5,
      -2.0/5 * xScale, -3.0/5,  0.0/5,
      4.0/5 * xScale, -5.0/5,  0./5,

      4.0/5 * xScale,  -5/5,  0.0/5,
      2.0/5 * xScale, -3.0/5,  0.0/5,
      -2.0/5 * xScale, -3.0/5,  0./5,

      4.0/5 * xScale,  -5/5,  0.0/5,
      4.0/5 * xScale, -3.0/5,  0.0/5,
      2.0/5 * xScale, -3.0/5,  0./5
    ];
  }

  if (document.getElementById("MyAnimation").checked == true) {
    vertices = [
      // Draws start of a circle
      0,  0,  0
    ];
    numVertices = 30;
    radius = 0.3;
    for (i=0;i<numVertices;i++){
      angle = i *  2 * Math.PI / numVertices;
      x=(radius * Math.cos(angle));
      y=(radius * Math.sin(angle));
      vertices.push(x);
      vertices.push(y);
      vertices.push(0);
    }

  }
  // Populate the buffer with the position data.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3; //Num of points in vertex
  vertexPositionBuffer.numberOfItems = vertices.length/vertexPositionBuffer.itemSize; //Num of vertices

  // Binds the buffer that we just made to the vertex position attribute.
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // Do the same steps for the color buffer.
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,

        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
        1, 0.5, 0, 1.0,
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = colors.length/vertexColorBuffer.itemSize;  
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

   // Enable each attribute we are using in the VAO.  
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}


/**
 * Draws a frame to the screen.
 */
function draw() {
  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Clear the screen.
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the vertex array object that we set up.
  gl.bindVertexArray(vertexArrayObject);
    
  // Send the ModelView matrix with our transformations to the vertex shader.
  if (document.getElementById("I").checked == true) {
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
      false, modelViewMatrix);
  }

  if (document.getElementById("MyAnimation").checked == true) {
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
      false, model2ViewMatrix);
  }
    
  // Render the I
  if (document.getElementById("I").checked == true) {
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  } else if (document.getElementById("MyAnimation").checked == true) {
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexPositionBuffer.numberOfItems);
  }
  
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}

/**
 * Animates the triangle by updating the ModelView matrix with a rotation
 * each frame.
 */
 function animate(currentTime) {
  // Read the speed slider from the web page.
  var speed = document.getElementById("speed").value;

  // Convert the time to seconds.
  currentTime *= 0.001;
  // Subtract the previous time from the current time.
  var deltaTime = currentTime - previousTime;
  // Remember the current time for the next frame.
  previousTime = currentTime;
     
  // Update geometry to rotate 'speed' degrees per second.
  if (document.getElementById("I").checked == true) {
    rotAngle += speed * deltaTime;
    if (rotAngle > 360.0) {
      rotAngle = 0.0;
    }

    rotation = glMatrix.mat4.create();
    glMatrix.mat4.fromZRotation(rotation, degToRad(rotAngle));

    // Translation
    trans = glMatrix.vec3.create();
    glMatrix.mat4.getTranslation(trans, modelViewMatrix);
    // Check if my object is out of view, then put it in the opposite side of the screen, creating a looping effect
    if (trans[0] >= 3) {
      trans[0] = -3;
    }
    glMatrix.mat4.fromTranslation(modelViewMatrix, glMatrix.vec3.fromValues(trans[0] + speed/1000, 0, 0)); //TODO: un-do
    glMatrix.mat4.mul(modelViewMatrix, modelViewMatrix, rotation);
  }

  if (document.getElementById("MyAnimation").checked == true) {
    // animation for sphere
    // Get current translation
    trans = glMatrix.vec3.create();
    glMatrix.mat4.getTranslation(trans, model2ViewMatrix);
    // If x has hit wall
    // These collisions are distance the center of circle from edges
    // This means the center + radius distance is the most we can be from the edge to call it a collision
    // in this case we subtract from 1 the radius, since 1 is the clip coordinate max
    if (trans[0] >= 0.7 || trans[0] <= -0.7) {
      xspeed *= -1;
    }

     // If y has hit wall
     if (trans[1] >= 0.7 || trans[1] <= -0.7) {
      yspeed *= -1;
    }

    glMatrix.mat4.fromTranslation(model2ViewMatrix, glMatrix.vec3.fromValues(trans[0] + xspeed, trans[1] + yspeed, 0));
    
  }
  
  var xScale = Math.cos(currentTime);
  
  setupBuffers(xScale);     

  // Draw the frame.
  draw();
  
  // Animate the next frame. The animate function is passed the current time in
  // milliseconds.
  requestAnimationFrame(animate);
}


/**
 * Startup function called from html code to start the program.
 */
 function startup() {
  console.log("Starting animation...");
  // mat4.create();
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(animate); 
}

