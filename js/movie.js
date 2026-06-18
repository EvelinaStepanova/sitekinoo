const MOVIE_API_KEY = "8760fd7e-7929-4a04-826d-645d19fc8d5e";

let similarPage = 1;
let similarYear = null;
const MAX_SIMILAR = 8;
let similarCoint = 0;
let isSimilarLoading = false;
let hasMoreSimilarMovies = true;

// Функция загрузки информации о фильме
async function getMovie() {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get("id");
    if(!movieId){
        console.error("ID фильма не найден");
        return;
    }
    try {
        const res = await fetch(
            `https://kinopoiskapiunofficial.tech/api/v2.2/films/${movieId}`,
            {
                method: "GET",
                headers: {
                    "X-API-KEY": MOVIE_API_KEY,
                    "Content-Type": "application/json"
                },
            }
        );
        if(!res.ok){
            throw new Error("Ошибка загрузки фильмов: " + res.status);
        }
        const data = await res.json();
        renderMovie(data);
        getActors(movieId);
    } catch (error) {
        console.error(error);
    }
}
// Функция вывода фильма на страницу
function renderMovie(data){
    const movieTitle = document.querySelector(".movie_detail-title");
    const poster = document.querySelector(".movie_detail-poster");
    const movieDescription = document.querySelector(".movie_desc");
    const movieGenres = document.querySelector(".movie_genres");
    const movieYear = document.querySelector(".movie_fact-text.year");
    const movieAge= document.querySelector(".movie_fact-text.age");
    const movieTiming= document.querySelector(".movie_fact-text.timing");
    const movieRating= document.querySelector(".movie_fact-text.rating");

    movieTitle.textContent = data.nameRu || data.nameEn || "Название неизвестно";
    poster.src = data.posterUrl || data.posterUrlPreview || "";
    poster.alt = data.nameRu || data.nameEn || "Постер фильма";
    movieDescription.textContent = data.description || "Описание отсутствует";
    movieGenres.textContent = data.genres && data.genres.length
        ? data.genres.map(function(element){
            return element.genre;
        }).join(", ")
        :"Жанр не указан";
    movieYear.textContent = data.year || "-";
    movieAge.textContent = data.ratingAgeLimits
        ? data.ratingAgeLimits.replace("age", "") + "+"
        : "-";
    movieTiming.textContent = data.filmLength
        ? data.filmLength + "мин"
        : "-";
    movieRating.textContent = data.ratingKinopoisk || "-";
    similarYear = data.year;
    renderStars(data.ratingKinopoisk);
    getSimilarMovies();
}

async function getActors(movieId) {
    try {
        const res = await fetch(
            `https://kinopoiskapiunofficial.tech/api/v1/staff?filmId=${movieId}`,
             {
                method: "GET",
                headers: {
                    "X-API-KEY": MOVIE_API_KEY,
                    "Content-Type": "application/json"
                },
            }
        );
        if(!res.ok){
            throw new Error("Ошибка загрузки актеров: " + res.status);
        }
        const data = await res.json();
        renderActors(data);
    } catch (error) {
        console.error(error);
    }
}
// Функция вывода актеров на страницу
function renderActors(actors){
    const actorsList = document.querySelector(".movie_actors-list");
    if(!actorsList){
        return;
    }
    actorsList.innerHTML = "";

    const params = new URLSearchParams(window.location.search);
    const movieId = params.get("id");

    const onlyActors = actors.filter(function(person){
        return person.professionKey === "ACTOR";
    });
    const topActors = onlyActors.slice(0, 5);
    if(topActors.length === 0){
        actorsList.innerHTML = `<li class="movie_actors-name">Актеры не указаны</li>`;
        return;
    }
    topActors.forEach(function(actor){
        const li = document.createElement("li");
        li.classList.add("movie_actors-name");

        const link = document.createElement("a");
        link.textContent = actor.nameRu || actor.nameEn || "Без имени";
        link.href = `actors.html?filmId=${movieId}&actorId=${actor.staffId}`;
        li.append(link);
        actorsList.append(li);
    });
}

