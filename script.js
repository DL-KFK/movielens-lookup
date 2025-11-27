const API_KEY = "YOUR_OMDB_KEY";
let movies = {};

// Завантажуємо u.item
fetch("u.item")
  .then(r => r.text())
  .then(text => {
    text.split("\n").forEach(line => {
      const parts = line.split("|");
      if (parts.length > 3) {
        const id = parts[0];
        const title = parts[1];
        const imdb = parts[3];
        movies[id] = { title, imdb };
      }
    });
  });

async function lookup() {
  const id = document.getElementById("movieId").value.trim();
  const out = document.getElementById("result");

  if (!movies[id]) {
    out.innerHTML = "<p>Фільм не знайдено.</p>";
    return;
  }

  const { title, imdb } = movies[id];

  // OMDb poster fetch
  const omdb = await fetch(
    `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`
  ).then(r => r.json());

  const poster = omdb.Poster && omdb.Poster !== "N/A"
    ? omdb.Poster
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const year = omdb.Year || "?";
  const genres = omdb.Genre || "";

  out.innerHTML = `
    <div class="card">
      <img class="poster" src="${poster}" />

      <div class="info">
        <strong>${title}</strong>
        <span>Рік: ${year}</span>
        <span>Жанри: ${genres}</span>
        <a href="${imdb}" target="_blank">Відкрити IMDb</a>
      </div>
    </div>
  `;
}
