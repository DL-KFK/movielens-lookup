// Глобальні змінні
let movies = {};
let users = {};
let ratings = {};
let moviesLoaded = false;
let usersLoaded = false;
let ratingsLoaded = false;

const API_KEY = "1106b01e";
const PLACEHOLDER_POSTER = `data:image/svg+xml;base64,...`; // з попереднього коду

// Завантаження файлу датасету. Файли MovieLens 100K збережені в кодуванні ISO-8859-1 (latin-1),
// тому декодуємо їх явно, інакше назви з діакритикою псуються.
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder('iso-8859-1').decode(buf);
}

// 🆕 ЗАВАНТАЖЕННЯ ВСЬОГО ДАТАСЕТУ
async function loadFullDataset() {
  const resultDiv = document.getElementById('movieResult');
  
  try {
    resultDiv.innerHTML = `
      <div class="card loading">
        <p>⏳ Завантаження повного датасету MovieLens 100K...</p>
        <div style="margin-top: 1rem;">
          <div class="progress-bar">
            <div class="progress" style="width: 0%"></div>
          </div>
        </div>
      </div>
    `;

    // 1. Завантажуємо фільми
    console.log('📁 Завантажуємо u.item...');
    const moviesText = await fetchText('./u.item');
    parseMovies(moviesText);
    updateProgress(33);

    // 2. Завантажуємо користувачів
    console.log('📁 Завантажуємо u.user...');
    const usersText = await fetchText('./u.user');
    parseUsers(usersText);
    updateProgress(66);

    // 3. Завантажуємо рейтинги
    console.log('📁 Завантажуємо u.data...');
    const ratingsText = await fetchText('./u.data');
    parseRatings(ratingsText);
    updateProgress(100);

    moviesLoaded = usersLoaded = ratingsLoaded = true;
    
    const totalRatings = Object.values(ratings).reduce((sum, r) => sum + r.total, 0);
    console.log(`✅ Датасет завантажено:
    • Фільмів: ${Object.keys(movies).length}
    • Користувачів: ${Object.keys(users).length}
    • Рейтингів: ${totalRatings}`);

    // Прибираємо картку «Завантаження…» — раніше вона лишалась назавжди
    resultDiv.innerHTML = `
      <div class="card">
        <p>✅ Датасет завантажено: <strong>${Object.keys(movies).length}</strong> фільмів,
        <strong>${Object.keys(users).length}</strong> користувачів,
        <strong>${totalRatings.toLocaleString('uk-UA')}</strong> оцінок.</p>
        <p>Введіть ID фільму (1–1682) або частину назви англійською, наприклад <code>Star Wars</code>.</p>
      </div>
    `;

    showDatasetStats();

  } catch (error) {
    console.error('❌ Помилка завантаження:', error);
    resultDiv.innerHTML = `
      <div class="card error">
        <h3>❌ Помилка завантаження датасету</h3>
        <p><code>${error.message}</code></p>
        <p>Перевірте наявність файлів:</p>
        <ul>
          <li><code>u.item</code> (фільми)</li>
          <li><code>u.user</code> (користувачі)</li>
          <li><code>u.data</code> (рейтинги)</li>
        </ul>
      </div>
    `;
  }
}

// 🆕 ПАРСИНГ ФІЛЬМІВ
function parseMovies(text) {
  const lines = text.split('\n').filter(line => line.trim());
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length >= 24) {
      const id = parts[0].trim();
      let titleWithYear = parts[1].trim();
      const yearMatch = titleWithYear.match(/\((\d{4})\)$/);
      const year = yearMatch ? yearMatch[1] : '';
      const title = yearMatch 
        ? titleWithYear.slice(0, -yearMatch[0].length).trim()
        : titleWithYear.replace(/::$/, '').trim();
      const imdb = parts[3].trim();
      
      movies[id] = { id, title, year, imdb: imdb === '\\N' ? '' : imdb };
    }
  });
}

// 🆕 ПАРСИНГ КОРИСТУВАЧІВ
function parseUsers(text) {
  const lines = text.split('\n').filter(line => line.trim());
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length >= 5) {
      const id = parts[0].trim();
      const age = parts[1].trim();
      const gender = parts[2].trim();
      const occupation = parts[3].trim();
      const zip = parts[4].trim();
      
      users[id] = { 
        id, 
        age: parseInt(age), 
        gender, 
        occupation, 
        zip,
        ratings: new Map()
      };
    }
  });
}

