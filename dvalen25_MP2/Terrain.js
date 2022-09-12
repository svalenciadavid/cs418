/**
 * @file Terrain.js - A simple 3D terrain model for WebGL
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP2 at the University of Illinois at
 * Urbana-Champaign.
 * 
 * Updated Spring 2021 for WebGL 2.0/GLSL 3.00 ES.
 * 
 * You'll need to implement the following functions:
 * setVertex(v, i) - convenient vertex access for 1-D array
 * getVertex(v, i) - convenient vertex access for 1-D array
 * generateTriangles() - generate a flat grid of triangles
 * shapeTerrain() - shape the grid into more interesting terrain
 * calculateNormals() - calculate normals after warping terrain
 * 
 * Good luck! Come to office hours if you get stuck!
 */
// TODO: FINISH
class Terrain {   
    /**
     * Initializes the members of the Terrain object.
     * @param {number} div Number of triangles along the x-axis and y-axis.
     * @param {number} minX Minimum X coordinate value.
     * @param {number} maxX Maximum X coordinate value.
     * @param {number} minY Minimum Y coordinate value.
     * @param {number} maxY Maximum Y coordinate value.
     */
    constructor(div, minX, maxX, minY, maxY) {
        this.div = div;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        
        // Allocate the vertex array
        this.positionData = [];
        // Allocate the normal array.
        this.normalData = [];
        // Allocate the triangle array.
        this.faceData = [];
        // Allocate an array for edges so we can draw a wireframe.
        this.edgeData = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        // for (let i = 0; i < 10; i++) {
        //     this.shapeTerrain();
        // }
        this.shapeTerrain();
        console.log("Terrain: Sculpted terrain");

        this.calculateNormals();
        console.log("Terrain: Generated normals");

        // You can use this function for debugging your buffers:
        // this.printBuffers();
    }
    

    //-------------------------------------------------------------------------
    // Vertex access and triangle generation - your code goes here!
    /**
     * Set the x,y,z coords of the ith vertex
     * @param {Object} v An array of length 3 holding the x,y,z coordinates.
     * @param {number} i The index of the vertex to set.
     */
    setVertex(v, i) {
        // MP2: Implement this function!
        this.positionData[i*3] = v[0];
        this.positionData[i*3 + 1] = v[1];
        this.positionData[i*3 + 2] = v[2];
    }
    

    /**
     * Returns the x,y,z coords of the ith vertex.
     * @param {Object} v An array of length 3 to hold the x,y,z coordinates.
     * @param {number} i The index of the vertex to get.
     */
    getVertex(v, i) {
        // MP2: Implement this function!
        v[0]=this.positionData[i*3];
        v[1]=this.positionData[i*3 + 1];
        v[2]=this.positionData[i*3 + 2];
    }


    /**
     * This function does nothing.
     */    
    generateTriangles() {
        // MP2: Implement the rest of this function!
        var deltaX=(this.maxX-this.minX)/this.div;
        var deltaY=(this.maxY-this.minY)/this.div;
        
        for(var i=0;i<=this.div;i++) {
           for(var j=0;j<=this.div;j++) { 
               this.positionData.push(this.minX+deltaX*j);
               this.positionData.push(this.minY+deltaY*i);
               this.positionData.push(0);

               // Fill normal data
               this.normalData.push(0);
               this.normalData.push(0);
               this.normalData.push(0);
           }
        }

        for (var y = 0; y < this.div; y++) {
            for (var x = 0; x < this.div; x++) {
                var num_vertex_row = this.div + 1;
                var triangle_1_start = y * num_vertex_row + x;
                // We push 3 vertices for each face
                this.faceData.push(triangle_1_start);
                this.faceData.push(triangle_1_start + 1);
                this.faceData.push(triangle_1_start + num_vertex_row);
                
                // second triangle
                var triangle_2_start = triangle_1_start + 1;
                this.faceData.push(triangle_2_start);
                this.faceData.push(triangle_2_start + num_vertex_row);
                this.faceData.push(triangle_2_start + num_vertex_row - 1);
            }
        }
        // We'll need these to set up the WebGL buffers.
        this.numVertices = this.positionData.length/3;
        this.numFaces = this.faceData.length/3;
    }


