document.addEventListener('DOMContentLoaded', () => {
    const booksContainer = document.querySelector('.books');
    const authorInput = document.querySelector('.author-content__input');
    const mainSortList = document.querySelector('.sort-container .sort-list');
    const bookContentTitle = document.querySelector('.book-content__title');
    const wrapper = document.querySelector('.wrapper');
    const headerSortOptions = document.querySelectorAll('.header-sort .sort-options__option');
    const mainSortListTitle = mainSortList.querySelector('.sort-list__title');
    const mainSortOptions = mainSortList.querySelectorAll('.sort-options__option');
    const mainSortArrow = mainSortList.querySelector('.sort-list__arrow');

    let allBooks = [];
    let currentDisplayedBooks = [];
    let currentSort = { type: '', order: '' };

    const FAVORITES_KEY = 'favoriteBooks';

    function getBooksFromLocalStorage(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    function setBooksToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    async function fetchBooks() {
        try {
            const response = await fetch('./src/data/books.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allBooks = await response.json();
            currentDisplayedBooks = [...allBooks];
            renderBooks(currentDisplayedBooks);
            generateFilterOptions();
            updateAllSortOptionsDisplay();
        } catch (error) {
            console.error('Could not fetch books:', error);
            booksContainer.innerHTML = '<p>Failed to load books. Please try again later.</p>';
        }
    }

    function renderBooks(booksToRender) {
        booksContainer.innerHTML = '';
        if (booksToRender.length === 0) {
            booksContainer.innerHTML = '<p>No books found</p>';
            return;
        }
        const booksHtml = booksToRender.map(book => {
            const imagePath = `./img/${book.image}`;

            return `
                <div class="books__item" data-id="${book.id}">
                    <a href="#" class="books__image">
                        <img src="${imagePath}" alt="${book.title}">
                    </a>
                    <div class="book__info">
                        <a href="#" class="books__title">${book.title}</a>
                        <p class="books__author">${book.author}</p>
                    </div>
                </div>
            `;
        }).join('');
        booksContainer.insertAdjacentHTML('beforeend', booksHtml);
    }

    function generateFilterOptions() {
        const genres = [...new Set(allBooks.flatMap(book => book.genre))];
        const years = [...new Set(allBooks.map(book => book.year))].sort();
        const languages = [...new Set(allBooks.map(book => book.language))];

        const genreContent = document.querySelector('.filter__genre-content');
        const yearContent = document.querySelector('.filter__year-content');
        const languageContent = document.querySelector('.filter__language-content');

        const headerFilterGenreSubList = document.querySelector('.header-filter .sort-options__option:nth-child(1) .sub-sort-list');
        const headerFilterYearSubList = document.querySelector('.header-filter .sort-options__option:nth-child(2) .sub-sort-list');
        const headerFilterLanguageSubList = document.querySelector('.header-filter .sort-options__option:nth-child(3) .sub-sort-list');

        function setCheckboxes(container, items, type) {
            container.innerHTML = '';
            const html = items.map((item, index) => `
                <p>
                    <input type="checkbox" class="${type}-content__checkbox" id="${type}${index}" name="check${type}" value="${item}">
                    <label for="${type}${index}" class="${type}-content__text">${item}</label>
                </p>
            `).join('');
            container.insertAdjacentHTML('beforeend', html);
        }

        function setSubSortList(container, items) {
            container.innerHTML = '';
            const html = items.map(item => `
                <li class="sub-sort-option">${item}</li>
            `).join('');
            container.insertAdjacentHTML('beforeend', html);
        }

        setCheckboxes(genreContent, genres, 'genre');
        setCheckboxes(yearContent, years, 'year');
        setCheckboxes(languageContent, languages, 'language');

        setSubSortList(headerFilterGenreSubList, genres);
        setSubSortList(headerFilterYearSubList, years);
        setSubSortList(headerFilterLanguageSubList, languages);
    }

    function applyFilters() {
        const selectedGenres = Array.from(document.querySelectorAll('.genre-content__checkbox:checked')).map(cb => cb.value);
        const selectedYears = Array.from(document.querySelectorAll('.year-content__checkbox:checked')).map(cb => parseInt(cb.value));
        const selectedLanguages = Array.from(document.querySelectorAll('.language-content__checkbox:checked')).map(cb => cb.value);
        const authorSearchTerm = authorInput.value.toLocaleLowerCase().trim();

        const booksToFilterFrom = bookContentTitle.textContent === 'My Favorites'
            ? getBooksFromLocalStorage(FAVORITES_KEY) || []
            : allBooks;

        currentDisplayedBooks = booksToFilterFrom.filter(book => {
            const matchesGenre = selectedGenres.length === 0 || book.genre.some(g => selectedGenres.includes(g));
            const matchesYear = selectedYears.length === 0 || selectedYears.includes(book.year);
            const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.includes(book.language);
            const matchesAuthor = authorSearchTerm === '' || book.author.toLocaleLowerCase().includes(authorSearchTerm);

            return matchesGenre && matchesYear && matchesLanguage && matchesAuthor;
        });

        applySorting();
    }

    function applySorting() {
        const { type, order } = currentSort;

        if (!type) {
            renderBooks(currentDisplayedBooks);
            return;
        }

        currentDisplayedBooks.sort((a, b) => {
            let valA, valB;
            if (type === 'author') {
                valA = a.author.toLocaleLowerCase();
                valB = b.author.toLocaleLowerCase();
            } else if (type === 'title') {
                valA = a.title.toLocaleLowerCase();
                valB = b.title.toLocaleLowerCase();
            } else if (type === 'year') {
                valA = a.year;
                valB = b.year;
            } else {
                return 0;
            }

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
        renderBooks(currentDisplayedBooks);
    }

    function openBookPopup(book) {
        let favorites = getBooksFromLocalStorage(FAVORITES_KEY) || [];
        const isFavorite = favorites.some(favBook => favBook.id === book.id);
        const imagePath = `./img/${book.image}`;

        const popupHtml = `
            <div class="popup-overlay">
                <div class="popup-content">
                    <span class="popup-close">&times;</span>
                    <div class="popup-header">
                        <img src="${imagePath}" alt="${book.title}" class="popup-image">
                        <div class="popup-info">
                            <h2>${book.title}</h2>
                            <p><strong>Author:</strong> ${book.author}</p>
                            <p><strong>Genre:</strong> ${book.genre.join(', ')}</p>
                            <p><strong>Year:</strong> ${book.year}</p>
                            <p><strong>Language:</strong> ${book.language}</p>
                        </div>
                    </div>
                    <div class="popup-description">
                        <h3>Description:</h3>
                        <p>${book.description}</p>
                    </div>
                    <button class="add-to-favorites-btn ${isFavorite ? 'added' : ''}" data-book-id="${book.id}">
                        ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHtml);
    }

    function toggleFavorite(book, button) {
        let favorites = getBooksFromLocalStorage(FAVORITES_KEY) || [];
        const bookIndex = favorites.findIndex(favBook => favBook.id === book.id);

        if (bookIndex > -1) {
            favorites.splice(bookIndex, 1);
            button.textContent = 'Add to Favorites';
            button.classList.remove('added');
        } else {
            favorites.push(book);
            button.textContent = 'Remove from Favorites';
            button.classList.add('added');
        }
        setBooksToLocalStorage(FAVORITES_KEY, favorites);

        if (bookContentTitle.textContent === 'My Favorites') {
            displayFavorites();
            applyFilters();
        }
    }

    function displayFavorites() {
        bookContentTitle.textContent = 'My Favorites';
        const favorites = getBooksFromLocalStorage(FAVORITES_KEY) || [];
        currentDisplayedBooks = [...favorites];
        applyFilters();
    }

    function updateSortDisplay(selectedOptionText) {
        if (mainSortListTitle) {
            mainSortListTitle.innerHTML = `Sort by: <span style="font-size: 12px;">${selectedOptionText}</span>`;
        }
    }

    function getSortOptionText(type, order) {
        if (type === 'author') {
            return order === 'asc' ? 'Author (A-Z)' : 'Author (Z-A)';
        } else if (type === 'title') {
            return order === 'asc' ? 'Title (A-Z)' : 'Title (Z-A)';
        } else if (type === 'year') {
            return order === 'asc' ? 'Year (Oldest)' : 'Year (Newest)';
        }
        return '';
    }

    function updateSortOptionsDisplay(optionsCollection) {
        optionsCollection.forEach(option => {
            const sortType = option.dataset.sortType || (
                option.textContent.includes('Author') ? 'author' :
                option.textContent.includes('Title') ? 'title' :
                option.textContent.includes('Year') ? 'year' : ''
            );
            
            let displayOrder = 'asc';
            if (currentSort.type === sortType) {
                displayOrder = currentSort.order === 'asc' ? 'desc' : 'asc';
            }

            option.textContent = getSortOptionText(sortType, displayOrder);
        });
    }

    function updateAllSortOptionsDisplay() {
        updateSortOptionsDisplay(headerSortOptions);
        updateSortOptionsDisplay(mainSortOptions);
    }

    fetchBooks();

    if (!localStorage.getItem(FAVORITES_KEY)) {
        setBooksToLocalStorage(FAVORITES_KEY, []);
    }

    mainSortList.addEventListener('mouseover', () => {
        if (mainSortArrow) {
            mainSortArrow.classList.add('rotated');
            mainSortList.querySelector('.sort-options').classList.add('active');
        }
    });

    mainSortList.addEventListener('mouseout', (event) => {
        const relatedTarget = event.relatedTarget;
        const sortOptions = mainSortList.querySelector('.sort-options');

        if (!sortOptions.contains(relatedTarget) && relatedTarget !== sortOptions && !mainSortList.contains(relatedTarget)) {
            if (mainSortArrow) {
                mainSortArrow.classList.remove('rotated');
                sortOptions.classList.remove('active');
            }
        }
    });

    document.addEventListener('click', (event) => {
        if (!mainSortList.contains(event.target) && mainSortList.querySelector('.sort-options').classList.contains('active')) {
            mainSortList.querySelector('.sort-options').classList.remove('active');
            if (mainSortArrow) {
                mainSortArrow.classList.remove('rotated');
            }
        }
    });

    wrapper.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('add-to-favorites-btn')) {
            const bookId = target.dataset.bookId;
            const book = allBooks.find(b => b.id == bookId);
            if (book) {
                toggleFavorite(book, target);
            }
        }

        const bookCard = target.closest('.books__item');
        if (bookCard && bookCard.querySelector('.books__title')) {
            const bookId = bookCard.dataset.id;
            const book = allBooks.find(b => b.id == bookId);
            if (book) {
                openBookPopup(book);
            }
        }

        if (target.id === 'home-btn') {
            bookContentTitle.textContent = 'Featured';
            currentDisplayedBooks = [...allBooks];
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            authorInput.value = '';
            currentSort = { type: '', order: '' };
            mainSortListTitle.innerHTML = 'Sort by: ';
            updateAllSortOptionsDisplay();
            applyFilters();
            if (mainSortArrow) {
                mainSortArrow.classList.remove('rotated');
                mainSortList.querySelector('.sort-options').classList.remove('active');
            }
        }

        if (target.id === 'favorites-btn') {
            displayFavorites();
            currentSort = { type: '', order: '' };
            mainSortListTitle.innerHTML = 'Sort by: ';
            updateAllSortOptionsDisplay();
            if (mainSortArrow) {
                mainSortArrow.classList.remove('rotated');
                mainSortList.querySelector('.sort-options').classList.remove('active');
            }
        }

        if (target.closest('.header-sort') && target.classList.contains('sort-options__option')) {
            const sortType = target.dataset.sortType;
            if (sortType) {
                if (currentSort.type === sortType) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.type = sortType;
                    currentSort.order = 'asc';
                }
                applySorting();
                updateAllSortOptionsDisplay();
                updateSortDisplay(getSortOptionText(currentSort.type, currentSort.order));
            }
        }

        if (target.closest('.sort-container') && target.classList.contains('sort-options__option')) {
            const sortType = target.dataset.sortType;

            if (currentSort.type === sortType) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.type = sortType;
                currentSort.order = 'asc';
            }
            applySorting();
            updateAllSortOptionsDisplay();
            updateSortDisplay(getSortOptionText(currentSort.type, currentSort.order));
            if (mainSortArrow) {
                mainSortArrow.classList.remove('rotated');
                mainSortList.querySelector('.sort-options').classList.remove('active');
            }
        }
    });

    document.body.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('popup-close')) {
            const popupOverlay = document.querySelector('.popup-overlay');
            if (popupOverlay) popupOverlay.remove();
            return;
        }

        if (target.classList.contains('popup-overlay')) {
            target.remove();
            return;
        }

        if (target.classList.contains('add-to-favorites-btn')) {
            const bookId = target.dataset.bookId;
            const book = allBooks.find(b => b.id == bookId);
            if (book) {
                toggleFavorite(book, target);
            }
            return;
        }
    });

    wrapper.addEventListener('change', (event) => {
        const target = event.target;
        if (target.matches('.genre-content__checkbox') ||
            target.matches('.year-content__checkbox') ||
            target.matches('.language-content__checkbox')) {
            applyFilters();
        }
    });

    authorInput.addEventListener('input', applyFilters);
});