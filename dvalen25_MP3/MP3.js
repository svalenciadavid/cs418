/**
 * @file MP3.js - A simple WebGL rendering engine
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP2 at the University of Illinois at
 * Urbana-Champaign.
 * 
 * Updated Spring 2021 for WebGL 2.0/GLSL 3.00 ES.
 */
//TODO:FINISH
/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas to draw on */
var canvas;

/** @global The GLSL shader program */
var shaderProgram;

/** @global An object holding the geometry for your 3D terrain */
var myTerrain;

/** @global The Model matrix */
var modelViewMatrix = glMatrix.mat4.create();
/** @global The Projection matrix */
var projectionMatrix = glMatrix.mat4.create();
/** @global The Normal matrix */
var normalMatrix = glMatrix.mat3.create();

// Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [227/255, 191/255, 76/255];
/** @global Diffuse material color/intensity for Phong reflection */
var kDiffuse = [227/255, 191/255, 76/255];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [227/255, 191/255, 76/255];
/** @global Shininess exponent for Phong reflection */
var shininess = 2;

// Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = glMatrix.vec4.fromValues(0, 2, 2, 1.0); //TODO: light? , 1.0
/** @global Ambient light color/intensity for Phong reflection */
var ambientLightColor = [0.1, 0.1, 0.1];
/** @global Diffuse light color/intensity for Phong reflection */
var diffuseLightColor = [1, 1, 1];
/** @global Specular light color/intensity for Phong reflection */
var specularLightColor = [1, 1, 1];

/** @global Edge color for black wireframe */
var kEdgeBlack = [0.0, 0.0, 0.0];
/** @global Edge color for white wireframe */
var kEdgeWhite = [0.7, 0.7, 0.7];

//* MP3
var camPosition = glMatrix.vec3.fromValues(0, -3, 5);           //the camera's current position, eye pt
var camOrientation = glMatrix.quat.create();        //the camera's current orientation, rotation matrix
var camSpeed = 0.01;                           //the camera's current speed in the forward direction, for moving forward
var camInitialDir = glMatrix.vec3.fromValues(0.0, 0.5, -1.0);  //the camera's initial view direction, vector looking at, orientation
/** @global The currently pressed keys */
var keys = {};

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}


//-----------------------------------------------------------------------------
// Setup functions (run once)
/**
 * Startup function called from the HTML code to start program.
 */
function startup() {
  // Set up the canvas with a WebGL context.
  canvas = document.getElementById("glCanvas");
  gl = createGLContext(canvas);

  // Compile and link the shader program.
  setupShaders();

  // Let the Terrain object set up its own buffers.
  myTerrain = new Terrain(16, -1, 1, -1, 1);
  myTerrain.setupBuffers(shaderProgram);

  // Set the background color to sky blue (you can change this if you like).
  gl.clearColor(0.82, 0.93, 0.99, 1.0);

  gl.enable(gl.DEPTH_TEST);
  requestAnimationFrame(animate);

  //* MP3
  document.onkeydown = keyDown;
  document.onkeyup = keyUp;
}


/**
 * Creates a WebGL 2.0 context.
 * @param {element} canvas The HTML5 canvas to attach the context to.
 * @return {Object} The WebGL 2.0 context.
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
 * Loads a shader from the HTML document and compiles it.
 * @param {string} id ID string of the shader script to load.
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
    
  // Return null if we don't find an element with the specified id
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
 * Sets up the vertex and fragment shaders.
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

  // We only need the one shader program for this rendering, so we can just
  // bind it as the current program here.
  gl.useProgram(shaderProgram);

  // Query the index of each attribute and uniform in the shader program.
  shaderProgram.locations = {};
  shaderProgram.locations.vertexPosition =
    gl.getAttribLocation(shaderProgram, "vertexPosition");
  shaderProgram.locations.vertexNormal =
    gl.getAttribLocation(shaderProgram, "vertexNormal");

  shaderProgram.locations.modelViewMatrix =
    gl.getUniformLocation(shaderProgram, "modelViewMatrix");
  shaderProgram.locations.projectionMatrix =
    gl.getUniformLocation(shaderProgram, "projectionMatrix");
  shaderProgram.locations.normalMatrix =
    gl.getUniformLocation(shaderProgram, "normalMatrix");

  shaderProgram.locations.kAmbient =
    gl.getUniformLocation(shaderProgram, "kAmbient");
  shaderProgram.locations.kDiffuse =
    gl.getUniformLocation(shaderProgram, "kDiffuse");
  shaderProgram.locations.kSpecular =
    gl.getUniformLocation(shaderProgram, "kSpecular");
  shaderProgram.locations.shininess =
    gl.getUniformLocation(shaderProgram, "shininess");
  
  shaderProgram.locations.lightPosition =
    gl.getUniformLocation(shaderProgram, "lightPosition");
  shaderProgram.locations.ambientLightColor =
    gl.getUniformLocation(shaderProgram, "ambientLightColor");
  shaderProgram.locations.diffuseLightColor =
  gl.getUniformLocation(shaderProgram, "diffuseLightColor");
  shaderProgram.locations.specularLightColor =
  gl.getUniformLocation(shaderProgram, "specularLightColor");
  // * MP2:
  shaderProgram.locations.minZ = gl.getUniformLocation(shaderProgram, "minZ");
  shaderProgram.locations.maxZ = gl.getUniformLocation(shaderProgram, "maxZ");

  // * MP3:
  shaderProgram.locations.fogColor = gl.getUniformLocation(shaderProgram, "u_fogColor");
  shaderProgram.locations.fogDensity = gl.getUniformLocation(shaderProgram, "u_fogDensity");
  shaderProgram.locations.fog = gl.getUniformLocation(shaderProgram, "fog");
}

  //*MP3:
  var eulerX = 0;
  var eulerY = 0;
  var eulerZ = 0;
/**
 * Draws the terrain to the screen.
 */
