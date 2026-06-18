const burgerButton = document.querySelector(".header_burger");
const mobileMenu = document.querySelector(".header_mobile-menu");

if (burgerButton && mobileMenu){
    burgerButton.addEventListener("click", ()=>{
        mobileMenu.classList.toggle('active');
    });
}

var API_KEY = "8760fd7e-7929-4a04-826d-645d19fc8d5e";
const moviesList = document.querySelector(".movies_list");
const prevButton = document.querySelector(".movies_pagination-prev");
const nextButton = document.querySelector(".movies_pagination-next");

let totalPages = 1;
let currentPage = 1;

async function getPopularMovies(page) {
    if( !moviesList || !prevButton || !nextButton){
        return;
    }
    try {
        moviesList.innerHTML = "<p>Загрузка фильмов...</p>";
        prevButton.disabled = true;
        nextButton.disabled = true;

        const response = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_POPULAR_ALL&page=${page}`,
            {
                method: "GET",
                headers: {
                    "X-API-KEY": API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        if(!response.ok){
            throw new Error("Ошибка при загрузке фильмов");
        }
        const data = await response.json();
        totalPages = data.totalPages || totalPages;

        const movies = data.items.slice(0, 12);

        if(movies.length === 0){
            moviesList.innerHTML = "<p>Фильмы не найдены</p>";
            return;
        }
        renderMovies(movies);
        updatePaginationButtons();
    } catch (error) {
        moviesList.innerHTML = "<p>Не удалось загрузить фильмы. Попробуйте позже</p>";
        console.error(error);
        updatePaginationButtons();
    }
}

// Функция обновления состояния кнопок пагинации
function updatePaginationButtons(){
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage >= totalPages;
}

// Функция отрисовки фильмов
function renderMovies(movies){
    moviesList.innerHTML = "";
    movies.forEach(function(movie){
        const movieCard = document.createElement("article");
        movieCard.classList.add("movie_card");
        movieCard.innerHTML = `
            <img class="movie_card-poster" src="${movie.posterUrlPreview}" alt="${movie.nameRu || movie.nameEn || "Постер фильма"}">
            <div class="movie_card-content">
                <h3 class="movie_card-title">${movie.nameRu || movie.nameEn || "Название неизвестно"}</h3>
                <div class="movie_card-bottom">
                    <span class="movie_card-year">${movie.year || "-"}</span>
                    <span class="movie_card-rating">${movie.ratingKinopoisk || "-"}</span>
                </div>
                <a class="movie_card-button" href="movie.html?id=${movie.kinopoiskId}">Подробнее</a>
            </div>
        `;
        moviesList.append(movieCard);
    });
}

if(nextButton){
    nextButton.addEventListener("click", ()=>{
        if(currentPage < totalPages){
            currentPage ++;
            getPopularMovies(currentPage);
            window.scrollTo({
                top: moviesList.offsetTop - 100,
                behavior: "smooth",
            });
        }
    });
}

if(prevButton){
    prevButton.addEventListener("click", ()=>{
        if(currentPage > 1){
            currentPage--;
            getPopularMovies(currentPage);
            window.scrollTo({
                top: moviesList.offsetTop - 100,
                behavior: "smooth",
            });
        }
    });
}

if(moviesList && prevButton && nextButton){
    getPopularMovies(currentPage);
}

// Плавный скролл
const scrollLinks = document.querySelectorAll(".js-scroll");

scrollLinks.forEach(function(link){
    link.addEventListener("click", function(event){
        event.preventDefault();

        const targetId = link.getAttribute("href");
        const targetBlock = document.querySelector(targetId);

        if(targetBlock){
            window.scrollTo({
                top: targetBlock.offsetTop - 100,
                behavior: "smooth",
            });
        }
    });
});