// 🆕 ПАРСИНГ РЕЙТИНГІВ
function parseRatings(text) {
  const lines = text.split('\n').filter(line => line.trim());
  lines.forEach(line => {
    const [userId, movieId, rating, timestamp] = line.split('\t').map(s => s.trim());
    
    // Додаємо рейтинг користувача
    if (users[userId]) {
      users[userId].ratings.set(movieId, { rating: parseFloat(rating), timestamp: parseInt(timestamp) });
    }
    
    // Статистика по фільмах
    if (!ratings[movieId]) {
      ratings[movieId] = { ratings: [], total: 0, avg: 0 };
    }
    ratings[movieId].ratings.push(parseFloat(rating));
    ratings[movieId].total++;
  });
  
  // Обчислюємо середні рейтинги
  Object.keys(ratings).forEach(movieId => {
    const movieRatings = ratings[movieId].ratings;
    ratings[movieId].avg = movieRatings.reduce((a, b) => a + b, 0) / movieRatings.length;
  });
}

// 🆕 ПОКАЗ СТАТИСТИКИ
function showDatasetStats() {
  const statsGrid = document.getElementById('statsGrid');
  const topMoviesDiv = document.getElementById('topMovies');
  const topUsersDiv = document.getElementById('topUsers');

  // Статистика
  const totalRatings = Object.values(ratings).reduce((sum, r) => sum + r.total, 0);
  const sumRatings = Object.values(ratings).reduce((sum, r) => sum + r.ratings.reduce((a, b) => a + b, 0), 0);
  const avgRating = totalRatings ? sumRatings / totalRatings : 0;

  statsGrid.innerHTML = `
    <div class="stat-card">
      <h3>${Object.keys(movies).length}</h3>
      <p>Фільмів</p>
    </div>
    <div class="stat-card">
      <h3>${Object.keys(users).length}</h3>
      <p>Користувачів</p>
    </div>
    <div class="stat-card">
      <h3>${totalRatings.toLocaleString()}</h3>
      <p>Рейтингів</p>
    </div>
    <div class="stat-card">
      <h3>${avgRating.toFixed(2)}</h3>
      <p>Середній рейтинг</p>
    </div>
  `;

  // Топ-10 фільмів
  const topMovies = Object.entries(ratings)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 10)
    .map(([id, stats]) => ({
      id,
      title: movies[id]?.title || 'Unknown',
      ratings: stats.total,
      avg: stats.avg.toFixed(2)
    }));

  topMoviesDiv.innerHTML = `
    <div class="card">
      <h3>🎬 Топ-10 найпопулярніших фільмів</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;">
        ${topMovies.map(m => `
          <div class="movie-item">
            <strong>${m.title}</strong><br>
            <span>⭐ ${m.avg} (${m.ratings} голосів)</span><br>
            <small>ID: ${m.id}</small>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Топ-10 активних користувачів
  const topUsers = Object.entries(users)
    .map(([id, user]) => ({
      id,
      ...user,
      ratingCount: user.ratings.size
    }))
    .sort((a, b) => b.ratingCount - a.ratingCount)
    .slice(0, 10);

  topUsersDiv.innerHTML = `
    <div class="card">
      <h3>👤 Найактивніші користувачі</h3>
      <div class="user-ratings">
        ${topUsers.map(u => `
          <div style="padding: 0.75rem; border-bottom: 1px solid #eee;">
            <strong>ID ${u.id}</strong> | 
            ${u.gender} | 
            ${u.age} років | 
            ${u.occupation} | 
            <span style="color: #28a745;">${u.ratingCount} оцінок</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 🆕 ПОШУК КОРИСТУВАЧА
