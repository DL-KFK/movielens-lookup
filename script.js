const API_KEY = "1106b01e";
let movies = {};

fetch("u.item")
  .then(r => r.text())
  .then(text => {
    text.split("\n").forEach(line => {
      const parts = line.split("|");
      if (parts.length > 1) {
        movies[parts[0]] = parts[1]; // беремо лише назву
      }
    });
  });

async function lookup() {
  const id = document.getElementById("movieId").value.trim();
  const out = document.getElementById("result");

  if (!movies[id]) {
    out.innerHTML = "<p>Фільм не знайдено</p>";
    return;
  }

  const title = movies[id];

  // 1) Пошук через s= (завжди повертає imdbID + poster)
  const searchUrl = `https://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=${API_KEY}`;
  const sr = await fetch(searchUrl).then(r => r.json());

  if (!sr.Search || !sr.Search.length) {
    out.innerHTML = `<p>Не знайдено в OMDb</p>`;
    return;
  }

  const first = sr.Search[0];
  const imdbID = first.imdbID;
  const poster = first.Poster !== "N/A"
    ? first.Poster
    : "https://via.placeholder.com/500x750?text=No+Poster";

  // 2) Отримуємо повні дані
  const detail = await fetch(
    `https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`
  ).then(r => r.json());

  out.innerHTML = `
    <div class="card">
      <img class="poster" src="${poster}" />
      <div class="info">
        <strong>${detail.Title}</strong>
        <span>Рік: ${detail.Year}</span>
        <span>Жанри: ${detail.Genre}</span>
        <a href="https://www.imdb.com/title/${imdbID}" target="_blank">
          Відкрити IMDb
        </a>
      </div>
    </div>
  `;
}
