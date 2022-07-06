let game = {
  state: 'start'
};
window.game = game;

const start = () => {
  game.letters = letters.value.split('');
  game.results = [];
  game.best = 10000;
  game.worst = -1;
  readySet.innerHTML = '3...';
  window.setTimeout(() => { readySet.innerHTML = '3 2...'; }, 1000);
  window.setTimeout(() => { readySet.innerHTML = '3 2 1...'; }, 2000);
  window.setTimeout(() => {
    readySet.innerHTML = '3 2 1... GO!';
    game.state = 'playing';
    window.setTimeout(() => { nextBeat(); }, Math.random() * 3000);
  }, 3000);
};

const nextBeat = () => {
  if (game.state !== 'playing') return null;

  game.nextLetter = game.letters[Math.floor(Math.random() * game.letters.length)];
  // TODO: place letter
  console.log("next: ", game.nextLetter);
  nextLetter.innerHTML = game.nextLetter;
  const maxY = window.innerHeight - letterSpace.getBoundingClientRect().top - 24;
  const maxX = window.innerWidth - letterSpace.getBoundingClientRect().left - 24;
  nextLetter.style.top = (Math.random() * maxY) + 'px';
  nextLetter.style.left = (Math.random() * maxX) + 'px';
  game.timer = new Date();
};

const react = (e) => {
  if (e.key === ' ') {
    readySet.innerHTML = 'Game Over';
    nextLetter.innerHTML = '';
    game.state = 'done';
    return;
  } else if (e.key === game.nextLetter) {
    const diff = (new Date()) - game.timer;
    game.results.push(diff);
  } else {
    game.results.push("whiff (counts as 1s)");
  }

  draw();

  nextLetter.innerHTML = '';
  window.setTimeout(() => {
    nextBeat();
  }, 100 + Math.random() * 3000);
};

const draw = () => {
  const numericResults = game.results.map((r) => {return typeof r === 'string' ? 1000 : r});
  const max = Math.max.apply(null, numericResults);
  const min = Math.min.apply(null, numericResults);
  const avg = numericResults.reduce((p, a) => p + a, 0) / numericResults.length;
  const whiffs = game.results.filter(r => typeof r === 'string').length;
  best.innerHTML = min;
  worst.innerHTML = max;
  average.innerHTML = avg;
  whiffs.innerHTML = whiffs;
  allResults.innerHTML = game.results.map((r) => {
    return `<li>${r}</li>`;
  }).join("\n");
};

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('start-button').addEventListener('click', start);
  document.body.addEventListener('keypress', react);
});
