FROM pytorch/pytorch:1.5.1-cuda10.1-cudnn7-devel
ENV LANG C.UTF-8
RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get -y install wget
RUN conda install pytorch torchvision cudatoolkit=9.2 -c pytorch
RUN conda install -c anaconda flask
RUN conda install -c anaconda "Pillow<7"
RUN conda install -c anaconda requests
RUN apt-get -y install curl gnupg locales unzip
RUN conda install -c menpo opencv
RUN conda install scikit-image matplotlib pyyaml
RUN conda install -c conda-forge tensorboardx
RUN conda install -c conda-forge moviepy
RUN export PATH=/usr/local/cuda/bin:$PATH
RUN export CPATH=/usr/local/cuda/include:$CPATH
RUN export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH
RUN conda install gxx_linux-64=7.3
RUN conda install -c anaconda cython
RUN conda install git pip
RUN pip install 'git+https://github.com/facebookresearch/fvcore'
RUN pip install 'git+https://github.com/facebookresearch/fvcore.git'
RUN pip install 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI'
RUN pip install simplejson
RUN conda install av -c conda-forge
RUN pip install psutil
RUN conda install -c anaconda numpy
RUN python -m pip install 'git+https://github.com/facebookresearch/detectron2.git'
COPY setup.py .
RUN python setup.py build develop
RUN wget https://research.google.com/ava/download/ava_train_v2.1.csv
RUN wget https://research.google.com/ava/download/ava_val_v2.1.csv
RUN wget https://research.google.com/ava/download/ava_action_list_v2.1_for_activitynet_2018.pbtxt
RUN wget https://research.google.com/ava/download/ava_train_excluded_timestamps_v2.1.csv
RUN wget https://research.google.com/ava/download/ava_val_excluded_timestamps_v2.1.csv
RUN wget https://dl.fbaipublicfiles.com/video-long-term-feature-banks/data/ava/annotations/ava_test_predicted_boxes.csv
RUN wget https://dl.fbaipublicfiles.com/video-long-term-feature-banks/data/ava/annotations/ava_val_predicted_boxes.csv
RUN wget https://dl.fbaipublicfiles.com/video-long-term-feature-banks/data/ava/annotations/ava_train_predicted_boxes.csv
#RUN wget https://dl.fbaipublicfiles.com/pyslowfast/model_zoo/ava/pretrain/SLOWFAST_64x2_R101_50_50.pkl
RUN wget https://dl.fbaipublicfiles.com/pyslowfast/model_zoo/ava/SLOWFAST_64x2_R101_50_50.pkl
COPY . .
RUN export PYTHONPATH=./slowfast:$PYTHONPATH
EXPOSE 80
CMD python tools/run_net.py --cfg demo/AVA/SLOWFAST_32x2_R101_50_50.yaml
#CMD python server.py