function draw() {

  if (keys["+"]) { 
    camSpeed += 0.01;
  }
    
  if (keys["-"]) {
    camSpeed -= 0.01;
  }

  // * PITCH (seems good)
  if (keys["ArrowUp"]) { 
    // eulerX += 30;
    eulerX += 1;
  } else if (keys["ArrowDown"]) { 
    // eulerX -= 30;
    eulerX -= 1;
  } 

  // * ROLL (seems good)
  if (keys["ArrowLeft"]) { 
    // eulerY -= 30;
    eulerY -= 1;

  } else if (keys["ArrowRight"]) { 
    // eulerY += 30;
    eulerY += 1;
  }

  if (keys["Escape"]) { 
    //TODO: Reset camOrientation and camPosition to their original values if ESC is pressed
    camPosition = glMatrix.vec3.fromValues(0, -3, 5);            //the camera's current position, eye pt
    camOrientation = glMatrix.quat.create();        //the camera's current orientation, rotation matrix
  }

  // * Perform pitch and roll
  orientationDelta = glMatrix.quat.create();
  degX = degToRad(eulerX);
  // console.log("eulerX", eulerX, "degree x: ", degX);
  glMatrix.quat.fromEuler(orientationDelta, degToRad(eulerX), degToRad(eulerY), degToRad(eulerZ));
  // glMatrix.quat.fromEuler(orientationDelta, eulerX, eulerY, eulerZ);
  glMatrix.quat.multiply(camOrientation, orientationDelta, camOrientation);
  // glMatrix.quat.multiply(camOrientation, camOrientation, orientationDelta);
  // * Position Changes
  deltaPosition = glMatrix.vec3.create(); // Change in position in the forward direction, to add to camPosition
  forwardDirection = glMatrix.vec3.create();
  glMatrix.vec3.transformQuat(forwardDirection, camInitialDir, camOrientation);
  glMatrix.vec3.normalize(forwardDirection, forwardDirection);
  // * set deltaPosition to the forwardDirection scaled to a length of camSpeed
  glMatrix.vec3.scale(deltaPosition, forwardDirection, camSpeed);
  glMatrix.vec3.add(camPosition, camPosition, deltaPosition);

  document.getElementById("roll").value = eulerX;
  document.getElementById("pitch").value = eulerY;
  document.getElementById("speed").value = camSpeed;

  //* END OF MP3 AT THIS POINT

  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the color buffer and the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Generate the projection matrix using perspective projection.
  const near = 0.1;
  const far = 200.0;
  glMatrix.mat4.perspective(projectionMatrix, degToRad(45), 
                            gl.viewportWidth / gl.viewportHeight,
                            near, far);
  
  // Generate the view matrix using lookat.
  //* MP3:

  const eyePt = camPosition;  //glMatrix.vec3.fromValues(0.0, -2.5, 1.5); //* DONE

  // * Transform up vector by camOrientation
  const up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
  glMatrix.vec3.transformQuat(up, up, camOrientation);

  // * lookAtPt = Center
  const lookAtPt = glMatrix.vec3.create(); //camInitialDir? glMatrix.vec3.fromValues(0.0, 1.5, -1.0);
  // * * transform camIntialDir by camOrientation to generate view direction:
  viewDir = glMatrix.vec3.create();
  glMatrix.vec3.transformQuat(viewDir, camInitialDir, camOrientation);
  // * LookAt is then the sum of position and viewDir
  glMatrix.vec3.add(lookAtPt, camPosition, viewDir);

  glMatrix.mat4.lookAt(modelViewMatrix, eyePt, lookAtPt, up);

  setMatrixUniforms();

  // * MP 3:
  // lighposition has to be a array float 3
  var newLightPosition = glMatrix.vec4.create()
  newLightPosition = modelViewMatrix * newLightPosition;
  
  // var sendLightPosition = [newLightPosition[0], newLightPosition[1], newLightPosition[2]];
  setLightUniforms(ambientLightColor, diffuseLightColor, specularLightColor,
                   lightPosition);
  
  // Draw the triangles, the wireframe, or both, based on the render selection.
  if (document.getElementById("fog").checked == true) {
    gl.uniform1i(shaderProgram.locations.fog, 1);
  } else {
    gl.uniform1i(shaderProgram.locations.fog, 0);
  }
  // * MP 3:
  var fogColor = new Float32Array([1.0, 1.0, 1.0, 1.0]);
  var fogDensity = 0.3; 
  if (document.getElementById("polygon").checked) { 
    var minZ = myTerrain.getMinElevation();
    gl.uniform1f(shaderProgram.locations.minZ, minZ);
    var maxZ = myTerrain.getMaxElevation();
    gl.uniform1f(shaderProgram.locations.maxZ, maxZ);

    // * MP3:
    gl.uniform1f(shaderProgram.locations.fogDensity, fogDensity);
    gl.uniform4fv(shaderProgram.locations.fogColor, fogColor);
    //

    setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess);
    myTerrain.drawTriangles();
  }
  else if (document.getElementById("wirepoly").checked) {
    var minZ = myTerrain.getMinElevation();
    gl.uniform1f(shaderProgram.locations.minZ, minZ);
    var maxZ = myTerrain.getMaxElevation();
    gl.uniform1f(shaderProgram.locations.maxZ, maxZ);

    // * MP 3:
    gl.uniform1f(shaderProgram.locations.fogDensity, fogDensity);
    gl.uniform4fv(shaderProgram.locations.fogColor, fogColor);
    //

    setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess); 
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    myTerrain.drawTriangles();
    gl.disable(gl.POLYGON_OFFSET_FILL);
    setMaterialUniforms(kEdgeBlack, kEdgeBlack, kEdgeBlack, shininess);
    myTerrain.drawEdges();
  }
  else if (document.getElementById("wireframe").checked) {
    setMaterialUniforms(kEdgeBlack, kEdgeBlack, kEdgeBlack, shininess);
    myTerrain.drawEdges();
  }

}


