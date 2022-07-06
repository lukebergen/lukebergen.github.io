const MAX_TREE_SIZE = 2048;    // max number of nodes before we refuse to grow any more
const SCALE_FACTOR = 0.1;      // how much scrolling impacts zoom
const DEBUGGING = false;

let canvas;
let context;

window.iterateWorker = window.iterateWorker || new Worker("iterate.js");
window.iterateWorker.onmessage = (e) => {
  window.ticksToRun--;
  window.tree = e.data;
  saveTree();
  renderTree();
  debug("Tree Size: " + treeSize());
  if (window.ticksToRun > 0) {
    window.iterateWorker.postMessage(window.tree);
  } else {
    treeLoading(false);
    const now = (new Date()).getTime();
    config("lastTick", now.toString());
  }
}

window.cutStart = null;
window.cutEnd = null;
window.doingCut = false;
window.startDragOffset = {};
let translatePos = {x: window.innerWidth / 2, y: window.innerHeight / 2};
let scale = 1.0;

function setupCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function setupSeed() {
  if (!localStorage["seed"]) {
    localStorage.setItem("seed", Math.random());
  }

  window.seed = parseFloat(localStorage["seed"]);
}

function setupTree() {
  window.tree = {x: 0, y: 0, depth: 0, children: []};
  window.lines = [];

  for (let i = 0; i < 2; i++) { window.iterateWorker.postMessage(window.tree); }

  localStorage.setItem("tree", JSON.stringify(tree));
}

function getTree() {
  // TODO: uncomment this conditional if you want trees to persist through reloads
  if (!localStorage["tree"]) {
    setupTree();
  }

  return JSON.parse(localStorage["tree"]);
}

function saveTree(tree = window.tree) {
  localStorage.setItem("tree", JSON.stringify(tree));
}

function renderCut() {
  if (window.cutStart && window.cutEnd) {
    context.lineWidth = 1 / scale;
    context.beginPath();
    context.strokeStyle = "#000000";
    context.moveTo(window.cutStart.x, window.cutStart.y);
    context.lineTo(window.cutEnd.x, window.cutEnd.y);
    context.stroke();
    context.lineWidth = 1;
  }
}

function makeCut(node, cutStart, cutEnd) {
  node.children = node.children.filter((child) => {
    const csx = cutStart.x;
    const csy = cutStart.y;
    const cex = cutEnd.x;
    const cey = cutEnd.y;

    return !intersects(csx, csy, cex, cey, node.x, node.y, child.x, child.y);
  });

  for (let i = 0; i < node.children.length; i++) {
    makeCut(node.children[i], cutStart, cutEnd);
  }
}

function renderTree(tree = window.tree) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(translatePos.x, translatePos.y);
  context.scale(scale, scale);

  context.fillRect(-8, -8, 16, 16);

  renderCut();
  const lines = treeToLines(tree);
  for (let i = 0; i < lines.length; i++) {
    context.beginPath();
    let line = lines[i];
    // TODO: These colors are bad. And maybe we could do something more fun for leaf nodes
    if (line[4]) {
      context.strokeStyle = "#3DB83B";
    } else {
      context.strokeStyle = "#DEB887";
    }
    context.moveTo(line[0], line[1]);
    context.lineTo(line[2], line[3]);

    context.stroke();
  }

  context.restore();
}

function treeToLines(node = window.tree, lines=[]) {
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i];
    let isLeaf = c.children.length === 0;
    lines.push([node.x, node.y, c.x, c.y, isLeaf, node.depth]);
    treeToLines(c, lines);
  }

  return lines;
}

function treeLoading(doLoad) {
  const loadingEl = document.getElementById("loading");
  const canvasEl = document.getElementById("tree");

  if (doLoad && (treeSize() > 800 || window.ticksToRun > 2)) {
    loadingEl.setAttribute("class", "active");
    canvasEl.setAttribute("class", "inactive");
  } else {
    loadingEl.setAttribute("class", "inactive");
    canvasEl.setAttribute("class", "active");
  }
}

function tick(tree) {
  if (window.ticksToRun > 0) {
    // We're already using a worker to build out the tree. Let's not get ahead of ourselves
    return null;
  }

  if (!config().lastTick) {
    config("lastTick", (new Date()).getTime());
  }
  const lastTick = config().lastTick;
  const now = (new Date()).getTime();

  const ticksToRun = Math.round((now - lastTick) / config().gameSpeed);
  if (ticksToRun > 0) {
    treeLoading(true);
    window.ticksToRun = ticksToRun;
    window.iterateWorker.postMessage(tree);
  }
}

function setGameSpeed(speedInput) {
  let friendlyText = "";
  let gameSpeed = 1000 * 60 * 60 * 24; // default is 1 day. Non-middle values scale up/down based on this

  switch(speedInput) {
    case "1":
      friendlyText = "1/4 growths per day";
      gameSpeed = gameSpeed * 4;
      break;
    case "2":
      friendlyText = "1/2 growths per day";
      gameSpeed = gameSpeed * 2;
      break;
    case "3":
      friendlyText = "1 growth per day";
      gameSpeed = gameSpeed * 1;
      break;
    case "4":
      friendlyText = "2 growths per day";
      gameSpeed = gameSpeed * 0.5;
      break;
    case "5":
      friendlyText = "4 growths per day";
      gameSpeed = gameSpeed * 0.25;
      break;
  }
  config("gameSpeed", gameSpeed);
  document.getElementById("speedSliderHelp").innerHTML = friendlyText;
}

