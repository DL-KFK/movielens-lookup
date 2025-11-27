const API_KEY = "1106b01e";
let movies = {};
let moviesLoaded = false;

// Завантажуємо u.item локально
async function loadMovies() {
  try {
    console.log('Завантажуємо u.item...');
    
    const response = await fetch("u.item");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.split("\n");
    let loadedCount = 0;
    
    lines.forEach((line, index) => {
      if (!line.trim() || line.startsWith('::')) return;
      
      const parts = line.split("|");
      if (parts.length >= 24) {
        const id = parts[0].trim();
        // Витягуємо назву без року
        let titleWithYear = parts[1].trim();
        const yearMatch = titleWithYear.match(/\(\s*(\d{4})\s*\)$/);
        const year = yearMatch ? yearMatch[1] : '';
        const title = yearMatch 
          ? titleWithYear.replace(yearMatch[0], '').trim() 
          : titleWithYear;
        
        const imdb = parts[3].trim();
        
        movies[id] = { 
          title: title.replace(/::$/, ''), // Видаляємо :: в кінці
          year, 
          imdb 
        };
        loadedCount++;
      }
    });
    
    moviesLoaded = true;
    console.log(`✅ Завантажено ${loadedCount} фільмів`);
    
    // Показуємо повідомлення про успішне завантаження
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
      <div class="card success">
        <p>✅ База даних завантажена!</p>
        <p>Доступно фільмів: <strong>${loadedCount}</strong></p>
        <p>Введіть ID від 1 до ${loadedCount} для пошуку</p>
      </div>
    `;
    
  } catch (error) {
    console.error('❌ Помилка завантаження u.item:', error);
    
    document.getElementById('result').innerHTML = `
      <div class="card error">
        <h3>❌ Помилка завантаження даних</h3>
        <p><strong>${error.message}</strong></p>
        <p>Перевірте:</p>
        <ul>
          <li>Файл <code>u.item</code> знаходиться в тій же папці</li>
          <li>Сервер підтримує CORS (спробуйте через <code>npx serve</code> або GitHub Pages)</li>
          <li>Файл не порожній</li>
        </ul>
      </div>
    `;
  }
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
  loadMovies();
});

async function lookup() {
  const idInput = document.getElementById("movieId");
  const id = idInput.value.trim();
  const out = document.getElementById("result");

  // Валідація
  if (!id || isNaN(id) || id < 1 || id > 1682) {
    out.innerHTML = `
      <div class="card error">
        <p>❌ Введіть коректний ID фільму (1-1682)</p>
      </div>
    `;
    return;
  }

  if (!moviesLoaded) {
    out.innerHTML = `
      <div class="card warning">
        <p>⏳ Дані ще завантажуються. Зачекайте...</p>
      </div>
    `;
    return;
  }

  if (!movies[id]) {
    out.innerHTML = `
      <div class="card error">
        <p>❌ Фільм з ID <strong>${id}</strong> не знайдено</p>
        <p>Доступні ID: 1-1682</p>
      </div>
    `;
    return;
  }

  const movie = movies[id];
  console.log('Пошук фільму:', movie);
  
  // Показуємо лоадинг
  out.innerHTML = `
    <div class="card loading">
      <p>🔍 Завантажуємо інформацію про "${movie.title}"...</p>
    </div>
  `;

  try {
    // Пошук в OMDb API з роком для кращої точності
    const searchQuery = `${movie.title} ${movie.year}`.trim();
    console.log('OMDb запит:', searchQuery);
    
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(searchQuery)}&apikey=${API_KEY}`
    );
    
    const omdb = await omdbResponse.json();
    console.log('OMDb відповідь:', omdb);

    // Налаштування за замовчуванням
    let poster = "https://via.placeholder.com/500x750/6c757d/ffffff?text=No+Poster";
    let year = movie.year || "???";
    let genres = "Жанри невідомі";
    let imdbUrl = "#";
    let imdbRating = "N/A";
    let plot = "Опис недоступний";
    let runtime = "N/A";

    if (omdb.Response === "True") {
      poster = omdb.Poster && omdb.Poster !== "N/A" ? omdb.Poster : poster;
      year = omdb.Year || movie.year || "???";
      genres = omdb.Genre || "Жанри невідомі";
      imdbRating = omdb.imdbRating || "N/A";
      plot = omdb.Plot || "Опис недоступний";
      runtime = omdb.Runtime || "N/A";
      
      // Правильне посилання IMDb
      if (omdb.imdbID && omdb.imdbID !== "N/A") {
        imdbUrl = `https://www.imdb.com/title/${omdb.imdbID}/`;
      } else if (movie.imdb && movie.imdb !== "\\N") {
        imdbUrl = movie.imdb;
      }
    }

    out.innerHTML = `
      <div class="card">
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
          <img class="poster" 
               src="${poster}" 
               alt="${movie.title}" 
               onerror="this.src='https://via.placeholder.com/300x450/6c757d/ffffff?text=No+Poster'" 
               style="flex-shrink: 0;" />
          
          <div class="info" style="flex: 1; min-width: 300px;">
            <h2 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">${movie.title}</h2>
            
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
            
            <p style="margin: 1rem 0; line-height: 1.5; color: #333;">
              <strong>Опис:</strong> ${plot}
            </p>
            
            <a href="${imdbUrl}" target="_blank" class="imdb-link" 
               style="${imdbUrl === '#' ? 'opacity: 0.5; pointer-events: none;' : ''}">
              🎬 Відкрити на IMDb
            </a>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('❌ Помилка OMDb API:', error);
    
    out.innerHTML = `
      <div class="card">
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
          <img class="poster" 
               src="https://via.placeholder.com/300x450/6c757d/ffffff?text=API+Error" 
               alt="${movie.title}" />
          
          <div class="info" style="flex: 1; min-width: 300px;">
            <h2 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">${movie.title}</h2>
            <p><strong>ID:</strong> ${id} | <strong>Рік:</strong> ${movie.year || '?'}</p>
            <p class="error">⚠️ Не вдалося завантажити додаткову інформацію з OMDb</p>
            ${movie.imdb && movie.imdb !== '\\N' ? 
              `<a href="${movie.imdb}" target="_blank" class="imdb-link">🎬 Відкрити на IMDb</a>` : 
              '<p style="color: #666;">IMDb ID недоступний</p>'
            }
          </div>
        </div>
      </div>
    `;
  }
}

// Додаємо Enter для пошуку та очищення при фокусі
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById("movieId");
  input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      lookup();
    }
  });
  
  input.addEventListener("focus", function() {
    if (moviesLoaded) {
      this.placeholder = "Введіть ID (1-1682) і натисніть Enter або кнопку";
    }
  });
});
