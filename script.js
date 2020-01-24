function onLoad() {
  startTimer();
  setTimeout(() => {
    window.location.replace("https://melvynx.github.io/tools/#/");
  }, 6000);
}

const timer = document.getElementById("timer");
let timerTime = 5;

function startTimer() {
  if (timerTime < 0) {
    return;
  }
  setTimeout(() => {
    timer.innerHTML = timerTime;
    timerTime--;
    startTimer();
  }, 900);
}

onLoad();
