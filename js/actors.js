const param = new URLSearchParams(window.location.search);
const filmId = param.get("filmId");
const actorId = param.get("actorId");

const actorsList = document.querySelector(".actors-list");
const searchInput = document.querySelector(".actors_search-input");
const modal = document.querySelector(".actor_modal");
const modalContent = document.querySelector(".actor_modal-content");
const modalTemplate = document.querySelector(".actor_modal-template").cloneNode(true);
const modalClose = document.querySelector(".actor_modal-close");
const historyList = document.querySelector(".actors_history");
const actorsPrevButton = document.querySelector(".actors_pagination-prev");
const actorsNextButton = document.querySelector(".actors_pagination-next");
const actorsPageText = document.querySelector(".actors_pagination-page");

const HISTORY_KEY = "kinosite_actors_history";

let actors = [];
let filteredactors = [];

let actorsPage = 1;
const actorsPerPage = 10;

// Функция загрузки актеров из API
async function loadActors() {
    if(!filmId){
        actorsList.innerHTML = "<p>Фильм не выбран</p>";
        return;
    }
    actorsList.innerHTML = "<p>Загрузка актеров...</p>";
    try {
        const response = await fetch(
            `https://kinopoiskapiunofficial.tech/api/v1/staff?filmId=${filmId}`,
            {
                method: "GET",
                headers: {
                    "X-API-KEY": API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        if(!response.ok){
            throw new Error("Ошибка API: " + response.status);
        }
        const data = await response.json();
        actors = data.filter(function(person){
            return person.professionKey === "ACTOR";
        });
        filteredactors = [];
        actorsPage = 1;
        showActors();
        if(actorId){
            showActorInfo(actorId);
        }
    } catch (error) {
        actorsList.innerHTML = "<p>Не удалось загрузить актеров</p>";
        console.error(error);
    }
}
// Функция отображения актеров на странице
function showActors(){
    actorsList.innerHTML = "";
    const searchValue = searchInput.value.trim();
    const list = searchValue ? filteredactors :actors;
    if(list.length === 0){
        actorsList.innerHTML = "<p>Актеры не найдены</p>";
        actorsPageText.textContent = "1";
        actorsPrevButton.disabled = true;
        actorsNextButton.disabled = true;
        return;
    }
    const start = (actorsPage - 1) * actorsPerPage;
    const end = start + actorsPerPage;
    const actorsPageItems = list.slice(start, end);

    actorsPageItems.forEach(function(actor){
        const card = document.createElement("div");
        card.classList.add("actor_card");
        const name = actor.nameRu || actor.nameEn || "Имя неизвестно";
        const photo = actor.posterUrl || "";
        const photoWrap = document.createElement("div");
        photoWrap.classList.add("actor_card-photo_wrap");

        if(photo){
            const img = document.createElement("img");
            img.classList.add("actor_card-photo");
            img.src = photo;
            img.alt = name;
            photoWrap.append(img);
        }
        const content = document.createElement("div");
        content.classList.add("actor_card-content");

        const title = document.createElement("h3");
        title.classList.add("actor_card-name");
        title.textContent = name;

        const button = document.createElement("button");
        button.classList.add("actor_card-button");
        button.type = "button";
        button.textContent = "Подробнее";
        button.dataset.id = actor.staffId;

        content.append(title);
        content.append(button);

        card.append(photoWrap);
        card.append(content);

        actorsList.append(card);
    });
    actorsPageText.textContent = actorsPage;
    actorsPrevButton.disabled = actorsPage === 1;
    actorsNextButton.disabled = end >= list.length;
}

async function showActorInfo(id) {
    modal.classList.add("active");
    try {
        const response = await fetch(
            `https://kinopoiskapiunofficial.tech/api/v1/staff/${id}`,
            {
                method: "GET",
                headers: {
                    "X-API-KEY": API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        if(!response.ok){
            throw new Error("Ошибка API: " + response.status);
        }

        const actor = await response.json();
        const oldInfo = modalContent.querySelector(".actor_modal-info:not(.actor_modal-template)");

        if(oldInfo){
            oldInfo.remove();
        }

        const info = modalTemplate.cloneNode(true);
        info.classList.remove("actor_modal-template");
        const name = actor.nameRu || actor.nameEn || "Имя неизвестно";
        const photo = actor.posterUrl || "";
        const birthday = actor.birthday || "Нет данных";
        const birthplace = actor.birthplace || "Нет данных";
        const facts = actor.facts && actor.facts.length > 0
            ? actor.facts.join(" ")
            : "Биография отсутствует";
        const img = info.querySelector(".actor_modal-photo");

        if(photo){
            img.src = photo;
            img.alt = name;
            img.style.display = "block";
        }else{
            img.src = "";
            img.alt = "";
            img.style.display = "none";
        }
        info.querySelector(".actor_modal-name").textContent = name;
        info.querySelector(".actor_modal-birthday").textContent = birthday;
        info.querySelector(".actor_modal-birthplace").textContent = birthplace;
        info.querySelector(".actor_modal-facts").textContent = facts;

        const filmsList = info.querySelector(".actor_modal-films");

        filmsList.innerHTML = "";
        if(actor.films && actor.films.length > 0){
            actor.films.slice(0, 10).forEach(function(film){
                const li = document.createElement("li");
                li.textContent = film.nameRu || film.nameEn || "Название неизвестно";
                filmsList.append(li)
            });
        }else{
            filmsList.innerHTML = "<li>Фильмография отсутствует</li>";
        }
        modalContent.append(info);

        let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

        const historyActor = {
            id: actor.personId,
            name: name,
            photo: photo,
        };
        history = history.filter(function(item){
            return item.id !== historyActor.id
        });
        history.unshift(historyActor);
        history = history.slice(0, 10);

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        showHistory();
    } catch (error) {
        console.error(error);
    }
}

// Функция показа истории
function showHistory(){
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    historyList.innerHTML = "";
    if(history.length === 0){
        historyList.innerHTML = "<p>История пока пустая</p>";
        return;
    }

    history.forEach(function(actor){
        historyList.innerHTML = 
        `
            <button class="actors_history-card" type="button" data-id="${actor.id}">
                ${actor.photo 
                    ? `<img 
                    src="${actor.photo}" 
                    alt="${actor.name}">`
                    : ""
                }
                <span>${actor.name}</span>
            </button>
        `;
    });
}

searchInput.addEventListener("input", ()=>{
    const value = searchInput.value.toLowerCase().trim();
    if(value === ""){
        filteredactors = [];
    }else{
        filteredactors = actors.filter(function(actor){
            const name = (actor.nameRu || actor.nameEn || "").toLowerCase();
            return name.includes(value);
        });
        actorsPage = 1;
        showActors();
    }
});

actorsList.addEventListener("click", ()=>{
    if(event.target.classList.contains("actor_card-button")){
        showActorInfo(event.target.dataset.id);
    }
});

historyList.addEventListener("click", function(event){
    const card = event.target.closest(".actors_history-card");
    if(card){
        showActorInfo(card.dataset.id);
    }
});

actorsPrevButton.addEventListener("click", ()=>{
    if(actorsPage > 1){
        actorsPage--;
        showActors();
    }
});

actorsNextButton.addEventListener("click", ()=>{
    const list = searchInput.value.trim()
        ? filteredactors
        :actors;
    if(actorsPage * actorsPerPage < list.length){
        actorsPage++;
        showActors();
    }
});
modalClose.addEventListener("click", ()=>{
    modal.classList.remove("active");
})

modal.addEventListener("click", function(event){
    if(event.target === modal){
        modal.classList.remove("active");
    }
});


loadActors();
showHistory();