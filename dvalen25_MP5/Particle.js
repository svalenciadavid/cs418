// Physics 7:52 [0,1]
// var drag = 0.2;
var m = 3;

class Particle {
    /**
     * @param {glMatrix.vec3} position
     * @param {number} radius 
     * @param {glMatrix.vec3} velocity 
     * @param {glMatrix.vec3} color 
     */
    constructor(position, radius, velocity, color) {
        this.radius = radius; //radius
        this.position = position;
        this.velocity = velocity;
        this.color = color;
        //NO NEED FOR MASS
        this.done = false;
    }

    //https://classtranscribe.illinois.edu/video?id=4800e988-4f5d-4559-a3bc-beae3f3cfd3d
    update(time, drag, acceleration) {
        if (this.done == false) {
            this.updateVelocity(time, drag, acceleration);
            this.updateLocation(time);   
        } else {
            this.velocity = glMatrix.vec3.fromValues(0, 0, 0);
        }
        
    }   

    //TODO: change acceleration?
    // V_new = V*d^t + a*t //Time is our step?
    updateVelocity(time, drag, acce) {
        let acceleration = glMatrix.vec3.clone(acce);
        
        glMatrix.vec3.scale(this.velocity, this.velocity, Math.pow(drag, time));
        glMatrix.vec3.scale(acceleration, acceleration, time);
        glMatrix.vec3.add(this.velocity, this.velocity, acceleration);
    }


    //p_new = p_old + v*t
    updateLocation(time) {
        let change = glMatrix.vec3.create();
        glMatrix.vec3.scale(change, this.velocity, time);

        let newPos = glMatrix.vec3.create();
        glMatrix.vec3.add(newPos, this.position, change);
        
        // !COLLISION
        let soonestTime = Infinity;
        let wall = glMatrix.vec3.create(); // Wall collided with
        // P += r >= m
        for (let i = 0; i < glMatrix.vec3.length(this.position); i++) {
            let coord = this.position[i];
            let vel = this.velocity[i];
            // LEFT, DOWN
            if (newPos[i] - this.radius <= -m) {
                let t = ((-m + this.radius) - coord) / vel;
                // Update t if it is the soonest
                if (soonestTime > t) {
                    soonestTime = t;
                }

                if (i == 0) {
                    // x right
                    wall = glMatrix.vec3.fromValues(-1, 0, 0);
                } else if (i == 1) {
                    wall = glMatrix.vec3.fromValues(0, -1, 0);
                    // this.velocity = glMatrix.vec3.fromValues(0, 0, 0);
                    // this.position = glMatrix.vec3.fromValues(0, 0, 0);
                } else if (i == 2) {
                    wall = glMatrix.vec3.fromValues(0, 0, -1);
                }
            }
            
            // RIGHT, UP
            if (newPos[i] + this.radius >= m) {
                let t = ((m - this.radius) - coord) / vel;
                // Update t if it is the soonest
                if (soonestTime > t) {
                    soonestTime = t;
                }

                if (i == 0) {
                    // x right
                    wall = glMatrix.vec3.fromValues(1, 0, 0);
                } else if (i == 1) {
                    // y up
                    wall = glMatrix.vec3.fromValues(0, 1, 0);
                } else if (i == 2) {
                    // z out
                    wall = glMatrix.vec3.fromValues(0, 0, 1);
                }
            }
        }
        //! Update location
        this.position = newPos;

        //! Change velocity depending on collision
        // vnew = v - 2(v * normal)*n
        if (soonestTime != Infinity) {
            // if there was a collision
            let factor = 2*glMatrix.vec3.dot(this.velocity, wall);
            glMatrix.vec3.scale(wall, wall, factor);
            glMatrix.vec3.subtract(this.velocity, this.velocity, wall);
            // * New
            let bounce = 0.8;
            glMatrix.vec3.scale(this.velocity, this.velocity, 0.8);

            // CLAMP
            if((wall % 2 == 1) && (Math.floor(wall / 2) == 1) && glMatrix.vec3.length(this.velocity) <=  1) {
                this.velocity = glMatrix.vec3.fromValues(0, 0, 0);
                this.done = true;
            }

        }

    }
    


    findCollision(time) {

    }

    getColor() {
        return this.color;
    }

    getPosition() {
        return this.position;
    }

    getVelocity() {
        return this.velocity;
    }

    getRadius() {
        return this.radius;
    }

}