    /**
     * This function does nothing.
     */
    shapeTerrain() {
        var delta = 0.005;
        var H = 0.00001
        for (var _ = 0; _ < 2000; _++) {

            // Create random point within confines of plane, this point is P (xyz)
            let rand_point = glMatrix.vec3.fromValues(this.minX + (this.maxX - this.minX) * Math.random(), this.minY + (this.maxY - this.minY) * Math.random(), 0);
            // Create random normal vector
            let temp = glMatrix.vec2.create(); 
            glMatrix.vec2.random(temp); // creates random x, y vector normalized
            let n = glMatrix.vec3.create();
            n[0] = temp[0];
            n[1] = temp[1];
            n[2] = 0;
            // Iterate through every point

            for (let point_number = 0; point_number < this.numVertices; point_number++) {
                // We get the point and its xyz coords
                let bpoint_coord = glMatrix.vec3.create();
                this.getVertex(bpoint_coord, point_number);

                // The vector bp is formed from point p to b
                let bp = glMatrix.vec3.create();
                bp[0] = bpoint_coord[0] - rand_point[0];
                bp[1] = bpoint_coord[1] - rand_point[1];
                // glMatrix.vec3.subtract(bp, bpoint_coord, rand_point);
                
                // Result of dot product we can check now which region point b is in
                let result = glMatrix.vec3.dot(bp, n);

                if (result >= 0) {
                    // positive half space
                    bpoint_coord[2] += delta;
                } else {
                    // negative half space
                    bpoint_coord[2] -= delta;
                }
                // console.log("ERROR"); //TODO: remove
                this.setVertex(bpoint_coord , point_number);
                
            }
            delta /= Math.pow(2,H);
        }
    }


    /**
     * This function does nothing.
     */
    calculateNormals() {
        // MP2: Implement this function!
        for (let i = 0; i < this.numFaces; i++) {
            let faceNormal = this.calculateFaceNormal(i);
            // Now we have our Face normal we have to add it to  our normal array collection
            // A collection of the face's vertex IDs in C.C.W order
            let vertIDs = glMatrix.vec3.fromValues(this.faceData[i*3], this.faceData[i*3 + 1], this.faceData[i*3 + 2]);

            this.normalData[3 * vertIDs[0]] += faceNormal[0];
            this.normalData[3 * vertIDs[0] + 1] += faceNormal[1];
            this.normalData[3 * vertIDs[0] + 2] += faceNormal[2];

            this.normalData[3 * vertIDs[1]] += faceNormal[0];
            this.normalData[3 * vertIDs[1] + 1] += faceNormal[1];
            this.normalData[3 * vertIDs[1]+ 2] += faceNormal[2];


            this.normalData[3 * vertIDs[2]] += faceNormal[0];
            this.normalData[3 * vertIDs[2] + 1] += faceNormal[1];
            this.normalData[3 * vertIDs[2] + 2] += faceNormal[2];

        }

       for (let i = 0; i < this.numVertices; i++) {
           let startOfVertex = 3 * i;
           let to_normalize = glMatrix.vec3.fromValues(this.normalData[startOfVertex], this.normalData[startOfVertex + 1], this.normalData[startOfVertex + 2]);

           glMatrix.vec3.normalize(to_normalize, to_normalize);

           this.normalData[startOfVertex] = to_normalize[0];
           this.normalData[startOfVertex + 1] = to_normalize[1];
           this.normalData[startOfVertex + 2] = to_normalize[2];

       }

    }


    calculateFaceNormal(faceNumber) {
            // Gives index of the first vertex ID for that face
            //  face idx = v
            // faceData = [0, 1, 3,  1, 4, 3]

            let faceIdx = faceNumber * 3;
            let v1 = glMatrix.vec3.create();
            this.getVertex(v1, this.faceData[faceIdx]);

            let v2 = glMatrix.vec3.create();
            this.getVertex(v2, this.faceData[faceIdx + 1]);

            let v3 = glMatrix.vec3.create();
            this.getVertex(v3, this.faceData[faceIdx + 2]);

            // a = n2 - n1      b = v3 - v1
            let a = glMatrix.vec3.create();
            glMatrix.vec3.subtract(a, v2, v1);

            let b = glMatrix.vec3.create();
            glMatrix.vec3.subtract(b, v3, v1);

            //The face normal x, y, z values (vec3)
            let faceNormal = glMatrix.vec3.create();
            glMatrix.vec3.cross(faceNormal, a, b);

            return faceNormal;
    }