function start() {
  canvas = document.getElementById("tree");
  context = canvas.getContext("2d");

  if (!config().gameSpeed) {
    config("gameSpeed", 1000 * 60 * 60 * 24);
  }
  let val = config().gameSpeed;
  let offset = val / 1000 / 60 / 60 / 24;
  switch(offset) {
    case 4:
      val = "1"; break;
    case 2:
      val = "2"; break;
    case 1:
      val = "3"; break;
    case 0.5:
      val = "4"; break;
    case 0.25:
      val = "5"; break;
  }

  document.getElementById("speed-slider").value = val;
  setGameSpeed(val);

  setupCanvas();
  setupSeed();

  window.tree = getTree();

  renderTree(tree);

  debug("Tree Size: " + treeSize());

  // TODO: uncomment for ticking
  window.setInterval(() => { tick(tree); }, 1000);
}

function config(key, value) {
  let config = JSON.parse(localStorage.getItem("config") || "{}")
  if (key) {
    config[key] = value;
    localStorage.setItem("config", JSON.stringify(config));
  }

  return config;
}

function treeSize(node = window.tree) {
  if (node.children.length === 0) { return 1; }

  return 1 + node.children.reduce(((sum, child) => sum + treeSize(child)), 0);
}

document.addEventListener("DOMContentLoaded", (event) => {
  start();

  document.getElementById("iterate").onclick = (event) => {
    if (treeSize() >= MAX_TREE_SIZE) {
      alert("Too big. Try trimming a bit");
    } else {
      treeLoading(true);
      window.ticksToRun = 1;
      window.iterateWorker.postMessage(window.tree);

      saveTree(window.tree);
      renderTree(window.tree);
    }
  }

  document.getElementById("reset-view").onclick = (event) => {
    translatePos = {x: window.innerWidth / 2, y: window.innerHeight / 2};
    scale = 1.0;
    renderTree();
  }

  document.getElementById("menu-toggle").onclick = (event) => {
    let menu = document.getElementById("menu");
    if (menu.getAttribute("style") === "display: block;") {
      // closing the menu
      menu.setAttribute("style", "display: none;");
    } else {
      // opening the menu
      menu.setAttribute("style", "display: block;");
    }
  }

  const container = document.getElementById("container");

  const cutEl = document.getElementById("cut");
  cutEl.onclick = (event) => {
    window.doingCut = !window.doingCut;
    if (doingCut) {
      cutEl.setAttribute("class", "active");
    } else {
      cutEl.setAttribute("class", "inactive");
    }
    if (window.doingCut) {
      container.setAttribute("class", "cutting")
    } else {
      container.setAttribute("class", "");
    }
  }

  function handleScroll(event) {
    let delta = event.wheelDelta ? event.wheelDelta/40 : event.detail ? -event.detail : 0;
    if (delta) {
      let last = scale;
      scale = scale + (delta * SCALE_FACTOR);
      if (scale > 15 || scale < 0.05) {
        scale = last;
      }
      renderTree();
    }
    return event.preventDefault() && false;
  }
  container.addEventListener("DOMMouseScroll", handleScroll,false);
  container.addEventListener("mousewheel" ,handleScroll,false);

  const ht = new Hammer(container, {});

  ht.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  ht.get('pinch').set({ enable: true });

  ht.on("panstart", (ev) => {
    if (window.doingCut) {
      window.cutStart = {x: (ev.srcEvent.x - translatePos.x) / scale, y: (ev.srcEvent.y - translatePos.y) / scale};
    } else {
      window.startDragOffset = {x: translatePos.x, y: translatePos.y}
    }
  });

  ht.on("pan", (ev) => {
    if (window.doingCut) {
      window.cutEnd = {x: (ev.srcEvent.x - translatePos.x) / scale, y: (ev.srcEvent.y - translatePos.y) / scale};
    } else {
      translatePos.x = startDragOffset.x + ev.deltaX;
      translatePos.y = startDragOffset.y + ev.deltaY;
    }
    renderTree();
  });

  ht.on("panend", (ev) => {
    if (window.doingCut) {
      makeCut(window.tree, window.cutStart, window.cutEnd);
      window.startDragOffset = {};
      window.cutStart = null;
      window.cutEnd = null;
      renderTree();
      saveTree();
    }
  });

  ht.on("pinchstart", (ev) => { window.lastScale = 1.0; });

  ht.on("pinchmove", (ev) => {
    let last = scale;
    scale = scale - ((window.lastScale - ev.scale));
    if (scale > 15 || scale < 0.5) {
      scale = last;
    }
    renderTree();
  });

  ht.on("pinchend", (ev) => { window.lastScale = 1.0; });

  const speedSliderEl = document.getElementById("speed-slider");
  speedSliderEl.oninput = (ev) => {
    setGameSpeed(ev.target.value);
  };
});

function debug(str) {
  document.getElementById("debug-output").innerHTML = str;
}
