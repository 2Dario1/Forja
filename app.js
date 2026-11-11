const categories = [
  {
    id: "arduino",
    categoria: "Arduino",
    productos: ["Arduino UNO R3", "Arduino Nano", "Kits Arduino"],
    image: "images/arduino.svg"
  },
  {
    id: "raspberry-pi",
    categoria: "Raspberry Pi",
    productos: ["Raspberry Pi 4", "Raspberry Pi 5", "Fuentes", "Tarjetas microSD"],
    image: "images/raspberry-pi.svg"
  },
  {
    id: "impresion-3d",
    categoria: "Impresión 3D",
    productos: ["Impresoras 3D", "Filamento PLA", "Boquillas"],
    image: "images/impresion-3d.svg"
  },
  {
    id: "herramientas",
    categoria: "Herramientas",
    productos: ["Multímetro", "Cautín", "Pinzas", "Destornilladores"],
    image: "images/herramientas.svg"
  },
  {
    id: "robotica",
    categoria: "Robótica",
    productos: ["Sensores", "Servomotores", "Motores", "Módulos"],
    image: "images/robotica.svg"
  },
  {
    id: "electronica",
    categoria: "Electrónica",
    productos: ["Protoboards", "Resistencias", "LEDs", "Cables Dupont"],
    image: "images/electronica.svg"
  },
  {
    id: "kits",
    categoria: "Kits",
    productos: ["Kit de electrónica", "Kit de robótica", "Kit Arduino"],
    image: "images/kits.svg"
  }
];

const grid = document.querySelector("#category-grid");
const search = document.querySelector("#category-search");
const emptyState = document.querySelector("#empty-state");

function createCategoryCard(category) {
  const card = document.createElement("article");
  card.className = "category-card";

  const image = document.createElement("img");
  image.className = "category-card__image";
  image.src = category.image;
  image.alt = `Ilustración de ${category.categoria}`;
  image.loading = "lazy";
  image.width = 480;
  image.height = 270;

  const content = document.createElement("div");
  content.className = "category-card__content";

  const topline = document.createElement("div");
  topline.className = "category-card__topline";

  const title = document.createElement("h3");
  title.textContent = category.categoria;

  const count = document.createElement("span");
  count.className = "category-card__count";
  count.textContent = `${String(category.productos.length).padStart(2, "0")} opciones`;

  const products = document.createElement("ul");
  products.className = "category-card__products";

  for (const product of category.productos) {
    const item = document.createElement("li");
    item.textContent = product;
    products.append(item);
  }

  topline.append(title, count);
  content.append(topline, products);
  card.append(image, content);
  return card;
}

function renderCategories(query = "") {
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredCategories = categories.filter((category) => {
    const searchableText = `${category.categoria} ${category.productos.join(" ")}`.toLocaleLowerCase("es");
    return searchableText.includes(normalizedQuery);
  });

  grid.replaceChildren(...filteredCategories.map(createCategoryCard));
  emptyState.hidden = filteredCategories.length > 0;
}

search.addEventListener("input", (event) => {
  renderCategories(event.currentTarget.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
});

renderCategories();
