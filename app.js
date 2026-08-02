const STORAGE_KEY = 'demo.tasks.v1';
const UNDO_MS = 7000;
const CONFETTI_COUNT = 28;
const CONFETTI_COLORS = ['#2563eb', '#c85a3c', '#f5c451', '#3fa96b', '#8b5cf6', '#ec4899'];
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
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  undo: document.getElementById('undo'),
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
  checkbox.addEventListener('change', () => toggle(task.id, checkbox));

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

function toggle(id, origin) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  task.done = !task.done;

  // Capture the origin before commit() re-renders the list out from under it.
  const rect = task.done && origin ? origin.getBoundingClientRect() : null;
  commit();
  if (rect) burst(rect);
}

function destroy(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  stage(`Deleted "${clip(task.text)}"`);
  tasks = tasks.filter((t) => t.id !== id);
  commit();
}

function commit() {
  save();
  render();
}

/* Undo */

let undoSnapshot = null;
let undoTimer = null;

// Snapshot before the caller mutates `tasks`, so undo restores order too.
function stage(message) {
  undoSnapshot = tasks.map((task) => ({ ...task }));

  els.toastMessage.textContent = message;
  els.toast.hidden = false;

  clearTimeout(undoTimer);
  undoTimer = setTimeout(dismiss, UNDO_MS);
}

function undo() {
  if (!undoSnapshot) return;
  tasks = undoSnapshot;
  dismiss();
  commit();
}

function dismiss() {
  clearTimeout(undoTimer);
  undoSnapshot = null;
  els.toast.hidden = true;
}

function clip(text) {
  return text.length > 32 ? `${text.slice(0, 32)}…` : text;
}

/* Confetti */

function burst(rect) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = confettiLayer();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    layer.append(piece(x, y));
  }
}

function confettiLayer() {
  let layer = document.querySelector('.confetti');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'confetti';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
  }
  return layer;
}

function piece(x, y) {
  const el = document.createElement('span');
  el.className = 'confetti__piece';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${between(5, 9)}px`;
  el.style.height = `${between(7, 13)}px`;
  el.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  if (Math.random() < 0.35) el.style.borderRadius = '50%';

  // Mostly upward, fanning out to either side.
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
  const distance = between(90, 230);

  const animation = el.animate(
    arc(Math.cos(angle) * distance, Math.sin(angle) * distance, between(380, 660), between(-540, 540)),
    { duration: between(900, 1500), easing: 'linear', fill: 'forwards' },
  );
  animation.addEventListener('finish', () => el.remove());

  return el;
}

function arc(dx, dy, drop, spin) {
  const steps = 14;
  return Array.from({ length: steps + 1 }, (_, step) => {
    const t = step / steps;
    return {
      offset: t,
      transform: `translate(-50%, -50%) translate(${dx * t}px, ${dy * t + drop * t * t}px) rotate(${spin * t}deg)`,
      opacity: t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35,
    };
  });
}

function between(min, max) {
  return min + Math.random() * (max - min);
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
  const count = tasks.filter((t) => t.done).length;
  if (!count) return;

  stage(`Cleared ${count} completed ${count === 1 ? 'task' : 'tasks'}`);
  tasks = tasks.filter((t) => !t.done);
  commit();
});

els.undo.addEventListener('click', undo);

document.addEventListener('keydown', (event) => {
  // Leave the composer's own text undo alone.
  if (event.target === els.input) return;

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && undoSnapshot) {
    event.preventDefault();
    undo();
  }
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
