let timerEnable = true;
function onLoad() {
  startTimer();
  setTimeout(() => {
    if (timerEnable) {
      window.location.replace("https://melvynx.github.io/tools/#/");
    }
  }, 6000);
}

const timer = document.getElementById("timer");
let timerTime = 5;

function startTimer() {
  if (timerTime < 0) {
    return;
  }
  if (!timerEnable) {
    return;
  }
  setTimeout(() => {
    timer.innerHTML = timerTime;
    timerTime--;

    startTimer();
  }, 900);
}

function stopTimer() {
  timer.style.backgroundColor = "#e91e63";
  timer.style.color = "white";
  const stop = document.getElementById("buttonStop");
  stop.classList.remove("btn-danger");
  stop.classList.add("btn-success");
  stop.innerHTML = "It's stopped";
  timerEnable = false;
}

onLoad();
