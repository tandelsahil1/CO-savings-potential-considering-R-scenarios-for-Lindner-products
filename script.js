let typeData = [];
let dataCSV = [];
let descriptionData = [];
let currentLang = "en"; // default language

const bereichSelect = document.getElementById("bereich");
const categorySelect = document.getElementById("category");
const productSelect = document.getElementById("producttyp");
const chartContainer = document.getElementById("chart");
const scenarioDescriptions = document.getElementById("scenarioDescriptions");
const langToggle = document.getElementById("langToggle");

// Clean CSV text
const clean = s => (s || "").replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();

// ---------- COLORS ----------
const scenarioColors = {
  "Reuse same location": ["#43a047", "#a5d6a7"],
  "Reuse diff location": ["#43a047", "#a5d6a7"],
  "Repair same location": ["#fb8c00", "#ffe0b2"],
  "Repair diff location": ["#fb8c00", "#ffe0b2"],
  "Refurbish": ["#1e88e5", "#90caf9"],
  "Repurpose": ["#8e24aa", "#ce93d8"],
  "Recycle": ["#546e7a", "#cfd8dc"],
  "Redistribute": ["#78909c", "#eceff1"]
};

// ---------- TRANSLATIONS ----------
const translations = {
  en: {
    header_title: "CO₂ savings potential considering R-scenarios for Lindner products",
    header_subtitle: "Circularity & reuse potential overview",
    label_bereich: "Area",
    label_category: "Category",
    label_product: "Product type",
    placeholder_bereich: "Select Bereich",
    placeholder_category: "Select Category",
    placeholder_product: "Select Product"
  },
  de: {
    header_title: "CO₂-Einsparpotenzial unter Berücksichtigung von R-Szenarien für Lindner-Produkte",
    header_subtitle: "Übersicht über Zirkularität & Wiederverwendungspotenzial",
    label_bereich: "Bereich",
    label_category: "Kategorie",
    label_product: "Produkttyp",
    placeholder_bereich: "Bereich auswählen",
    placeholder_category: "Kategorie auswählen",
    placeholder_product: "Produkt auswählen"
  }
};

// ---------- SCENARIO TITLES ----------
const scenarioTitles = {
  en: {
    "Reuse same location": "ReUSE same location",
    "Reuse diff location": "ReUSE different location",
    "Repair same location": "RePAIR same location",
    "Repair diff location": "RePAIR different location",
    "Refurbish": "ReFURBISH",
    "Repurpose": "RePURPOSE",
    "Recycle": "ReCYCLE",
    "Redistribute": "ReDISTRIBUTE"
  },
  de: {
    "Reuse same location": "ReUSE am gleichen Ort",
    "Reuse diff location": "ReUSE am anderem Ort",
    "Repair same location": "RePAIR am gleichen Ort",
    "Repair diff location": "RePAIR am anderem Ort",
    "Refurbish": "ReFURBISH",
    "Repurpose": "RePURPOSE",
    "Recycle": "ReCYCLE",
    "Redistribute": "RReDISTRIBUTE"
  }
};

// ---------- LOAD DATA ----------
Promise.all([
  fetch("type.csv").then(r => r.text()),
  fetch("data.csv").then(r => r.text()),
  fetch("description.csv").then(r => r.text())
]).then(([typeText, dataText, descText]) => {
  typeData = Papa.parse(typeText, { header: true, skipEmptyLines: true }).data;
  dataCSV = Papa.parse(dataText, { header: true, skipEmptyLines: true }).data;
  descriptionData = Papa.parse(descText, { header: true, skipEmptyLines: true }).data;
  initBereich();
});

// ---------- DROPDOWNS ----------
function resetSelect(select, placeholderKey) {
  select.innerHTML = `<option value="" selected disabled>${translations[currentLang][placeholderKey]}</option>`;
  select.disabled = true;
}

function initBereich() {
  resetSelect(bereichSelect, "placeholder_bereich");
  resetSelect(categorySelect, "placeholder_category");
  resetSelect(productSelect, "placeholder_product");

  [...new Set(typeData.map(d => clean(d.bereich)))].forEach(b =>
    bereichSelect.add(new Option(b, b))
  );

  bereichSelect.disabled = false;
}

bereichSelect.addEventListener("change", () => {
  resetSelect(categorySelect, "placeholder_category");
  resetSelect(productSelect, "placeholder_product");
  chartContainer.innerHTML = "";
  scenarioDescriptions.innerHTML = "";

  [...new Set(
    typeData
      .filter(d => clean(d.bereich) === bereichSelect.value)
      .map(d => clean(d.category))
  )].forEach(c => categorySelect.add(new Option(c, c)));

  categorySelect.disabled = false;
});

