// Change this to your PythonAnywhere URL after deployment
// For now keep it as localhost for local testing
const BASE_URL = "http://localhost:5000";

let chart = null;

async function loadStock() {
  const ticker = document.getElementById("tickerInput").value.toUpperCase().trim();
  if (!ticker) return;

  try {
    // Fetch all data in parallel
    const [historyRes, priceRes, infoRes] = await Promise.all([
      fetch(`${BASE_URL}/stock/history/${ticker}`),
      fetch(`${BASE_URL}/stock/price/${ticker}`),
      fetch(`${BASE_URL}/stock/info/${ticker}`)
    ]);

    const history = await historyRes.json();
    const price = await priceRes.json();
    const info = await infoRes.json();

    // Update stock info section
    document.getElementById("stockName").textContent = info.name;
    document.getElementById("stockPrice").textContent = `Current Price: $${price.price}`;
    document.getElementById("stockSector").textContent = `Sector: ${info.sector}`;
    document.getElementById("stockInfo").style.display = "block";

    // Render chart
    renderChart(history.dates, history.prices, ticker);

  } catch (err) {
    console.error("Error loading stock:", err);
  }
}

function renderChart(labels, data, ticker) {
  const ctx = document.getElementById("priceChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `${ticker} Price (3mo)`,
        data: data,
        borderColor: "#4ade80",
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e0e0e0" } }
      },
      scales: {
        x: { ticks: { color: "#aaa" }, grid: { color: "#222" } },
        y: { ticks: { color: "#aaa" }, grid: { color: "#222" } }
      }
    }
  });
}

// Allow pressing Enter to search
document.getElementById("tickerInput")
  .addEventListener("keypress", function(e) {
    if (e.key === "Enter") loadStock();
  });