    //-------------------------------------------------------------------------
    // Setup code (run once)
    /**
     * Generates line data from the faces in faceData for wireframe rendering.
     */
    generateLines() {
        for (var f = 0; f < this.faceData.length/3; f++) {
            // Calculate index of the face
            var fid = f*3;
            this.edgeData.push(this.faceData[fid]);
            this.edgeData.push(this.faceData[fid+1]);
            
            this.edgeData.push(this.faceData[fid+1]);
            this.edgeData.push(this.faceData[fid+2]);
            
            this.edgeData.push(this.faceData[fid+2]);
            this.edgeData.push(this.faceData[fid]);
        }
    }


    /**
     * Sets up the WebGL buffers and vertex array object.
     * @param {object} shaderProgram The shader program to link the buffers to.
     */
    setupBuffers(shaderProgram) {
        // Create and bind the vertex array object.
        this.vertexArrayObject = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayObject);

        // Create the position buffer and load it with the position data.
        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positionData),
                      gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexPositionBuffer.numItems, " vertices.");

        // Link the position buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexPosition,
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexPosition);
    
        // Specify normals to be able to do lighting calculations
        this.vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData),
                      gl.STATIC_DRAW);
        this.vertexNormalBuffer.itemSize = 3;
        this.vertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexNormalBuffer.numItems, " normals.");

        // Link the normal buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexNormal,
                               this.vertexNormalBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexNormal);
    
        // Set up the buffer of indices that tells WebGL which vertices are
        // part of which triangles.
        this.triangleIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.faceData),
                      gl.STATIC_DRAW);
        this.triangleIndexBuffer.itemSize = 1;
        this.triangleIndexBuffer.numItems = this.faceData.length;
        console.log("Loaded ", this.triangleIndexBuffer.numItems, " triangles.");
    
        // Set up the index buffer for drawing edges.
        this.edgeIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.edgeData),
                      gl.STATIC_DRAW);
        this.edgeIndexBuffer.itemSize = 1;
        this.edgeIndexBuffer.numItems = this.edgeData.length;
        
        // Unbind everything; we want to bind the correct element buffer and
        // VAO when we want to draw stuff
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    

    //-------------------------------------------------------------------------
    // Rendering functions (run every frame in draw())
    /**
     * Renders the terrain to the screen as triangles.
     */
    drawTriangles() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.triangleIndexBuffer.numItems,
                        gl.UNSIGNED_INT,0);
    }
    

    /**
     * Renders the terrain to the screen as edges, wireframe style.
     */
    drawEdges() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.drawElements(gl.LINES, this.edgeIndexBuffer.numItems,
                        gl.UNSIGNED_INT,0);   
    }


    //-------------------------------------------------------------------------
    // Debugging
    /**
     * Prints the contents of the buffers to the console for debugging.
     */
    printBuffers() {
        for (var i = 0; i < this.numVertices; i++) {
            console.log("v ", this.positionData[i*3], " ", 
                              this.positionData[i*3 + 1], " ",
                              this.positionData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numVertices; i++) {
            console.log("n ", this.normalData[i*3], " ", 
                              this.normalData[i*3 + 1], " ",
                              this.normalData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numFaces; i++) {
            console.log("f ", this.faceData[i*3], " ", 
                              this.faceData[i*3 + 1], " ",
                              this.faceData[i*3 + 2], " ");
        }  
    }

    getMaxElevation() {
        var maxZ = 0;
        for (var i = 0; i < this.numVertices; i++) {
            var z = glMatrix.vec3.create();
            this.getVertex(z, i);
            if (z[2] > maxZ) {
                maxZ = z[2];
            }
        }
        return maxZ;
    }

    getMinElevation() {
        var minZ = 0;
        for (var i = 0; i < this.numVertices; i++) {
            var z = glMatrix.vec3.create();
            this.getVertex(z, i);
            if (z[2] < minZ) {
                minZ = z[2];
            }
        }
        return minZ;
    }

} // class Terrain
