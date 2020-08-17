var controller;
document.body.onload = function() {
    document.getElementById("cancel").disabled = true;
    document.getElementById("load").style.visibility = "hidden";
}
window.onbeforeunload = function() {
    if (timer!=null) {
        clearInterval(timer);
    }
    if (timer2!=null) {
        clearInterval(timer2);
    }
    if (controller!=null) {
        controller.abort();
    }
    if (user_id!=null) {
        $.get('remove/' + user_id);
    }
    return "Do you really want to leave this page?";
}
var timer;
var timer2;
function check_progress(task_id, progress_bar) {
    document.getElementById("load").style.visibility = "visible";
    var progress_bar = document.getElementById("progress_bar");
    var pending = document.getElementById("pending");
    var dots = document.getElementById("dots");
    var time_spent = document.getElementById("time");
    var temp = [".", "..", "..."];
    var time = 0;
    var stopPending;
    function worker() {
      $.get('progress/' + task_id, function(progress) {
          progress_bar.value = Math.min(parseInt(progress), 100).toString();
          stopPending = progress;
          time += 1;
          time_spent.innerHTML = time;
          dots.innerHTML = temp[time%3];
          if (parseInt(progress)>=100) {
            dots.innerHTML = " complete";
            clearInterval(timer);
            timer = null;
          }
      })
    }
    timer = setInterval(worker, 1000);
    function worker2() {
      $.get('pending/' + task_id, function(order) {
          pending.innerHTML = order;
          if (timer==null) {
            clearInterval(timer2);
            timer2 = null;
          }
      })
    }
    timer2 = setInterval(worker2, 3000);
}

document.getElementById("cancel").onclick = () => {
    if (timer!=null) {
        clearInterval(timer);
    }
    if (timer2!=null) {
        clearInterval(timer2);
    }
    if (controller!=null) {
        controller.abort();
    }
    if (user_id!=null) {
        $.get('remove/' + user_id);
        console.log("abort");
    }
    //document.getElementById("cancel").style.visibility = "hidden";
    document.getElementById("cancel").disabled = true;
    //document.getElementById('submit').style.visibility = "visible";
    document.getElementById("submit").disabled = false;
}

document.getElementById("submit").onclick = () => {
    document.getElementById("errorbox").innerHTML = "";
    document.getElementById("result").src = "";
    var formData = new FormData();
    var source = document.getElementById('source').files[0];
    var submit = document.getElementById('submit');
    //submit.style.visibility = "hidden";
    document.getElementById("submit").disabled = true;
    //const { v4: uuidv4 } = require('uuid');
    //var user_id = uuidv4();
    user_id = Math.floor(Math.random()*1000000000);
    var progress_bar = document.getElementById('progress_bar');
    formData.append('action_video', source);
    //formData.append('user_id', user_id);
    $.get('setup/' + user_id);
    check_progress(user_id, progress_bar);
    controller = new AbortController();
    var abort = controller.signal;
    //document.getElementById("cancel").style.visibility = "visible";
    document.getElementById("cancel").disabled = false;
    fetch(
        '/tpn/'+user_id,
        {
            method: 'POST',
            body: formData,
            signal: abort
        }
    )
    .then(response => {
        if ( response.status == 200){
            return response;
        }
        else{
            throw Error("rendering error:");
        }
    })
    .then(response => {return response.json();})
    .then(data => {
        document.getElementById("result").innerHTML = data.result[0] + "<br>" + data.result[1] + "<br>" + data.result[2];
        $.get('remove/' + user_id);
        //document.getElementById("cancel").style.visibility = "hidden";
        document.getElementById("cancel").disabled = true;
        //submit.style.visibility = "visible";
        document.getElementById("submit").disabled = false;
    })
    .catch(e =>{
        document.getElementById("errorbox").innerHTML = e;
        $.get('remove/' + user_id);
        //document.getElementById("cancel").style.visibility = "hidden";
        document.getElementById("cancel").disabled = true;
        //submit.style.visibility = "visible";
        document.getElementById("submit").disabled = false;
    })
}
