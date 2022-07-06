importScripts("intersects.js");

const MAX_TREE_SIZE = 2048;    // max number of nodes before we refuse to grow any more
const SPLIT_CHANCE = 0.3;      // chance that a branch will split
const STEP_LENGTH = 10;        // length of lines in pixels per iteration
const CHILD_ATTEMPTS = 10;     // number of test children we generate when addChilding
const SCORE_RAYS = 6;          // number of sunlight checkers when determining best-scoring child

let fullTree;

function iterate(node, depth = 1, parent=null) {
  if (node.x === 0 && node.y === 0 && treeSize(node) > MAX_TREE_SIZE) return;

  if (node.children.length === 0) {
    // we're a leaf node and need to create some child nodes that will be the new leaf(s)
    let numberOfChildren = Math.random() > SPLIT_CHANCE ? 1 : 2;

    for (let i = 0; i < numberOfChildren; i++) {
      addChild(node, depth);
    }
  } else {
    for (let i = 0; i < node.children.length; i++) {
      iterate(node.children[i], depth + 1, node);
    }
  }
}

function treeSize(node) {
  if (node.children.length === 0) { return 1; }

  return 1 + node.children.reduce(((sum, child) => sum + treeSize(child)), 0);
}

function addChild(parent, depth) {
  if (treeSize(fullTree) >= MAX_TREE_SIZE) return;

  let candidates = [];
  for (let i = 0; i < CHILD_ATTEMPTS; i++) {
    let cand = makeNode(parent, depth);
    const collides = collidesWithNode(parent.x, parent.y, cand.x, cand.y);
    if (!collides) {
      candidates.push(cand);
    }
  }

  let winner = pickWinningChild(candidates, parent);

  if (winner) {
    parent.children.push({x: winner.x, y: winner.y, depth: depth, children: []});
  }
}

function makeNode(parent, depth) {
  const offsetX = Math.random() * STEP_LENGTH * (Math.random() < 0.5 ? 1 : -1);
  let offsetY = Math.sqrt(STEP_LENGTH * STEP_LENGTH - offsetX * offsetX) * -1;// * (Math.random() < 0.5 ? 1 : -1);
  if (depth > 2) {
   offsetY = offsetY * (Math.random() < 0.5 ? 1 : -1);
  }

  return {x: parent.x + offsetX, y: parent.y + offsetY};
}

function nodeCount(tree) {
  if (tree.children.length === 0) {
    return 1;
  } else {
    let sum = 0;
    for (let i = 0; i < tree.children.length; i++) {
      sum += nodeCount(tree.children[i]);
    }

    return sum;
  }
}

function pickWinningChild(candidates, parent) {
  let bestScore = -1;
  let currentWinner = null;

  for (let i = 0; i < candidates.length; i++) {
    let score = nodeScore(candidates[i]);
    if (score > bestScore) {
      bestScore = score;
      currentWinner = candidates[i];
    }
  }

  return currentWinner;
}

function nodeScore(node) {
  // generate 12 lines (maybe more depending on performance) with node as origin and with y >= 0 (gives preference toward sunlight)
  // count how many of those lines _don't_ intersect the tree
  // Should the lines be random?

  let sum = 0;

  let base = false;
  for (let i = 0; i < 12; i++) {
    let endX = (Math.random() - 0.5) * 10000000;
    let endY = Math.random() * -10000000;
    if (!collidesWithNode(node.x, node.y, endX, endY, fullTree)) {
      base = true;
      sum = sum + (endY * -1);
    }
  }

  if (base) {
    return sum;
  } else {
    return -1;
  }
}

function collidesWithNode(x1, y1, x2, y2, node = fullTree) {
  // returns true if line (x1,y1)=>(x2,y2) intersects with any of the lines described by node => child (for any children)
  if (node.children.length === 0) {
    return false;
  }

  for (let i = 0; i < node.children.length; i++) {
    let treeLineX1 = node.x;
    let treeLineY1 = node.y;
    let treeLineX2 = node.children[i].x;
    let treeLineY2 = node.children[i].y;

    if (intersects(x1, y1, x2, y2, treeLineX1, treeLineY1, treeLineX2, treeLineY2)) {
      return true;
    } else {
      if (collidesWithNode(x1, y1, x2, y2, node.children[i])) {
        return true;
      }
    }
  }

  return false;
}

onmessage = function(e) {
  fullTree = e.data
  iterate(fullTree);
  postMessage(fullTree);
}
