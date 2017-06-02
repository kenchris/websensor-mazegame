var sensors = {};
var gravity = {x:null, y:null, z:null};
var accel = {x:null, y:null, z:null};
var prevaccel = {x:null, y:null, z:null}        //used for detecting shaking motion
var diff = {x:null, y:null, z:null}        //used for detecting shaking motion
var shakingvar = 1;        //used for detecting shaking motion
var sensorfreq = 60;     //for setting desired sensor frequency
var movefreq = 1000;    //how many times a second the ball moves, TODO: affects the speed of the ball, even though probably should not
var sensors_started = false;
var moveUpdate;

class LowPassFilterData {       //https://w3c.github.io/motion-sensors/#pass-filters
  constructor(reading, bias) {
    Object.assign(this, { x: reading.x, y: reading.y, z: reading.z });
    this.bias = bias;
  }
        update(reading) {
                this.x = this.x * this.bias + reading.x * (1 - this.bias);
                this.y = this.y * this.bias + reading.y * (1 - this.bias);
                this.z = this.z * this.bias + reading.z * (1 - this.bias);
        }
};

function magnitude(vector)      //Calculate the magnitude of a vector
{
return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

screen.orientation.lock('portrait');

var canvas;
var ctx;
var dx = 0;
var dy = 0;
//starting position
var x = 570;
var y = 360;
//canvas size
var WIDTH = 800;
var HEIGHT = 800;
var img = new Image();
var collision = 0;

function rect(x,y,w,h) {
ctx.beginPath();
ctx.rect(x,y,w,h);
ctx.closePath();
ctx.fill();
}
function clear() {
ctx.clearRect(0, 0, WIDTH, HEIGHT);
ctx.drawImage(img, 0, 0);
}
function init() {
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
img.src = "maze2.gif";
startSensors();
moveUpdate = setInterval(move, 1000/movefreq);
return requestAnimationFrame(draw);
}

function checkcollision() {
var imgd = ctx.getImageData(x, y, 15, 15);
var pix = imgd.data;
for (var i = 0; n = pix.length, i < n; i += 4) {
if (pix[i] == 0) {
collision = 1;
}
}
}
function draw() {
clear();
ctx.fillStyle = "purple";
rect(x, y, 15,15);
requestAnimationFrame(draw);
}
init();

function move()        //Moves the ball
{
        //console.log(magnitude(diff));
        console.log(shakingvar);
        if(magnitude(diff) > 1)
        {
                console.log("Shaking");
                shakingvar = shakingvar + 1;
        }
        else
        {
                console.log("Not shaking");
                shakingvar = shakingvar - 1;
        }
        //filter noise
        if(Math.abs(gravity.x) > 0.1)
        {    
                        dx = -0.5 * gravity['x'];
        }     
        if(Math.abs(gravity.y) > 0.1)
        {            
                        dy = 0.5 * gravity['y'];                      
        }
        if(shakingvar >= 10)    //shake event
        {
                console.log("SHAKE");
                shakingvar = 0;
        }
        //console.log(dx, dy, x, y)
        //Simulate friction
        dx = dx/1.01
        dy = dy/1.01
        //y axis
        if(y + dy < HEIGHT && y + dy > 0)
        {
                y += dy;
                clear();
                checkcollision();
                if (collision == 1){
                        y -= dy;
                        collision = 0;
                }
        }
                x += dx;
                clear();
                checkcollision();
                if (collision == 1){
                        x -= dx;
                        collision = 0;
                }
}

function startSensors() {
                try {
                //Right now we only want to use gravity sensor (low-pass filtered daccelerometer data)
                //Accelerometer including gravity
                accelerometer = new Accelerometer({ frequency: sensorfreq, includeGravity: true });
                //accelerometer = new GravitySensor({frequency: sensorfreq})
                sensors.Accelerometer = accelerometer;
                gravity =  new LowPassFilterData(accelerometer, 0.8);   //need to find good bias value
                accelerometer.onchange = event => {
                        prevaccel = accel;
                        accel = {x:accelerometer.x, y:accelerometer.y, z:accelerometer.z};
                        for (var key in accel)
                                {
                                        diff[key] = accel[key] - prevaccel[key];
                                }
                        gravity.update(accel);
                }
                accelerometer.onerror = err => {
                  accelerometer = null;
                  console.log(`Accelerometer ${err.error}`)
                }
                accelerometer.start();
                } catch(err) { console.log(err); }
                sensors_started = true;
                return sensors;
}
