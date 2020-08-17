from flask import Flask, render_template, request, send_file, make_response, jsonify
import shutil
import os
import sys
import threading
import argparse
from test_video import Model

progressRates = {}
threads = []
results = {}


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

def run_model(user_id):
    # options
    parser = argparse.ArgumentParser(description="test TPN on a single video")
    parser.add_argument('--video_file', type=str, default='input/'+str(user_id)+'.mp4')
    parser.add_argument('--frame_folder', type=str, default=None)
    args = parser.parse_args()
    results[user_id] = model.predict(args)

app = Flask(__name__, static_url_path="", template_folder="./")

@app.route("/")
def index():
    return render_template('index.html')

@app.route('/tpn/<int:user_id>', methods=['GET', 'POST'])
def tpn(user_id):
  if request.method != "POST":
    return

  global threads
  if len(threads)>3:
      return {'error': 'too many requests'}, 429

  print(request.files)

  if not request.files.get('action_video'):
    return {'error': 'video not found'}, 400

  global progressRates
  try:
    print("hi1", user_id)
    #save video
    action_video = request.files.get('action_video')
    with open("input/"+str(user_id)+".mp4", 'wb') as f:
        f.write(action_video.read())
  except Exception as e:
    return {'error': str(e)}, 400

  progressRates[user_id] = 10

  try:
    t1 = thread_with_trace(target=run_model, args=[user_id])
    t1.user_id = user_id
    threads.append(t1)
    while threads[0].user_id!=user_id:
        if threads[0].is_alive():
            threads[0].join()
    progressRates[user_id] = 30
    threads[0].start()
    threads[0].join(timeout=30)
    if threads[0].is_alive():
        threads[0].kill()
    print(threads.pop(0))
    print(user_id, "GPU task complete~~~~~~~~~~~~~~~~~")

  except Exception as e:
    return {'error': str(e)}, 400

  try:
    print("hi5", user_id)
    progressRates[user_id] = 90
    data = {'result': results[user_id]}
    return jsonify(data)

  except Exception as e:
    return {'error': str(e)}, 400

@app.route('/setup/<int:user_id>')
def setup(user_id):
    global progressRates
    progressRates[user_id] = 0
    return "0"

@app.route('/progress/<int:user_id>')
def progress(user_id):
    global progressRates
    return str(progressRates.get(user_id, 100))

@app.route('/remove/<int:user_id>')
def remove(user_id):
    try:
        for i in range(len(threads)):
            if threads[i].user_id == user_id and threads[i].is_alive():
                threads[i].kill()
                break
        os.remove("input/"+str(user_id)+".mp4")
    except:
        pass
    progressRates.pop(user_id, None)
    results.pop(user_id, None)
    return "0"

@app.route('/pending/<int:user_id>')
def pending(user_id):
    global threads
    for i in range(len(threads)):
        if threads[i].user_id == user_id:
            return str(i)
    if progressRates.get(user_id, 100) == 100:
        return "0"
    else:
        return str(len(threads))

@app.errorhandler(413)
def request_entity_too_large(error):
  return {'error': 'File Too Large'}, 413

@app.route('/healthz')
def health():
  return "healthy", 200

if __name__ == '__main__':
    path = os.path.join(".", "input")
    os.mkdir(path)

    global model
    model = Model()

    app.run(debug=False, port=80, host='0.0.0.0', threaded=True)