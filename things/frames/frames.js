window.fp_ms = 60 / 1e3;
window.t1 = 0;
window.t2 = 0;
window.turn = 1;
window.doit = function(n, w, o) {
  var t, i;
  window["t" + [window.turn]] = Date.now();
  window.turn += 1;
  if (window.turn === 3) {
    i = window.t2 - window.t1;
    t = Math.floor(i * window.fp_ms);
    console.log("frames: " + t);
    return window.turn = 1
  } else {
    return window.turn = 2
  }
};
window.startItUp = function() {
  return document.addEventListener("keypress", window.doit)
};
