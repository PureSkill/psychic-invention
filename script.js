document.addEventListener('DOMContentLoaded', () => {
  // DOM bindings
  const calculateBtn = document.getElementById('calculateBtn');
  const debtList = document.getElementById('debtList');
  const results = document.getElementById('results');
  const scheduleTable = document.getElementById('scheduleTable');
  const mathDetails = document.getElementById('mathDetails');
  const totalDebtEl = document.getElementById('totalDebt');
  const payoffTimeEl = document.getElementById('payoffTime');
  const totalInterestEl = document.getElementById('totalInterest');
  const totalPaidEl = document.getElementById('totalPaid');
  const monthlyBudgetInput = document.getElementById('monthlyBudget');
  const addDebtBtn = document.getElementById('addDebt');

  let debts = [
    { prefix:"Retail", name:"Kohls", balance:387.89, apr:30, min:29.00 },
    { prefix:"Credit", name:"Aspire", balance:604.03, apr:30, min:71.85 },
    { prefix:"Credit", name:"Discover", balance:641.63, apr:30, min:25.00 },
    { prefix:"Loan", name:"Affirm", balance:683.74, apr:30, min:68.61 },
    { prefix:"Credit", name:"Indigo", balance:1009.22, apr:30, min:50.00 },
    { prefix:"Credit", name:"Credit 1", balance:1438.33, apr:30, min:50.00 },
    { prefix:"Loan", name:"AVANT", balance:1542.72, apr:30, min:59.84 },
    { prefix:"Promo", name:"BACKERWENCE", balance:999.73, apr:0, min:71.41 },
    { prefix:"Promo", name:"MCSUS.COM", balance:736.59, apr:0, min:49.11 },
    { prefix:"Promo", name:"HOTELS 1", balance:350.09, apr:0, min:23.34 },
    { prefix:"Promo", name:"HOTELS 2", balance:188.79, apr:0, min:12.59 },
    { prefix:"Promo", name:"HOTELS 3", balance:367.62, apr:0, min:24.51 }
  ];

  // Function to render debts in debtList div
  function renderDebts() {
    debtList.innerHTML = debts.map((d, i) => `
      <div>
        <strong>${d.prefix} - ${d.name}</strong><br/>
        Balance: <input type="number" step="0.01" class="balance" data-index="${i}" value="${d.balance}" /> &nbsp;&nbsp;
        APR: <input type="number" step="0.01" class="apr" data-index="${i}" value="${d.apr}" /> &nbsp;&nbsp;
        Min: <input type="number" step="0.01" class="minPay" data-index="${i}" value="${d.min}" />
      </div>
    `).join('');
    addInputListeners();
  }

  // Update debt objects when inputs change
  function addInputListeners() {
    const balances = document.querySelectorAll('.balance');
    const aprs = document.querySelectorAll('.apr');
    const mins = document.querySelectorAll('.minPay');

    balances.forEach(input => input.addEventListener('input', e => {
      const idx = +e.target.dataset.index;
      debts[idx].balance = parseFloat(e.target.value) || 0;
    }));
    aprs.forEach(input => input.addEventListener('input', e => {
      const idx = +e.target.dataset.index;
      debts[idx].apr = parseFloat(e.target.value) || 0;
    }));
    mins.forEach(input => input.addEventListener('input', e => {
      const idx = +e.target.dataset.index;
      debts[idx].min = parseFloat(e.target.value) || 0;
    }));
  }
  
  // Add new debt (empty)
  addDebtBtn.onclick = () => {
    debts.push({ prefix: "New", name: "Debt", balance: 0, apr: 0, min: 0 });
    renderDebts();
  }

  // Calculation function (placeholder, replace with full debt snowball logic)
  calculateBtn.onclick = () => {
    const monthlyBudget = parseFloat(monthlyBudgetInput.value);
    if (isNaN(monthlyBudget) || monthlyBudget <= 0) {
      alert("Please enter a valid monthly budget.");
      return;
    }

    // Example calculation - total debt sum and minimal payments sum
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.min, 0);

    // For demo, just show sums in results
    totalDebtEl.textContent = totalDebt.toFixed(2);
    totalInterestEl.textContent = "Calculated in full version...";
    totalPaidEl.textContent = "Calculated in full version...";
    payoffTimeEl.textContent = "Calculated in full version...";

    results.classList.remove('hidden');
  };

  // Initial render of debts
  renderDebts();
});