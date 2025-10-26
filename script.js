const debtListEl = document.getElementById("debtList");
const addDebtBtn = document.getElementById("addDebtBtn");
const calculateBtn = document.getElementById("calculateBtn");
const scheduleContainer = document.getElementById("scheduleContainer");
const scheduleTableBody = document.querySelector("#scheduleTable tbody");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const csvFileInput = document.getElementById("csvFileInput");
const clearDebtsBtn = document.getElementById("clearDebtsBtn");
const monthlyBudgetInput = document.getElementById("monthlyBudget");

let debts = [];

function saveDebts() {
  localStorage.setItem("debts", JSON.stringify(debts));
}

function loadDebts() {
  const loaded = localStorage.getItem("debts");
  if (loaded) {
    debts = JSON.parse(loaded);
    renderDebts();
  }
}

function renderDebts() {
  debtListEl.innerHTML = "";
  debts.forEach((debt, i) => {
    const row = document.createElement("div");
    row.classList.add("debt-row");
    row.dataset.index = i;

    row.innerHTML = `
      <input type="text" class="debt-name" placeholder="Name" value="${debt.name}" />
      <input type="number" class="debt-balance" placeholder="Balance" value="${debt.balance.toFixed(2)}" min="0" step="0.01" />
      <input type="number" class="debt-apr" placeholder="APR (%)" value="${debt.apr.toFixed(2)}" min="0" step="0.01" />
      <input type="number" class="debt-min" placeholder="Min Payment" value="${debt.min.toFixed(2)}" min="0" step="0.01" />
      <input type="date" class="debt-start" placeholder="Start Date" value="${debt.startDate}" />
      <button class="remove-btn">Remove</button>
    `;

    row.querySelector(".remove-btn").addEventListener("click", () => {
      debts.splice(i, 1);
      saveDebts();
      renderDebts();
    });

    Array.from(row.querySelectorAll("input")).forEach(input => {
      input.addEventListener("input", () => {
        const idx = parseInt(row.dataset.index);
        debts[idx] = {
          name: row.querySelector(".debt-name").value,
          balance: parseFloat(row.querySelector(".debt-balance").value) || 0,
          apr: parseFloat(row.querySelector(".debt-apr").value) || 0,
          min: parseFloat(row.querySelector(".debt-min").value) || 0,
          startDate: row.querySelector(".debt-start").value
        };
        saveDebts();
      });
    });

    debtListEl.appendChild(row);
  });
}

function addDebt(debt = {name:"", balance:0, apr:0, min:0, startDate:""}) {
  debts.push(debt);
  saveDebts();
  renderDebts();
}

addDebtBtn.addEventListener("click", () => addDebt());

clearDebtsBtn.addEventListener("click", () => {
  debts = [];
  saveDebts();
  renderDebts();
  scheduleContainer.style.display = "none";
  downloadCsvBtn.disabled = true;
});

csvFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target.result;
    parseCSV(text);
  };
  reader.readAsText(file);
  // Reset input for next upload
  csvFileInput.value = "";
});

function parseCSV(text) {
  const lines = text.trim().split("
");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const debtsFromCsv = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    let debt = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      let val = values[j] ? values[j].trim() : "";
      if (["balance","apr","min"].includes(key)) val = parseFloat(val) || 0;
      if (key === "startdate") val = val || "";
      debt[key] = val;
    }
    if(debt.name) debtsFromCsv.push(debt);
  }
  debts = debtsFromCsv;
  saveDebts();
  renderDebts();
}