/**
 * Sends the three matrix uniforms to the shader program.
 */
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.locations.modelViewMatrix, false,
                      modelViewMatrix);
  gl.uniformMatrix4fv(shaderProgram.locations.projectionMatrix, false,
                      projectionMatrix);

  // We want to transform the normals by the inverse-transpose of the
  // Model/View matrix
  glMatrix.mat3.fromMat4(normalMatrix,modelViewMatrix);
  glMatrix.mat3.transpose(normalMatrix,normalMatrix);
  glMatrix.mat3.invert(normalMatrix,normalMatrix);

  gl.uniformMatrix3fv(shaderProgram.locations.normalMatrix, false,
                      normalMatrix);
}


/**
 * Sends material properties to the shader program.
 * @param {Float32Array} a Ambient material color.
 * @param {Float32Array} d Diffuse material color.
 * @param {Float32Array} s Specular material color.
 * @param {Float32} alpha shininess coefficient
 */
function setMaterialUniforms(a, d, s, alpha) {
  gl.uniform3fv(shaderProgram.locations.kAmbient, a);
  gl.uniform3fv(shaderProgram.locations.kDiffuse, d);
  gl.uniform3fv(shaderProgram.locations.kSpecular, s);
  gl.uniform1f(shaderProgram.locations.shininess, alpha);
}


/**
 * Sends light information to the shader program.
 * @param {Float32Array} a Ambient light color/intensity.
 * @param {Float32Array} d Diffuse light color/intensity.
 * @param {Float32Array} s Specular light color/intensity.
 * @param {Float32Array} loc The light position, in view coordinates.
 */
function setLightUniforms(a, d, s, loc) {
  gl.uniform3fv(shaderProgram.locations.ambientLightColor, a);
  gl.uniform3fv(shaderProgram.locations.diffuseLightColor, d);
  gl.uniform3fv(shaderProgram.locations.specularLightColor, s);
  //TODO: removed 
  //   // * MP3:
  // // glMatrix.mat4.multiply(loc, modelViewMatrix, loc); // TODO: remove
  // // glMatrix.vec3.transformMat4(loc, loc, modelViewMatrix);
  // var newLoc = modelViewMatrix * loc;
  // gl.uniform3fv(shaderProgram.locations.lightPosition, newLoc);
  gl.uniform3fv(shaderProgram.locations.lightPosition, loc);
}

/**
 * Animates...allows user to change the geometry view between
 * wireframe, polgon, or both.
 */
 function animate(currentTime) {
  // Draw the frame.
  draw();
  // Animate the next frame. 
  requestAnimationFrame(animate);
}

function keyDown(event) {
  if (event.key == "ArrowDown" || event.key == "ArrowUp" || event.key == "ArrowRight" || event.key == "ArrowLeft") {
    event.preventDefault();
  }
  // console.log(event.key); //Testing
  keys[event.key] = true;
}

function keyUp(event) {
  keys[event.key] = false;
}