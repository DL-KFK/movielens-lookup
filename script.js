const API_KEY = "1106b01e";
let movies = {};
let moviesLoaded = false;

// 🆕 ВЛАСНІ PLACEHOLDER ЗОБРАЖЕННЯ (без зовнішніх доменів)
const PLACEHOLDER_POSTER = `
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNkM3NUREMCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4Ij4KTm8gUG9zdGVyPC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5Nb3ZpZUxlbnMgMTAwSzwvdGV4dD4KPC9zdmc+Cg==
`.replace(/\s/g, '');

const ERROR_POSTER = `
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjREMzNTQ1Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI0MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LXNpemU9IjE2Ij5FUlJPUjwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjYwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+QVBJIGVycm9yPC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iNzAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5Nb3ZpZUxlbnMgMTAwSzwvdGV4dD4KPC9zdmc+Cg==
`.replace(/\s/g, '');

async function loadMovies() {
  const resultDiv = document.getElementById('result');
  
  try {
    console.log('🔍 Завантажуємо u.item...');
    
    resultDiv.innerHTML = `
      <div class="card loading">
        <p>⏳ Завантаження бази даних...</p>
      </div>
    `;
    
    const response = await fetch("./u.item");
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.split("\n").filter(line => line.trim() && !line.startsWith('::'));
    let loadedCount = 0;
    
    lines.forEach(line => {
      const parts = line.split("|");
      if (parts.length >= 24) {
        const id = parts[0].trim();
        let titleWithYear = parts[1].trim();
        
        // 🆕 ТОЧНИЙ ПАРСИНГ НАЗВИ ТА РОКУ
        const yearMatch = titleWithYear.match(/\(\s*(\d{4})\s*\)$/);
        const year = yearMatch ? yearMatch[1] : '';
        const title = yearMatch 
          ? titleWithYear.slice(0, -yearMatch[0].length).trim()
          : titleWithYear.replace(/::$/, '').trim();
        
        const imdb = parts[3].trim();
        
        movies[id] = { 
          title: title, 
          year: year, 
          imdb: imdb === '\\N' ? '' : imdb 
        };
        loadedCount++;
      }
    });
    
    moviesLoaded = true;
    console.log(`✅ Завантажено ${loadedCount} фільмів`);
    
    resultDiv.innerHTML = `
      <div class="card success">
        <h3>🎉 База даних готова!</h3>
        <p><strong>${loadedCount}</strong> фільмів завантажено</p>
        <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
          <p><strong>💡 Тестові ID:</strong></p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
            <button class="quick-search" onclick="quickSearch(1)">1</button>
            <button class="quick-search" onclick="quickSearch(318)">318</button>
            <button class="quick-search" onclick="quickSearch(296)">296</button>
            <button class="quick-search" onclick="quickSearch(50)">50</button>
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('❌ Помилка завантаження:', error);
    resultDiv.innerHTML = `
      <div class="card error">
        <h3>❌ Помилка завантаження u.item</h3>
        <p><code>${error.message}</code></p>
      </div>
    `;
  }
}

async function lookup() {
  const idInput = document.getElementById("movieId");
  const id = idInput.value.trim();
  const out = document.getElementById("result");

  if (!id || isNaN(id) || id < 1 || id > 1682) {
    out.innerHTML = `
      <div class="card error">
        <p>❌ Введіть коректний ID (1-1682)</p>
      </div>
    `;
    return;
  }

  if (!moviesLoaded || !movies[id]) {
    out.innerHTML = `
      <div class="card error">
        <p>❌ Фільм з ID <strong>${id}</strong> не знайдено</p>
      </div>
    `;
    return;
  }

  const movie = movies[id];
  
  out.innerHTML = `
    <div class="card loading">
      <p>🔍 Завантажуємо "${movie.title}"...</p>
    </div>
  `;

  try {
    // 🆕 ПОКРАЩЕНИЙ ПОШУК OMDb З ТОЧНИМ РОКОМ
    const searchQuery = `"${movie.title}" ${movie.year}`.trim();
    console.log('🔍 OMDb запит:', searchQuery);
    
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(searchQuery)}&year=${movie.year}&apikey=${API_KEY}`
    );
    
    const omdb = await omdbResponse.json();
    console.log('📊 OMDb відповідь:', omdb);

    let poster = PLACEHOLDER_POSTER;
    let year = movie.year || "???";
    let genres = "Невідомо";
    let imdbUrl = "#";
    let imdbRating = "N/A";
    let plot = "Опис недоступний";
    let runtime = "N/A";
    let foundExactMatch = false;

    if (omdb.Response === "True") {
      // 🆕 ПЕРЕВІРКА ТОЧНОГО ЗУСИЛЛЯ
      const omdbTitle = omdb.Title?.toLowerCase() || '';
      const movieTitle = movie.title.toLowerCase();
      
      foundExactMatch = omdbTitle.includes(movieTitle) || movieTitle.includes(omdbTitle);
      
      if (foundExactMatch) {
        poster = omdb.Poster && omdb.Poster !== "N/A" ? omdb.Poster : PLACEHOLDER_POSTER;
        year = omdb.Year || movie.year || "???";
        genres = omdb.Genre || "Невідомо";
        imdbRating = omdb.imdbRating || "N/A";
        plot = omdb.Plot || "Опис недоступний";
        runtime = omdb.Runtime || "N/A";
        
        // 🆕 ТОЧНЕ IMDb ПОСИЛАННЯ
        if (omdb.imdbID && omdb.imdbID !== "N/A" && omdb.imdbID.startsWith('tt')) {
          imdbUrl = `https://www.imdb.com/title/${omdb.imdbID}/`;
        }
      }
    }

    out.innerHTML = `
      <div class="card">
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
          <img class="poster" 
               src="${poster}" 
               alt="${movie.title}" 
               style="flex-shrink: 0; width: 200px; height: 300px; object-fit: cover; border-radius: 8px;" />
          
          <div class="info" style="flex: 1; min-width: 300px;">
            <h2 style="margin: 0 0 0.5rem 0; color: #1a1a1a; font-size: 1.5rem;">
              ${movie.title}
            </h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
              <div>
                <strong>ID:</strong> ${id}<br>
                <strong>Рік:</strong> ${year}<br>
                <strong>Тривалість:</strong> ${runtime}
              </div>
              <div>
                <strong>Жанри:</strong> ${genres}<br>
                <strong>IMDb:</strong> ${imdbRating}
              </div>
            </div>
            
            <p style="margin: 1rem 0; line-height: 1.6; color: #333; ${!foundExactMatch ? 'opacity: 0.7;' : ''}">
              <strong>Опис:</strong> ${plot}
            </p>
            
            ${foundExactMatch ? 
              `<a href="${imdbUrl}" target="_blank" class="imdb-link" rel="noopener">
                🎬 Відкрити на IMDb
              </a>` :
              `<p class="warning" style="margin: 1rem 0;">
                ⚠️ Точний збіг не знайдено в OMDb
              </p>`
            }
            
            <div style="margin-top: 1rem; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; font-size: 0.9rem;">
              <strong>📋 Оригінальні дані MovieLens:</strong><br>
              Назва: <code>${movie.title} (${movie.year})</code><br>
              IMDb ID: <code>${movie.imdb || 'N/A'}</code>
            </div>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('❌ OMDb помилка:', error);
    
    out.innerHTML = `
      <div class="card">
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
          <img class="poster" src="${ERROR_POSTER}" alt="Помилка" 
               style="flex-shrink: 0; width: 200px; height: 300px; border-radius: 8px;" />
          
          <div class="info" style="flex: 1; min-width: 300px;">
            <h2 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">${movie.title}</h2>
            <p><strong>ID:</strong> ${id} | <strong>Рік:</strong> ${movie.year || '?'}</p>
            <p class="error">⚠️ Помилка OMDb API</p>
            ${movie.imdb && movie.imdb !== '\\N' ? 
              `<a href="${movie.imdb}" target="_blank" class="imdb-link">🎬 Відкрити оригінальне IMDb</a>` : 
              ''
            }
          </div>
        </div>
      </div>
    `;
  }
}

function quickSearch(id) {
  document.getElementById("movieId").value = id;
  lookup();
}

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
  loadMovies();
  
  const input = document.getElementById("movieId");
  input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      lookup();
    }
  });
});
