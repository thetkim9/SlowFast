FROM pytorch/pytorch:1.5.1-cuda10.1-cudnn7-devel
ENV LANG C.UTF-8
RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get -y install wget
RUN conda install pytorch==1.2.0 torchvision==0.4.0 cudatoolkit=9.2 -c pytorch
RUN conda install -c anaconda 'git+https://github.com/facebookresearch/fvcore'
RUN conda install -c anaconda 'git+https://github.com/facebookresearch/fvcore.git'
RUN conda install -c anaconda 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI'
RUN git clone https://github.com/facebookresearch/detectron2 detectron2_repo
RUN conda install -e detectron2_repo
RUN conda install -c anaconda simplejson
RUN conda install av -c conda-forge
RUN conda install -c anaconda psutil
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
RUN apt -y install git
RUN conda install -c anaconda cython
COPY . .
export PYTHONPATH=./slowfast:$PYTHONPATH
python setup.py build develop
EXPOSE 80
CMD python tools/run_net.py --cfg configs/Kinetics/C2D_8x8_R50.yaml
#CMD python server.py