window.maxWidth = 1280;
window.maxHeight = 800;

// Sometimes it's fun to hack and slash and create from a place of raw mania
nextNum = function(min, max) {
  if (min == max) { return min; }
  var s = window.seed;
  var c = window.currentPos;

  var neededDigits = (max - min).toString().length;
  var result = s.substr(c, neededDigits);
  var randomOffsetAtReset = 0;
  var howManyMoreWeNeeded = 0;

  if (result.length < neededDigits) {
    // Oops, we hit the end of the string. Go back to 0 and grab some more
    howManyMoreWeNeed = neededDigits - result.length;
    result += s.substr(0, howManyMoreWeNeed);
  }

  window.currentPos = (window.currentPos + neededDigits);
  if (currentPos >= s.length) {
    window.resets += 1;
    if (window.resets >= s.length) { resets = 0; }
    window.currentPos = howManyMoreWeNeeded + window.resets;
  }

  var clamped = (parseInt(result) % (max - min)) + min;

  return clamped;
}

window.generate = function(el) {
  window.seed = el.childNodes[4].value;
  window.currentPos = 0;
  window.resets  = 0;

  var c = el.childNodes[1];
  var ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  // now... based on all the numbers, render some lines/etc...
  var paths = nextNum(2, 20);

  var maxElementsPerStroke = nextNum(1, 6);
  
  var maxRadius = nextNum(1, window.maxWidth);

  for (var i = 0; i < paths; i++) {

    ctx.beginPath();

    var pathElements = nextNum(1, maxElementsPerStroke);
    for (var j = 0; j < pathElements; j++) {
      nextMovement = nextNum(0, 5);

      if (nextMovement == 0) {
        // moveTo
        ctx.moveTo(nextNum(0, window.maxWidth), nextNum(0, maxHeight));
      } else if (nextMovement == 1) {
        // lineTo
        ctx.lineTo(nextNum(0, window.maxWidth), nextNum(0, window.maxHeight));
      } else if (nextMovement == 2) {
        // quadraticCurveTo
        ctx.quadraticCurveTo(nextNum(0, window.maxWidth), nextNum(0, window.maxHeight), nextNum(0, window.maxWidth), nextNum(0, window.maxHeight));
      } else if (nextMovement == 3) {
        // bezierCurveTo
        ctx.bezierCurveTo(nextNum(0, window.maxWidth), nextNum(0, window.maxHeight), nextNum(0, window.maxWidth), nextNum(0, window.maxHeight), nextNum(0, window.maxWidth), nextNum(0, window.maxHeight));
      } else if (nextMovement == 4) {
        // arcTo
        ctx.arcTo(nextNum(0, window.maxWidth), nextNum(0, window.maxHeight), nextNum(0, window.maxWidth), nextNum(0, window.maxHeight), maxRadius)
      } else {
        // arc
        var radius = nextNum(0, maxRadius);
        var sAng = nextNum(0, 2000) / 1000;
        var eAng = nextNum(0, 2000) / 1000;
        ctx.arc(nextNum(0, window.maxWidth), nextNum(0, window.maxHeight), radius, sAng, eAng);
      }
    }
    if (nextNum(1, 3) == 1) {
      ctx.strokeStyle = "rgb(" + nextNum(0, 256) + "," + nextNum(0, 256) + "," + nextNum(0, 256) + ")";
      ctx.stroke();
    } else {
      if (nextNum(1, 3) == 1) {
        ctx.fillStyle = "rgb(" + nextNum(0, 256) + "," + nextNum(0, 256) + "," + nextNum(0, 256) + ")";
      } else {
        var grad = ctx.createLinearGradient(nextNum(0, window.maxWidth), nextNum(0, window.maxHeight), nextNum(0, window.maxWidth), nextNum(0, window.maxHeight));
        var c1 = "rgb(" + nextNum(0, 256) + ", " + nextNum(0, 256) + ", " + nextNum(0, 256) + ")";
        var c2 = "rgb(" + nextNum(0, 256) + ", " + nextNum(0, 256) + ", " + nextNum(0, 256) + ")";
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad
      }
      ctx.fill();
    }
  }
}

var seeds = ["328803219694576553799487", "324683377930997577044249", "704284818881641439211741", "484715551264457706997045", "683479111554748103931615", "679881600110736916623132", "854223829527196580480671", "073705495069927549354385", "636715733375447078288870", "931648916026950837930394", "741397409965209382574453", "226081107787308432432178"]

var load = function() {
  window.winners = [];
  var container = document.getElementById("container");
  container.innerHTML = "";

  var genCountEl = document.getElementById("generationCount");
  var genCount = parseInt(genCountEl.getAttribute("data-count")) + 1;
  genCountEl.setAttribute("data-count", genCount);
  genCountEl.innerHTML = "Generation " + genCount;

  for (var i = 0 ; i < seeds.length ; i++) {
    container.innerHTML += "<div id='canvas" + i + "' class='graph'> <canvas width='1280' height='800'></canvas><br> <input value='" + seeds[i] + "'></input> </div>";
  }
  for (var i = 0 ; i < seeds.length ; i++) {
    var el = document.getElementById("canvas" + i);
    window.generate(el);

    el.childNodes[1].onclick = function(evt) {
      var index = winners.indexOf(evt.target.parentNode.childNodes[4].value);
      if (index >= 0) {
        var style = "border: solid 1px";
        winners.splice(index, 1);
      } else {
        var style = "border: solid blue";
        winners.push(evt.target.parentNode.childNodes[4].value);
      }

      evt.target.style = style;
      if (winners.length == 4) {
        seeds = [];
        for (var j = 0 ; j < 4 ; j++) {
          for (var k = 0 ; k < 4 ; k++) {
            if (j != k) {
              seeds.push(combineMut(winners[j], winners[k]));
            }
          }
        }
        load();
      }
    }
  }
}

var combineMut = function(p1, p2) {
  var res = "";
  for (var i = 0 ; i < p1.length ; i++) {
    if (Math.random() >= 0.5) {
      res += p1[i];
    } else {
      res += p2[i];
    }
    if (Math.random() >= 0.1) {
      res[res.length-1] = Math.round(Math.random() * 10);
    }
  }
  return res;
}
