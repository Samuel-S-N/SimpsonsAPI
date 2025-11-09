document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://thesimpsonsapi.com/api/characters';
  const cardsContainer = document.getElementById('cards-container');
  const imageModal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-image-caption');
  const modalCloseElements = imageModal
    ? imageModal.querySelectorAll('[data-close="true"]')
    : [];
  let lastFocusedElement = null;

  const statusMessage = document.createElement('p');
  statusMessage.classList.add('status-message');
  statusMessage.textContent = 'Carregando personagens...';
  cardsContainer.appendChild(statusMessage);

  fetchCharacters()
    .then(renderCharacters)
    .catch(handleError);

  setupModalEvents();

  async function fetchCharacters() {
    const allCharacters = [];
    let nextUrl = API_URL;

    while (nextUrl) {
      const response = await fetch(nextUrl);

      if (!response.ok) {
        throw new Error('Não foi possível carregar os personagens.');
      }

      const data = await response.json();
      if (Array.isArray(data?.results)) {
        allCharacters.push(...data.results);
      }

      nextUrl = data?.next ?? null;
    }

    return allCharacters;
  }

  function renderCharacters(characters) {
    cardsContainer.innerHTML = '';

    if (!characters.length) {
      showStatusMessage('Nenhum personagem encontrado.');
      return;
    }

    characters.forEach((character) => {
      const card = document.createElement('article');
      card.classList.add('character-card');

      const portrait = document.createElement('img');
      portrait.src = buildPortraitUrl(character.portrait_path);
      portrait.alt = character.name ?? 'Personagem de Os Simpsons';
      portrait.loading = 'lazy';
      portrait.addEventListener('click', () => openImageModal(character));

      const content = document.createElement('div');
      content.classList.add('character-content');

      const name = document.createElement('h3');
      name.classList.add('character-name');
      name.textContent = character.name ?? 'Personagem Desconhecido';

      const details = document.createElement('ul');
      details.classList.add('character-details');
      details.appendChild(
        createDetailItem('Idade', formatAge(character.age))
      );
      details.appendChild(
        createDetailItem('Aniversário', formatBirthdate(character.birthdate))
      );
      details.appendChild(
        createDetailItem('Gênero', formatGender(character.gender))
      );
      details.appendChild(
        createDetailItem('Ocupação', formatOccupation(character.occupation))
      );
      const formattedStatus = formatStatus(character.status, character.gender);
      details.appendChild(
        createDetailItem(
          'Status',
          formattedStatus,
          getStatusClass(character.status)
        )
      );

      const quoteText = selectQuote(character.phrases);

      const quote = document.createElement('p');
      quote.classList.add('character-quote');
      quote.textContent = quoteText || 'Sem citações disponíveis.';

      content.appendChild(name);
      content.appendChild(details);
      content.appendChild(quote);

      card.appendChild(portrait);
      card.appendChild(content);

      cardsContainer.appendChild(card);
    });
  }

  function handleError() {
    cardsContainer.innerHTML = '';
    showStatusMessage('Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.');
  }

  function showStatusMessage(message) {
    const errorMessage = document.createElement('p');
    errorMessage.classList.add('status-message');
    errorMessage.textContent = message;
    cardsContainer.appendChild(errorMessage);
  }

  function buildPortraitUrl(path, size = 500) {
    if (typeof path === 'string' && path.trim()) {
      const trimmedPath = path.startsWith('/') ? path : `/${path}`;
      return `https://cdn.thesimpsonsapi.com/${size}${trimmedPath}`;
    }

    return `https://cdn.thesimpsonsapi.com/${size}/character/placeholder.webp`;
  }

  function createDetailItem(label, value, valueClass) {
    const item = document.createElement('li');
    item.classList.add('character-detail-item');

    const labelEl = document.createElement('span');
    labelEl.classList.add('detail-label');
    labelEl.textContent = `${label}:`;

    const valueEl = document.createElement('span');
    valueEl.classList.add('detail-value');
    valueEl.textContent = value;
    if (valueClass) {
      valueEl.classList.add(valueClass);
    }

    item.appendChild(labelEl);
    item.appendChild(valueEl);

    return item;
  }

  function formatAge(age) {
    if (typeof age === 'number' && !Number.isNaN(age)) {
      return `${age} anos`;
    }
    return 'Não informado';
  }

  function formatBirthdate(birthdate) {
    if (typeof birthdate === 'string' && birthdate.trim()) {
      const date = new Date(birthdate);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).format(date);
      }
    }

    return 'Não informado';
  }

  function formatOccupation(occupation) {
    if (typeof occupation === 'string' && occupation.trim()) {
      return occupation;
    }
    return 'Não informado';
  }

  function formatGender(gender) {
    if (typeof gender === 'string' && gender.trim()) {
      const normalized = gender.trim().toLowerCase();

      if (normalized === 'male' || normalized === 'homem') {
        return 'Homem';
      }

      if (normalized === 'female' || normalized === 'woman' || normalized === 'mulher') {
        return 'Mulher';
      }

      return capitalizeFirstLetter(gender.trim());
    }

    return 'Não informado';
  }

  function formatStatus(status, gender) {
    if (typeof status === 'string' && status.trim()) {
      const normalized = status.trim().toLowerCase();

      if (normalized === 'alive') {
        return capitalizeFirstLetter(isFemaleGender(gender) ? 'viva' : 'vivo');
      }

      if (normalized === 'deceased') {
        return capitalizeFirstLetter(
          isFemaleGender(gender) ? 'morta' : 'morto'
        );
      }

      return capitalizeFirstLetter(status.trim());
    }
    return 'Desconhecido';
  }

  function getStatusClass(status) {
    if (typeof status !== 'string') {
      return '';
    }

    const normalized = status.trim().toLowerCase();
    if (normalized === 'alive') {
      return 'status-alive';
    }

    if (normalized === 'deceased') {
      return 'status-deceased';
    }

    return '';
  }

  function selectQuote(phrases) {
    if (typeof phrases === 'string') {
      return phrases;
    }

    if (Array.isArray(phrases) && phrases.length) {
      const preferred = phrases.find(
        (phrase) => typeof phrase === 'string' && phrase.length <= 120
      );

      return preferred ?? phrases.find((phrase) => typeof phrase === 'string');
    }

    return null;
  }

  function isFemaleGender(gender) {
    if (typeof gender !== 'string') {
      return false;
    }

    const normalized = gender.trim().toLowerCase();
    return normalized === 'female' || normalized === 'mulher' || normalized === 'feminino';
  }

  function capitalizeFirstLetter(text) {
    if (typeof text !== 'string' || !text.length) {
      return text;
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function setupModalEvents() {
    if (!imageModal) {
      return;
    }

    modalCloseElements.forEach((element) => {
      element.addEventListener('click', closeImageModal);
    });

    imageModal.addEventListener('click', (event) => {
      if (event.target === imageModal) {
        closeImageModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isModalVisible()) {
        closeImageModal();
      }
    });
  }

  function openImageModal(character) {
    if (!imageModal || !modalImage || !modalCaption) {
      return;
    }

    lastFocusedElement = document.activeElement;

    modalImage.src = buildPortraitUrl(character.portrait_path, 1280);
    modalImage.alt = character.name ?? 'Personagem de Os Simpsons';
    modalCaption.textContent = character.name ?? 'Personagem de Os Simpsons';

    imageModal.classList.add('is-visible');
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const closeButton = imageModal.querySelector('.modal-close');
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeImageModal() {
    if (!imageModal || !modalImage || !modalCaption) {
      return;
    }

    imageModal.classList.remove('is-visible');
    imageModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    modalImage.src = '';
    modalCaption.textContent = '';

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function isModalVisible() {
    return imageModal?.classList.contains('is-visible');
  }
});

