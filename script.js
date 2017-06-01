var sensors = {};
var accel = {x:null, y:null, z:null};
var accelNoG;
var sensorfreq = 30;     //for setting desired sensor frequency
var sensors_started = false;


var moveUpdate = setInterval(move, 1);

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

var canvas;
var ctx;
var dx = 0;
var dy = 0;
var x = 570;
var y = 360;
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
screen.orientation.lock('portrait');
startSensors();
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
        //remove noise
        if(Math.abs(gravity.x) > 0.1)
        {    
                        dx = -0.5 * gravity['x'];
        }     
        if(Math.abs(gravity.y) > 0.1)
        {            
                        dy = 0.5 * gravity['y'];                      
        }
        console.log(dx, dy, x, y)
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
                        accel = {x:accelerometer.x, y:accelerometer.y, z:accelerometer.z};
                        gravity.update(accel);
                        accelNoG = {x:accel.x - gravity.x, y:accel.y - gravity.y, z:accel.z - gravity.z};
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