function renderStars(ratingValue){
    const stars = document.querySelectorAll(".movie_rating svg");
    const rating = parseFloat(ratingValue) || 0;
    const fullStars = Math.floor(rating);
    const fraction = rating - fullStars;
    stars.forEach(function(star, index){
        const starFill = star.querySelector(".star-fill");
        if(!starFill){
            return;
        }
        if(index < fullStars){
            starFill.style.fill = "var(--color-accent)";
            starFill.style.opacity = "1";
        }else if (index === fullStars && fraction > 0){
            const percent = fraction * 100;
            const gradientId = `star-gradient-${index}`;
            starFill.style.fill = `url(#${gradientId})`;
            starFill.style.opacity = "1";
            star.insertAdjacentHTML("afterbegin",
                `
                <defs>
                    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="${percent}%" stop-color="var(--color-accent)"></stop>
                        <stop offset="${percent}%" stop-color="transparent"></stop>
                    </linearGradient>
                </defs>
                `
            );
        }else{
            starFill.style.fill = "transparent";
            starFill.style.opacity = "1";
        }
    });
}
async function getSimilarMovies() {
    const similarMoviesCards = document.querySelector(".similar_movies-cards");
    if(!similarYear || isSimilarLoading || similarCoint >= MAX_SIMILAR || !hasMoreSimilarMovies){
        return;
    }
    isSimilarLoading = true;
    try {
        const res = await fetch(
            `https://kinopoiskapiunofficial.tech/api/v2.2/films?yearFrom=${similarYear}&yearTo=${similarYear}&page=${similarPage}`,
             {
                method: "GET",
                headers: {
                    "X-API-KEY": MOVIE_API_KEY,
                    "Content-Type": "application/json"
                },
            }
        );
        if(!res.ok){
            throw new Error ("Ошибка загрузки похожих фильмов");
        }
        const data = await res.json();
        if(!data.items || data.items.length === 0){
            hasMoreSimilarMovies = false;
            return;
        }
        const remaning = MAX_SIMILAR - similarCoint;
        const movies = data.items.slice(0, remaning);
        renderSimilarMovies(movies);
        similarCoint += movies.length;
        similarPage ++;
        if(movies.length < remaning){
            hasMoreSimilarMovies = false;
        }
    } catch (error) {
        console.error(error);
    }finally{
        isSimilarLoading = false;
    }
}

// Функция отрисовки похожих фильмов на странице
function renderSimilarMovies(movies){
    const similarMoviesCards = document.querySelector(".similar_movies-cards ");
    if(!similarMoviesCards){
        return;
    }
    movies.forEach(function(movie){
        const movieCard = document.createElement("article");
        movieCard.classList.add("movie_card", "movie_card-fade");
        movieCard.innerHTML = `
            <img class="movie_card-poster" 
            src="${movie.posterUrlPreview || movie.posterUrl || ""}" 
            alt="${movie.nameRu || movie.nameEn || "Постер фильма"}">
            <div class="movie_card-content">
                <h3 class="movie_card-title">
                    ${movie.nameRu || movie.nameEn || "Название неизвестно"}
                </h3>
                <div class="movie_card-bottom">
                    <span class="movie_card-year">
                        ${movie.year || "-"}
                    </span>
                    <span class="movie_card-rating">
                        ${movie.ratingKinopoisk || "-"}
                    </span>
                </div>
                <a class="movie_card-button" href="movie.html?id=${movie.kinopoiskId}">Подробнее</a>
            </div>
        `;
        similarMoviesCards.append(movieCard);
        setTimeout(()=>{
            movieCard.classList.add("movie_card-show");
        }, 100);
    });
}

window.addEventListener("scroll", ()=>{
    const similarMoviesCards = document.querySelector(".similar_movies-cards");
    if(!similarMoviesCards || similarCoint >= MAX_SIMILAR || !hasMoreSimilarMovies){
        return;
    }
    const blockPosition = similarMoviesCards.getBoundingClientRect().top;
    const screenHeight = window.innerHeight;
    if( blockPosition < screenHeight - 100){
        getSimilarMovies();
    }
});

window.addEventListener("load", ()=>{
    getMovie();
})