const API_KEY = "1106b01e";
const MOVIELENS_FILE = "u.item";

let movies = {}; // { id: "Toy Story (1995)" }


// -----------------------------
// LOAD MOVIELENS
// -----------------------------
fetch(MOVIELENS_FILE)
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
  })
  .catch(err => console.error("MovieLens load error:", err));


// -----------------------------
// MAIN LOOKUP FUNCTION
// -----------------------------
async function lookup() {
  const input = document.getElementById("movieId");
  const resultBox = document.getElementById("result");

  const id = input.value.trim();
  
  if (!id || !movies[id]) {
    resultBox.innerHTML = `<p>Фільм не знайдено</p>`;
    return;
  }

  const title = movies[id];

  // 1) SEARCH in OMDb
  const searchUrl =
    `https://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=${API_KEY}`;

  let searchData;
  try {
    searchData = await fetch(searchUrl).then(r => r.json());
  } catch (err) {
    resultBox.innerHTML = `<p>Помилка OMDb</p>`;
    return;
  }

  if (!searchData || !searchData.Search || !searchData.Search.length) {
    resultBox.innerHTML = `<p>Фільм не знайдено в OMDb</p>`;
    return;
  }

  const movie = searchData.Search[0]; // перший збіг
  const imdbID = movie.imdbID;
  const poster = movie.Poster !== "N/A"
    ? movie.Poster
    : "https://via.placeholder.com/500x750?text=No+Poster";

  // 2) DETAILS request
  const detailsUrl =
    `https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`;

  let details;

  try {
    details = await fetch(detailsUrl).then(r => r.json());
  } catch (err) {
    resultBox.innerHTML = `<p>Не вдалося отримати деталі фільму</p>`;
    return;
  }


  // -----------------------------
  // OUTPUT CARD
  // -----------------------------
  resultBox.innerHTML = `
    <div class="card">
      <img class="poster" src="${poster}" alt="Poster">
      
      <div class="info">
        <h2>${details.Title}</h2>
        <p><strong>Рік:</strong> ${details.Year}</p>
        <p><strong>Жанри:</strong> ${details.Genre}</p>
        <p><strong>Оцінка IMDb:</strong> ${details.imdbRating}</p>

        <a class="imdb-link"
           href="https://www.imdb.com/title/${imdbID}/"
           target="_blank">
          Відкрити на IMDb
        </a>
      </div>
    </div>
  `;
}
