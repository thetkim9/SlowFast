if (document.getElementById("webcam0")!=null) {
    let preview = document.getElementById("preview");
    let recording = document.getElementById("preload");
    let startButton = document.getElementById("startButton");
    let stopButton = document.getElementById("stopButton");
    let logElement = document.getElementById("log");


    function log(msg) {
        //logElement.innerHTML += msg + "\n";
    }

    function wait(delayInMS) {
        return new Promise(resolve => setTimeout(resolve, delayInMS));
    }
    var recorder;
    var data;
    function startRecording(stream) {
        recorder = new MediaRecorder(stream);
        data = [];

        recorder.ondataavailable = event => data.push(event.data);
        recorder.start();
    }

    function stop(stream) {
        stream.getTracks().forEach(track => track.stop());
        let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = event => reject(event.name);
        });

        let recorded = wait(0).then(
        () => recorder.state == "recording" && recorder.stop()
        );

        return Promise.all([
            stopped,
            recorded
        ])
        .then(() => data);
        return data;
    }

    startButton.addEventListener("click", function() {
        document.getElementById('submit').disabled = true;
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {
                preview.srcObject = stream;
                preview.captureStream = preview.captureStream || preview.mozCaptureStream;
                return new Promise(resolve => preview.onplaying = resolve);
              }).then(() => startRecording(preview.captureStream()))
              .catch(log);
    }, false);

    stopButton.addEventListener("click", function() {
        stop(preview.srcObject)
        .then (recordedChunks => {
                let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
                recording.src = URL.createObjectURL(recordedBlob);
                var file = new File([recordedBlob], "webcam.mp4");
                let list = new DataTransfer();
                list.items.add(file);
                let myFileList = list.files;
                document.getElementById('source').files = myFileList;
                log("Successfully recorded " + recordedBlob.size + " bytes of " +
                    recordedBlob.type + " media.");
              }).catch(log);
              document.getElementById('submit').disabled = false;
    }, false);
}