const STORAGE_KEY = 'demo.tasks.v1';
const HOUR_MS = 60 * 60 * 1000;

const FACTS = [
  'Honey never spoils — archaeologists have found 3,000-year-old honey that\'s still edible.',
  'Octopuses have three hearts, and two of them stop beating when they swim.',
  'A group of flamingos is called a "flamboyance."',
  'Bananas are berries, but strawberries aren\'t.',
  'The Eiffel Tower grows about 6 inches taller in summer due to heat expansion.',
  'Wombat poop is cube-shaped.',
  'Sharks existed before trees.',
  'A day on Venus is longer than a year on Venus.',
  'Sea otters hold hands while sleeping so they don\'t drift apart.',
  'The shortest war in history lasted 38 minutes.',
  'There are more possible chess games than atoms in the observable universe.',
  'Butterflies taste with their feet.',
];

const els = {
  composer: document.getElementById('composer'),
  input: document.getElementById('input'),
  list: document.getElementById('list'),
  summary: document.getElementById('summary'),
  fact: document.getElementById('fact'),
  clear: document.getElementById('clear'),
  filters: document.querySelectorAll('.filters__button'),
};

let tasks = load();
let filter = 'all';

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function visible() {
  if (filter === 'active') return tasks.filter((t) => !t.done);
  if (filter === 'done') return tasks.filter((t) => t.done);
  return tasks;
}

function render() {
  els.list.replaceChildren(...visible().map(toElement));

  const left = tasks.filter((t) => !t.done).length;
  els.summary.textContent = tasks.length === 0
    ? 'Nothing yet'
    : `${left} of ${tasks.length} remaining`;

  els.filters.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  });

  els.clear.hidden = !tasks.some((t) => t.done);
}

function toElement(task) {
  const item = document.createElement('li');
  item.className = task.done ? 'item item--done' : 'item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'item__checkbox';
  checkbox.checked = task.done;
  checkbox.id = `task-${task.id}`;
  checkbox.addEventListener('change', () => toggle(task.id));

  const label = document.createElement('label');
  label.className = 'item__label';
  label.htmlFor = checkbox.id;
  label.textContent = task.text;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'item__delete';
  remove.textContent = '×';
  remove.title = 'Delete';
  remove.setAttribute('aria-label', `Delete "${task.text}"`);
  remove.addEventListener('click', () => destroy(task.id));

  item.append(checkbox, label, remove);
  return item;
}

function add(text) {
  tasks.push({ id: crypto.randomUUID(), text, done: false });
  commit();
}

function toggle(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.done = !task.done;
  commit();
}

function destroy(id) {
  tasks = tasks.filter((t) => t.id !== id);
  commit();
}

function commit() {
  save();
  render();
}

function renderFact() {
  const hourIndex = Math.floor(Date.now() / HOUR_MS);
  els.fact.textContent = `Did you know? ${FACTS[hourIndex % FACTS.length]}`;
}

els.composer.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;
  add(text);
  els.input.value = '';
  els.input.focus();
});

els.clear.addEventListener('click', () => {
  tasks = tasks.filter((t) => !t.done);
  commit();
});

els.filters.forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    render();
  });
});

render();
renderFact();
setInterval(renderFact, 60 * 1000);
