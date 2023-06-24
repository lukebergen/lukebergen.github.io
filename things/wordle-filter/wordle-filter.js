let words;

document.addEventListener('DOMContentLoaded', async () => {
  words = (await (await fetch("words.txt")).text()).split("\n");
  yellow.addEventListener("keypress", (e) => {
    e.target.value.split("").forEach((letter) => {

    });
  });
});