async function lookupUser() {
  if (!usersLoaded) { document.getElementById('userResult').innerHTML = '<div class="card warning"><p>⏳ Датасет ще завантажується, зачекайте кілька секунд.</p></div>'; return; }
  const userId = document.getElementById('userId').value.trim();
  const resultDiv = document.getElementById('userResult');

  if (!userId || isNaN(userId) || userId < 1 || userId > 943) {
    resultDiv.innerHTML = '<div class="card error"><p>❌ Введіть коректний ID користувача (1-943)</p></div>';
    return;
  }

  if (!users[userId]) {
    resultDiv.innerHTML = `<div class="card error"><p>❌ Користувач ${userId} не знайдений</p></div>`;
    return;
  }

  const user = users[userId];
  const userRatings = Array.from(user.ratings.entries())
    .map(([movieId, rating]) => ({
      movieId,
      rating: rating.rating,
      movieTitle: movies[movieId]?.title || 'Unknown'
    }))
    .sort((a, b) => b.rating - a.rating);

  resultDiv.innerHTML = `
    <div class="card">
      <h2>👤 Користувач ${userId}</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
        <div>
          <strong>Вік:</strong> ${user.age}<br>
          <strong>Стать:</strong> ${user.gender}<br>
          <strong>Професія:</strong> ${user.occupation}<br>
          <strong>Поштовий індекс:</strong> ${user.zip}
        </div>
        <div>
          <strong>Кількість оцінок:</strong> ${userRatings.length}<br>
          <strong>Середній рейтинг:</strong> ${userRatings.length ? (userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length).toFixed(2) : '0'}
        </div>
      </div>
      
      <h3>⭐ Топ-10 оцінок користувача</h3>
      <div class="user-ratings" style="max-height: 300px; overflow-y: auto;">
        ${userRatings.slice(0, 10).map(r => `
          <div style="padding: 0.75rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
            <span><strong>${r.movieTitle}</strong> (ID ${r.movieId})</span>
            <span style="color: #28a745; font-weight: bold;">⭐ ${r.rating}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 🆕 ПОШУК ФІЛЬМУ (покращений)
async function lookupMovie() {
  if (!moviesLoaded) { document.getElementById('movieResult').innerHTML = '<div class="card warning"><p>⏳ Датасет ще завантажується, зачекайте кілька секунд.</p></div>'; return; }
  const movieId = document.getElementById('movieId').value.trim();
  const movieTitle = document.getElementById('movieTitle').value.trim().toLowerCase();
  const resultDiv = document.getElementById('movieResult');

  if (!movieId && !movieTitle) {
    resultDiv.innerHTML = '<div class="card warning"><p>Введіть ID або назву фільму</p></div>';
    return;
  }

  let targetMovie = null;

  // Пошук по ID
  if (movieId && movies[movieId]) {
    targetMovie = movies[movieId];
  }
  
  // Пошук по назві
  if (!targetMovie && movieTitle) {
    targetMovie = Object.values(movies).find(movie => 
      movie.title.toLowerCase().includes(movieTitle)
    );
  }

  if (!targetMovie) {
    resultDiv.innerHTML = '<div class="card error"><p>❌ Фільм не знайдено</p></div>';
    return;
  }

  // Статистика фільму з датасету
  const movieStats = ratings[targetMovie.id];
  const totalRatings = movieStats?.total || 0;
  const avgRating = movieStats?.avg?.toFixed(2) || 'N/A';

  resultDiv.innerHTML = `
    <div class="card">
      <h2>🎬 ${targetMovie.title} (${targetMovie.year})</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
        <div>
          <strong>ID:</strong> ${targetMovie.id}<br>
          <strong>Рейтингів:</strong> ${totalRatings}<br>
          <strong>Середній:</strong> ${avgRating}
        </div>
      </div>
      <p><em>Детальна інформація з OMDb API буде додана тут...</em></p>
    </div>
  `;
}

// 🆕 ПЕРЕКЛЮЧЕННЯ ТАБІВ
function switchTab(tabName) {
  // Приховуємо всі секції
  document.querySelectorAll('.search-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Активуємо потрібну
  document.getElementById(tabName).classList.add('active');
  
  // Оновлюємо кнопки
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.getAttribute('onclick') || '').includes(`'${tabName}'`));
  });
  
  // Показуємо статистику при переключенні
  if (tabName === 'stats' && moviesLoaded && ratingsLoaded) {
    showDatasetStats();
  }
}

function updateProgress(percent) {
  const bar = document.querySelector('.progress');
  if (bar) bar.style.width = `${percent}%`;
}

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
  loadFullDataset();
  
  // Enter для пошуку
  document.getElementById('movieId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') lookupMovie();
  });
  
  document.getElementById('userId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') lookupUser();
  });
});
