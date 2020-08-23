var startButton = document.getElementById("startButton");
var stopButton = document.getElementById("stopButton");

var socket;

const video = document.querySelector("#videoElement");

video.width = 250;
video.height = 186;

var canvas = document.getElementById("canvasOutput");
var context = canvas.getContext("2d");

canvas.width = 250;
canvas.height = 186;

canvas.style.display = 'none';
video.style.display = 'none';

var image = document.getElementById("image");

image.width = 250;
image.height = 186;

var image2 = document.getElementById("image2");

image2.width = 250;
image2.height = 186;

var drawer;

let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
let cap = new cv.VideoCapture(video);

const FPS = 8;

var emitter;

var outputFManager;

var outputTManager;

var cals;

var occupant = false;

function videoLoop() {
    context.drawImage(video, 0, 0, video.width, video.height);
}

startButton.onclick = () => {
    startButton.disabled = true;
    $.get('occupy', function(occupied) {
        if (occupied=="True")
            occupant = true;
        else
            occupant = false;
        if (occupant) {
            socket = io('/');
            console.log('intermediary stage');
            socket.on('connect', function(){
                console.log("Connected...!", socket.connected);
            });
            socket.on('response_back', function(data){
                const arrayBufferView = new Uint8Array(data);
                const blob = new Blob([arrayBufferView], {type: 'image/jpeg'});
                const imageUrl = URL.createObjectURL(blob);
                document.getElementById('image').src = imageUrl;
            });
            if (navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    video.srcObject = stream;
                    video.addEventListener('loadeddata', function() {
                        video.play();
                        drawer = setInterval(videoLoop, 1000 / 30);
                    });
                    video.play();
                })
                .catch(function (error) {
                    console.log(err0r)
                    console.log("Something went wrong!");
                });
            }
            emitter = setInterval(() => {
                cap.read(src);
                var type = "image/jpeg"
                var url = canvas.toDataURL(type);
                fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    if (socket!=null) {
                        socket.emit('image', blob);
                    }
                })
            }, 1000/FPS);
            outputFManager = setInterval(() => {
                $.get('updateFrame', function(data) {
                    try {
                        if (data!="None") {
                            print(data)
                            document.getElementById('image2').src = 'data:image/jpeg;base64,'+data;
                        }
                    }
                    catch (err) {}
                })
            }, 1000/FPS);
            cals = 0;
            outputTManager = setInterval(() => {
                $.get('setPredictions', function(dict) {
                    try {
                        data = dict['predictions'];
                        if (data!="None") {
                            cals += 1;
                            text = cals+".";
                            for (var i = 0; i < data.length; i++) {
                              text += data[i] + ", ";
                            }
                            text += "<br>";
                            console.log(text)
                            document.getElementById('predictions').innerHTML += text;
                        }
                    }
                    catch (err) {}
                })
            }, 500);
        }
        else {
            //add message to endpoint in the future
            console.log("gpu currently occupied by other user's request")
        }
    })
    stopButton.disabled = false;
}

stopButton.onclick = () => {
    stopButton.disabled = true;
    if (occupant) {
        occupant = false;
        $.get('unoccupy');
        if (socket!=null) {
            socket.on('disconnect', function(){
                console.log("Disconnected...", socket.disconnected);
            });
            socket.disconnect();
        }
        if (drawer!=null)
            clearInterval(drawer);
        if (emitter!=null)
            clearInterval(emitter);
        if (outputFManager!=null)
            clearInterval(outputFManager);
        if (outputTManager!=null)
            clearInterval(outputTManager);
    }
    startButton.disabled = false;
}