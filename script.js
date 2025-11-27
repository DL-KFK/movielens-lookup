let movies = {};

fetch("u.item")
  .then(r => r.text())
  .then(text => {
    text.split("\n").forEach(line => {
      const parts = line.split("|");
      if (parts.length > 1) {
        const id = parts[0];
        const title = parts[1];
        movies[id] = title;
      }
    });
  });

function lookup() {
  const id = document.getElementById("movieId").value;
  const out = document.getElementById("result");

  if (movies[id]) {
    out.textContent = "Назва фільму: " + movies[id];
  } else {
    out.textContent = "Фільм не знайдено";
  }
}