categorySelect.addEventListener("change", () => {
  resetSelect(productSelect, "placeholder_product");
  chartContainer.innerHTML = "";
  scenarioDescriptions.innerHTML = "";

  [...new Set(
    typeData
      .filter(d =>
        clean(d.bereich) === bereichSelect.value &&
        clean(d.category) === categorySelect.value
      )
      .map(d => clean(d.producttyp))
  )].forEach(p => productSelect.add(new Option(p, p)));

  productSelect.disabled = false;
});

productSelect.addEventListener("change", drawCharts);

// ---------- LANGUAGE TOGGLE ----------
langToggle.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "de" : "en";
  langToggle.textContent = currentLang === "en" ? "DE" : "EN";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = translations[currentLang][el.dataset.i18n];
  });

  drawCharts();
});

// ---------- CHARTS + DESCRIPTION ----------
function drawCharts() {
  chartContainer.innerHTML = "";
  scenarioDescriptions.innerHTML = "";

  const row = dataCSV.find(d =>
    clean(d.bereich) === bereichSelect.value &&
    clean(d.category) === categorySelect.value &&
    clean(d.producttyp) === productSelect.value
  );

  if (!row) return;

  const keys = [
    "Reuse same location",
    "Reuse diff location",
    "Repair same location",
    "Repair diff location",
    "Refurbish",
    "Repurpose",
    "Recycle",
    "Redistribute"
  ];

  const total = parseFloat(row.chartvalue) || 1;

  const scenarioMap = {
    "Reuse same location": "Reuse",
    "Reuse diff location": "Reuse2",
    "Repair same location": "Repair",
    "Repair diff location": "Repair2",
    "Refurbish": "Refurbish",
    "Repurpose": "Repurpose",
    "Recycle": "Recycle",
    "Redistribute": "Redistribute"
  };

  keys.forEach(key => {
    const raw = parseFloat(row[key]);
    if (!Number.isFinite(raw)) return;

    const rawPercent = Math.max(0, Math.min(100, (raw / total) * 100));
    const bigPercent = rawPercent >= 50 ? rawPercent : 100 - rawPercent;
    const colors = scenarioColors[key];

    const div = document.createElement("div");
    div.className = "chart-box";
    chartContainer.appendChild(div);

    const title = scenarioTitles[currentLang][key];

    // Plotly Pie Chart
    Plotly.newPlot(div, [{
      type: "pie",
      hole: 0.65,
      values: [0, 100],
      labels: ["", ""],
      hoverinfo: "skip",
      textinfo: "none",
      marker: { colors },
      sort: false,
      showlegend: false
    }], {
      title: { text: `<b>${title}</b>`, x: 0.5 },
      annotations: [{
        text: "0%",
        font: { size: 26 },
        showarrow: false,
        x: 0.5,
        y: 0.5
      }],
      height: 240,
      margin: { t: 40, b: 0, l: 0, r: 0 },
      paper_bgcolor: "transparent"
    }, { displayModeBar: false })
    .then(() => {
      let frame = 0;
      const frames = 60; // 60 FPS
      const step = bigPercent / frames;

      const interval = setInterval(() => {
        frame++;
        const current = Math.min(step * frame, bigPercent);

        Plotly.restyle(div, "values", [[current, 100 - current]]);
        Plotly.relayout(div, { "annotations[0].text": `${Math.round(current)}%` });

        if (frame >= frames) clearInterval(interval);
      }, 1000 / 60);
    });

    // ---------- DESCRIPTION WITH COLOR INDICATOR ----------
    const scenarioKey = scenarioMap[key];
    const descRow = descriptionData.find(d => clean(d.Scenario) === scenarioKey);
    if (descRow) {
      const text = currentLang === "en" ? descRow.Description : descRow.Description_DE;
      const divDesc = document.createElement("div");
      divDesc.className = "scenario";

      // Color indicator
      const colorBox = `<span style="
        display:inline-block;
        width:14px;
        height:14px;
        background-color:${colors[0]};
        margin-right:8px;
        border-radius:3px;
        vertical-align:middle;
      "></span>`;

      divDesc.innerHTML = `<h3>${colorBox}${title}</h3><p>${text}</p>`;
      scenarioDescriptions.appendChild(divDesc);
    }
  });
}
