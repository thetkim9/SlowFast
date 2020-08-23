from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import cv2
import time
from PIL import Image
import io
import numpy
from engineio.payload import Payload
from slowfast.utils.parser import load_config, parse_args
import threading
import sys
sys.path.append('./tools')
from demo_net import *

Payload.max_decode_packets = 50

app = Flask(__name__, static_url_path="", template_folder="./")
app.config['SECRET_KEY'] = 'taesu'
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

occupied = False

frames_in = []
frames_out = []

thread = None

class thread_with_trace(threading.Thread):
    def __init__(self, *args, **keywords):
        threading.Thread.__init__(self, *args, **keywords)
        self.killed = False

    def start(self):
        self.__run_backup = self.run
        self.run = self.__run
        threading.Thread.start(self)

    def __run(self):
        sys.settrace(self.globaltrace)
        self.__run_backup()
        self.run = self.__run_backup

    def globaltrace(self, frame, event, arg):
        if event == 'call':
            return self.localtrace
        else:
            return None

    def localtrace(self, frame, event, arg):
        if self.killed:
            if event == 'line':
                raise SystemExit()
        return self.localtrace

    def kill(self):
        self.killed = True

# Do ml-processing with the frame inside of a thread running in the background (frames_in, frames_out)
def ml_processing():
    print("start")
    start = time.time()
    count = 0
    for frame in demo(cfg):
        count += 1
    print(count)
    print(time.time() - start)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/occupy')
def occupy():
    global thread
    thread = thread_with_trace(target=ml_processing)
    thread.start()
    global occupied
    if not occupied:
        occupied = (True)
        return (True)
    return (False)


@app.route('/unoccupy')
def unoccupy():
    if thread is not None and thread.is_alive():
        thread.kill()
    global frames_in
    global frames_out
    frames_in = []
    frames_out = []
    global occupied
    occupied = (False)
    return (False)

@socketio.on('image')
def image(data_image):
    # decode and convert into image
    b = io.BytesIO(data_image)
    pil_image = Image.open(b).convert('RGB')
    open_cv_image = numpy.array(pil_image)

    # Convert RGB to BGR and flip
    frame = open_cv_image[:, :, ::-1].copy()
    frame = cv2.flip(frame, 1)

    #put frame that should be processed
    frames_in.append(frame)

    '''
    #pull frame that has been processed
    while len(frames_out) == 0:
        time.sleep(0.01)
    frame = frames_out.pop(0)
    '''

    #encoding for emission
    buff = cv2.imencode('.jpeg', frame)[1]
    response = io.BytesIO(buff).getvalue()

    #emit response to client
    emit('response_back', response)

@app.route('/healthz')
def health():
  return "healthy", 200


if __name__ == '__main__':
    print("main app.py")
    args = parse_args()
    cfg = load_config(args)
    # cfg.DEMO.WEBCAM = 0
    cfg.DEMO.WEBCAM = -1
    cfg.DEMO.INPUT_VIDEO = "demo_test/demo_in2.mp4"
    cfg.NUM_GPUS = 1
    cfg.TRAIN.ENABLE = False
    cfg.TEST.ENABLE = False
    cfg.DEMO.OUTPUT_FILE = "demo_test/demo_out2.mp4"
    cfg.DEMO.ENABLE = True
    initialize(cfg)
    socketio.run(app, host='0.0.0.0')