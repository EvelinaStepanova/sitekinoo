const TOP_API_KEY = "8760fd7e-7929-4a04-826d-645d19fc8d5e";

const list = document.querySelector(".top250_list");
const tabs = document.querySelectorAll(".top250_tab");
const search = document.querySelector(".top250_search");
const sort = document.querySelector(".top250_sort");
const pagination = document.querySelector(".top250_pagination");
const prev = document.querySelector(".top250_pagination-prev");
const next = document.querySelector(".top250_pagination-next");
const pageText = document.querySelector(".top250_page");

if(list && tabs.length && search && sort && pagination && prev && next && pageText){
    const CASHE_KEY = "kinosite_top250";
    const CASHE_TIME_KEY = "kinosite_top250_time";
    const CASHE_LIFE = 24 * 60 * 60 * 1000;

    let movies = [];
    let limit = 10;
    let page = 1;
    const perPage = 15;

    async function loadMovies() {
        list.innerHTML = `<p>Загрузка фильмов...</p>`;

        const cashe = localStorage.getItem(CASHE_KEY);
        const casheTime = localStorage.getItem(CASHE_TIME_KEY);

        if(cashe && casheTime && Date.now() - Number(casheTime) < CASHE_LIFE){
            try {
                const casheMoviies = JSON.parse(cashe);
                if(Array.isArray(casheMoviies) && casheMoviies.length >= 250 && casheMoviies[0].topPosition){
                    movies = casheMoviies;
                    render();
                    return;
                }
            } catch (error) {
                localStorage.removeItem(CASHE_KEY);
                localStorage.removeItem(CASHE_TIME_KEY);
                console.error("Кеш поврежден или был очищен ",error);
            }
        }

        try {
            let allItems = [];
            for(let apiPage = 1; apiPage <= 13; apiPage++){
                const response = await fetch(
                    `https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_250_MOVIES&page=${apiPage}`,
                    {
                        headers: {
                            "X-API-KEY": TOP_API_KEY,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if(!response.ok){
                    throw new Error ("Ошибка загрузки фильмов " + response.status);
                }

                const data = await response.json();
                allItems = allItems.concat(data.items);
                if(allItems.length >= 250){
                    break;
                }
            }
            movies = allItems.slice(0, 250).map(function(movie, index){
                movie.topPosition = index + 1;
                return movie;
            });
            localStorage.setItem(CASHE_KEY, JSON.stringify(movies));
            localStorage.setItem(CASHE_TIME_KEY, Date.now());
            render();
        } catch (error) {
            list.innerHTML = `<p>Не удалось загрузить фильмы</p>`;
            console.error(error);
        }
    }


    // Функция отрисовки фильмов на страницу
    function render (){
        let result = movies.slice(0, limit);

        const searchValue = search.value.toLowerCase().trim();

        if(searchValue){
            result = result.filter(function(movie){
                return (movie.nameRu || movie.nameEn || "").toLowerCase().includes(searchValue);
            });
        }

        if(sort.value === "year-new"){
            result.sort(function(a, b){
                return Number(b.year) - Number(a.year);
            })
        }
        if(sort.value === "year-old"){
            result.sort(function(a, b){
                return Number(a.year) - Number(b.year);
            })
        }


        const totalPages = Math.ceil(result.length / perPage);
        const start = (page - 1) * perPage;
        const currentMovies = result.slice(start, start + perPage);

        list.innerHTML = "";
        if(!currentMovies.length){
            list.innerHTML = `<p>Фильмы не найдены</p>`;
            pagination.classList.add("hidden");
            return;
        }
        currentMovies.forEach(function(movie){
            const card = document.createElement("article");
            card.className = movie.topPosition <= 3
                ? "top250_card top250_card-winner"
                : "top250_card";
            card.innerHTML = `
                <div class="top250_card-number">${movie.topPosition}</div>
                <img 
                    class="top250_card-poster" 
                    src="${movie.posterUrlPreview || ""}" 
                    alt="${movie.nameRu || movie.nameEn || "Постер фильма"}">
                <div class="top250_card-content">
                    <h2 class="top250_card-title">${movie.nameRu || movie.nameEn || "Название фильма"}</h2>
                    <p class="top250_card-genre">
                    ${movie.genres && movie.genres.length ?movie.genres[0].genre :"Жанр незвестен"}
                    </p>
                    <p class="top250_card-duration">${movie.year || "Год неизвестен"}</p>
                </div>
                <div class="top250_card-rating">${movie.ratingKinopoisk || "-"}</div>
            `;
            list.append(card);
        });
        if(totalPages <= 1){
            pagination.classList.add("hidden");
        }else{
            pagination.classList.remove("hidden");
            pageText.textContent = `${page} / ${totalPages}`;
            prev.disabled = page === 1;
            next.disabled = page === totalPages;
        }
    }

    tabs.forEach(function(tab){
        tab.addEventListener("click", ()=>{
            tabs.forEach(function(item){
                item.classList.remove("active");
            });
            tab.classList.add("active");
            limit = Number(tab.dataset.limit);
            page = 1;
            render();
        });
    });

    search.addEventListener("input", ()=>{
        page = 1;
        render();
    });

    sort.addEventListener("change", ()=>{
        page = 1;
        render();
    });

    prev.addEventListener("click", ()=>{
        if(page > 1){
            page--;
            render();
        }
    });
    next.addEventListener("click", ()=>{
        page++;
        render();
    })



    loadMovies();
}else{
    console.error("Не найдены элементы страницы ТОП-250");
}