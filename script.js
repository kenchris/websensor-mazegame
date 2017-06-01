var output = document.querySelector('.output');
var dataArray = [];     //array to store multiple dataObjects (one dataObject for each button press)
var dataObject = {button:null, acceleration:null, accelerationnog:null, orientation:null, rotation:null, frequency:null};    //single reading of all the sensor data, each object a list of values obtained during button press

//below are variables for storing data for single button press
var accelerationData = [];      //list of all acceleration data
var accelerationnogData = [];   //list of acceleration data without gravity
var orientationData = [];
var orientationMat = new Float64Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);     //device orientation
var orientationMatTemp = null;       //temp variable for storing orientation matrix
var rotationData = [];

var sensors = {};
var currentButton = null;
var accel = {x:null, y:null, z:null};
var accelNoG;
var velGyro;
var recording = true;  //are we recording data or not?
var sensorfreq = 60;     //for setting desired sensor frequency
var nosensors = false;  //for testing with fake values and without sensors
var sensors_started = false;

//var textUpdate = setInterval(update_text, 1000/sensorfreq);
var moveUpdate = setInterval(move, 1000/sensorfreq);

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
startSensors();
return requestAnimationFrame(draw);
}

//Use gravity sensor to control (positive x down, negative x up)

function doKeyDown(evt){
switch (evt.keyCode) {
case 38:  /* Up arrow was pressed */
if (y - dy > 0){
y -= dy;
clear();
checkcollision();
if (collision == 1){
y += dy;
collision = 0;
}
}
break;
case 40:  /* Down arrow was pressed */
if (y + dy < HEIGHT ){
y += dy;
clear();
checkcollision();
if (collision == 1){
y -= dy;
collision = 0;
}
}
break;
case 37:  /* Left arrow was pressed */
if (x - dx > 0){
x -= dx;
clear();
checkcollision();
if (collision == 1){
x += dx;
collision = 0;
}
}
break;
case 39:  /* Right arrow was pressed */
if ((x + dx < WIDTH)){
x += dx;
clear();
checkcollision();
if (collision == 1){
x -= dx;
collision = 0;
}
}
break;
}
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
window.addEventListener('keydown',doKeyDown,true);

function exportData() //https://stackoverflow.com/a/13405322
{
        var exportData = JSON.stringify(dataArray);
        window.open('data:text/csv;charset=utf-8,' + escape(exportData));
}

function change_frequency()     //for changing sensor frequency
{
        let newfreq = Number(prompt("New sensor frequency"));
        if (!(isNaN(newfreq)))
        {
                sensorfreq = Number(newfreq);
                stop_sensors();
                sensors = startSensors();
                if(sensors_started)
                {
                        return true;
                }
                else
                {
                        return false;
                }
        }
        else
        {
                return false;
        }
}

function magnitude(vector)      //Calculate the magnitude of a vector
{
return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

function update_text()
{
        if(velGyro)
        {
                        //document.getElementById("accl").textContent = `Acceleration ${accel.x.toFixed(3)}, ${accel.y.toFixed(3)}, ${accel.z.toFixed(3)} Magnitude: ${magnitude(accel).toFixed(3)}`;
                        //document.getElementById("accl_nog").textContent = `Acceleration without gravity ${accelNoG.x.toFixed(3)}, ${accelNoG.y.toFixed(3)}, ${accelNoG.z.toFixed(3)} Magnitude: ${magnitude(accelNoG).toFixed(3)}`;
                        document.getElementById("g_accl").textContent = `Isolated gravity ${gravity.x.toFixed(3)}, ${gravity.y.toFixed(3)}, ${gravity.z.toFixed(3)} Magnitude: (${magnitude(gravity).toFixed(3)}))`;
                        //document.getElementById("ori").textContent = `Orientation matrix ${orientationMat[0]} ${orientationMat[1]} ${orientationMat[2]} ${orientationMat[3]} \n ${orientationMat[4]} ${orientationMat[5]} ${orientationMat[6]} ...`;
                        //document.getElementById("rrate").textContent = `Rotation rate (${velGyro.x.toFixed(3)}, ${velGyro.y.toFixed(3)}, ${velGyro.z.toFixed(3)} Magnitude: ${magnitude(velGyro).toFixed(3)}`;
                        document.getElementById("sensorfreq").textContent = `Sensor frequency ${sensorfreq}`;
        }
}

function move()        //Moves the ball
{
        //Simulate friction
        dx = dx/1.02
        dy = dy/1.02
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

function stop_sensors()
{
        sensors.Accelerometer.stop();
        sensors.AbsoluteOrientationSensor.stop();     //don't stop due to the delay in starting up
        sensors.Gyroscope.stop();
}

function startSensors() {
        if(!(nosensors))
        {
                try {
                //Right now we only want to use gravity sensor (low-pass filtered daccelerometer data)
                //Accelerometer including gravity
                accelerometer = new Accelerometer({ frequency: sensorfreq, includeGravity: true });
                //accelerometer = new GravitySensor({frequency: sensorfreq})
                sensors.Accelerometer = accelerometer;
                gravity =  new LowPassFilterData(accelerometer, 0.5);   //need to find good bias value
                accelerometer.onchange = event => {
                        accel = {x:accelerometer.x, y:accelerometer.y, z:accelerometer.z};
                        gravity.update(accel);
                        accelNoG = {x:accel.x - gravity.x, y:accel.y - gravity.y, z:accel.z - gravity.z};
                        //remove noise
                        if(Math.abs(accelNoG.x > 0.1))
                        {
                                dx = -gravity['x']/2;
                        }     
                        if(Math.abs(accelNoG.y > 0.1))
                        {              
                                dy = gravity['y']/2;
                        }
                        console.log(dx, dy, x, y)
                }
                accelerometer.onerror = err => {
                  accelerometer = null;
                  console.log(`Accelerometer ${err.error}`)
                }
                accelerometer.start();
                /*
                //AbsoluteOrientationSensor
                absoluteorientationsensor = new AbsoluteOrientationSensor({ frequency: sensorfreq});
                sensors.AbsoluteOrientationSensor = absoluteorientationsensor;
                absoluteorientationsensor.onchange = event => {
                        absoluteorientationsensor.populateMatrix(orientationMat);
                }
                absoluteorientationsensor.onerror = err => {
                  absoluteorientationsensor = null;
                  console.log(`Absolute orientation sensor ${err.error}`)
                };
                absoluteorientationsensor.start();
                //Gyroscope
                gyroscope = new Gyroscope({ frequency: sensorfreq});
                sensors.Gyroscope = gyroscope;
                gyroscope.onchange = event => {
                        velGyro = {x:gyroscope.x, y:gyroscope.y, z:gyroscope.z};
                }
                gyroscope.onerror = err => {
                  gyroscope = null;
                  console.log(`Gyroscope ${err.error}`)
                };
                gyroscope.start();
                */
                } catch(err) { console.log(err); }
                sensors_started = true;
                return sensors;
        }
        else
        {
                return null;    //here do something in order to be able to use on desktop with fake data...
        }
}

function read_sensors()
{
        if (recording)
        {     
                console.log("Saving data from sensors");
                accelerationData.push(accel);
                accelerationnogData.push(accelNoG);
                rotationData.push(velGyro);
                orientationMatTemp = new Object;     //need to push orientation matrix by value
                Object.assign(orientationMatTemp, orientationMat);
                orientationData.push(orientationMatTemp);
                orientationMatTemp = null;
        }
}

//TODO: Send data to a server to be processed
function send_data()    //https://stackoverflow.com/a/24468752
{
// Sending and receiving data in JSON format using POST method
//
var xhr = new XMLHttpRequest();
var url = "url";
xhr.open("POST", url, true);
xhr.setRequestHeader("Content-type", "application/json");
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        var json = JSON.parse(xhr.responseText);
        console.log(json.str1 + ", " + json.str2);
    }
};
var data = JSON.stringify({"str1": "foo", "str2": "bar"});
//var data = JSON.stringify(localStorage.getItem(key));
xhr.send(data);
}