function calculateSchedule() {
  if (debts.length === 0) {
    alert("Please add at least one debt.");
    return;
  }
  const monthlyBudget = parseFloat(monthlyBudgetInput.value);
  if (monthlyBudget <= 0) {
    alert("Please enter a positive monthly budget.");
    return;
  }

  // Deep copy of debts for safe calculations
  let workingDebts = debts.map(d => ({
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    min: d.min,
    startDate: d.startDate
  }));

  // Calculate payoff month by month
  const schedule = [];
  let monthIndex = 0;
  let stop = false;

  while (!stop && monthIndex < 600) {
    let monthData = {month: monthIndex + 1, payments: [], totalPayment: 0, interestTotal: 0, principalTotal: 0, remainingTotal: 0};

    // Apply monthly interest: apr / 12 (%)
    workingDebts.forEach((debt, i) => {
      if (debt.balance > 0) {
        const monthlyInterest = debt.balance * (debt.apr / 100 / 12);
        debt.balance += monthlyInterest;
        monthData.interestTotal += monthlyInterest;
      }
    });

    // Calculate minimum payment totals
    let minPaymentTotal = 0;
    workingDebts.forEach(d => minPaymentTotal += (d.balance > 0 ? d.min : 0));

    if (minPaymentTotal > monthlyBudget) {
      alert("Monthly budget is less than sum of minimum payments. Adjust budget or debts.");
      return;
    }

    // Pay minimums first
    workingDebts.forEach(d => {
      if (d.balance > 0) {
        const pay = Math.min(d.min, d.balance);
        d.balance -= pay;
        monthData.payments.push(pay);
        monthData.totalPayment += pay;
        monthData.principalTotal += pay;
      } else {
        monthData.payments.push(0);
      }
    });

    // Apply leftover budget to debts in order of smallest balance first (snowball)
    let leftover = monthlyBudget - monthData.totalPayment;

    // Sort debts by balance ascending for snowball
    const sortedDebtIndexes = workingDebts.map((d,i) => i).sort((a,b) => workingDebts[a].balance - workingDebts[b].balance);

    for (const idx of sortedDebtIndexes) {
      const debt = workingDebts[idx];
      if (debt.balance > 0 && leftover > 0) {
        const payExtra = Math.min(debt.balance, leftover);
        debt.balance -= payExtra;
        monthData.payments[idx] += payExtra;
        monthData.totalPayment += payExtra;
        monthData.principalTotal += payExtra;
        leftover -= payExtra;
      }
    }

    // Round balances small negatives to zero
    workingDebts.forEach(d => {
      if (d.balance < 0) d.balance = 0;
    });

    // Collect remaining balances total
    workingDebts.forEach(d => {
      monthData.remainingTotal += d.balance;
    });

    schedule.push(monthData);
    monthIndex++;

    // Stop if all debts cleared
    if (workingDebts.every(d => d.balance === 0)) stop = true;
  }

  renderSchedule(schedule);
  downloadCsvBtn.disabled = false;
  downloadCsvBtn.schedule = schedule;
}

function renderSchedule(schedule) {
  scheduleTableBody.innerHTML = "";
  let totalPaid = 0;
  schedule.forEach(monthData => {
    const tr = document.createElement("tr");
    const paymentDetails = monthData.payments.map((p, i) => `${debts[i]?.name || "Debt"+(i+1)}: $${p.toFixed(2)}`).join(", ");

    tr.innerHTML = `
      <td style="text-align:center;">${monthData.month}</td>
      <td>${paymentDetails}</td>
      <td>$${monthData.interestTotal.toFixed(2)}</td>
      <td>$${monthData.principalTotal.toFixed(2)}</td>
      <td>$${monthData.remainingTotal.toFixed(2)}</td>
      <td>$${monthData.totalPayment.toFixed(2)}</td>
    `;
    scheduleTableBody.appendChild(tr);
    totalPaid += monthData.totalPayment;
  });
  document.getElementById("totalPaidFooter").textContent = `$${totalPaid.toFixed(2)}`;
  scheduleContainer.style.display = "block";
}

// CSV Download of schedule
downloadCsvBtn.addEventListener("click", () => {
  const schedule = downloadCsvBtn.schedule;
  if (!schedule) return;
  let csvContent = "Month,Payment Details,Interest Paid,Principal Paid,Remaining Balance,Total Monthly Cost
";
  schedule.forEach(m => {
    const paymentDetails = m.payments.map((p, i) => `${debts[i]?.name || 'Debt'+(i+1)}:$${p.toFixed(2)}`).join(" | ");
    csvContent += `${m.month},"${paymentDetails}",${m.interestTotal.toFixed(2)},${m.principalTotal.toFixed(2)},${m.remainingTotal.toFixed(2)},${m.totalPayment.toFixed(2)}
`;
  });
  const blob = new Blob([csvContent], {type: "text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "debt_payoff_schedule.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Initial load
loadDebts();