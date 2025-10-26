document.addEventListener('DOMContentLoaded', () => {
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

  // Render debts with editable inputs
  function renderDebts() {
    debtList.innerHTML = debts.map((d, i) => `
      <div>
        <strong>${d.prefix} - ${d.name}</strong><br/>
        Balance: <input type="number" step="0.01" class="balance" data-index="${i}" value="${d.balance}" /> &nbsp;
        APR: <input type="number" step="0.01" class="apr" data-index="${i}" value="${d.apr}" /> &nbsp;
        Min: <input type="number" step="0.01" class="minPay" data-index="${i}" value="${d.min}" />
      </div>
      <br/>
    `).join('');
    addInputListeners();
  }

  // Bind input fields to update data
  function addInputListeners() {
    document.querySelectorAll('.balance').forEach(input => {
      input.addEventListener('input', e => {
        const idx = +e.target.dataset.index;
        debts[idx].balance = parseFloat(e.target.value) || 0;
      });
    });
    document.querySelectorAll('.apr').forEach(input => {
      input.addEventListener('input', e => {
        const idx = +e.target.dataset.index;
        debts[idx].apr = parseFloat(e.target.value) || 0;
      });
    });
    document.querySelectorAll('.minPay').forEach(input => {
      input.addEventListener('input', e => {
        const idx = +e.target.dataset.index;
        debts[idx].min = parseFloat(e.target.value) || 0;
      });
    });
  }

  // Add new empty debt
  addDebtBtn.onclick = () => {
    debts.push({ prefix: "New", name: "Debt", balance: 0, apr: 0, min: 0 });
    renderDebts();
  };

  // Debt snowball calculation
  calculateBtn.onclick = () => {
    const monthlyBudget = parseFloat(monthlyBudgetInput.value);
    if (isNaN(monthlyBudget) || monthlyBudget <= 0) {
      alert("Please enter a valid monthly budget.");
      return;
    }

    // Clone and sort debts by balance ascending (standard snowball)
    let sorted = debts.filter(d => d.balance > 0)
      .map(d => ({ ...d }))
      .sort((a, b) => a.balance - b.balance);

    if (sorted.length === 0) {
      alert("Add some debts with balances to calculate.");
      return;
    }

    let month = 0;
    let totalInterest = 0;
    let totalPaid = 0;
    const schedule = [];
    const mathLog = [];
    let maxMonths = 600; // 50 years limit

    while (sorted.some(d => d.balance > 0) && month < maxMonths) {
      month++;
      let extra = monthlyBudget; // amount still available to pay this month
      mathLog.push(`Month ${month} calculation start with $${extra.toFixed(2)} budget`);

      // Reserve minimum payments first, subtract from extra
      for (const debt of sorted) {
        if (debt.balance <= 0) continue;
        extra -= debt.min;
        mathLog.push(`Reserve min $${debt.min.toFixed(2)} for ${debt.name}, budget left $${extra.toFixed(2)}`);
      }
      
      // Apply payments, snowball on lowest balance non-promo debt
      let targetIndex = sorted.findIndex(d => d.apr !== 0 && d.balance > 0);
      let target = (targetIndex !== -1) ? sorted[targetIndex] : null;

      // Calculate new month balances
      const monthBalances = [];

      for (let i = 0; i < sorted.length; i++) {
        let debt = sorted[i];
        if (debt.balance <= 0) {
          monthBalances.push(0);
          continue;
        }

        // Interest = balance * APR / 1200 (monthly rate)
        const interest = debt.balance * (debt.apr / 1200);
        totalInterest += interest;

        // Balance after interest added
        let due = debt.balance + interest;

        // Initial payment is minimum payment
        let payment = debt.min;

        // If this is the target debt (lowest balance non-promo), add snowball extra payment
        if (target && target === debt && extra > 0) {
          // Payment over min is limited by what settles debt: due - payment
          const snowball = Math.min(extra, due - payment);
          payment += snowball;
          extra -= snowball;
          mathLog.push(`Snowball payment $${snowball.toFixed(2)} to ${debt.name}`);
        }

        payment = Math.min(payment, due); // payment can't exceed due

        let newBalance = due - payment;
        totalPaid += payment;

        mathLog.push(`${debt.name} start: $${debt.balance.toFixed(2)}, interest: $${interest.toFixed(2)}, due: $${due.toFixed(2)}, pay: $${payment.toFixed(2)}, end: $${newBalance.toFixed(2)}`);

        debt.balance = newBalance;
        monthBalances.push(newBalance);
      }

      schedule.push({
        month,
        balances: monthBalances.map(b => Math.max(b, 0))
      });

      mathLog.push(`Month ${month} completed. Remaining debts: ${sorted.map(d => d.balance.toFixed(2)).join(", ")}`);
      mathLog.push("");
    }

    // Final summary
    const remainingDebt = sorted.reduce((acc, d) => acc + d.balance, 0);
    totalDebtEl.textContent = (remainingDebt > 0) ? remainingDebt.toFixed(2) : "0.00";
    payoffTimeEl.textContent = (month < maxMonths) ? `${month} months` : `Over ${maxMonths} months`;
    totalInterestEl.textContent = totalInterest.toFixed(2);
    totalPaidEl.textContent = totalPaid.toFixed(2);

    // Render amortization schedule table
    const headerRow = `<tr><th>Month</th>${sorted.map(d => `<th>${d.name}</th>`).join("")}</tr>`;
    const rows = schedule.map(s => `<tr><td>${s.month}</td>${s.balances.map(b => `<td>${b.toFixed(2)}</td>`).join("")}</tr>`).join("");
    scheduleTable.innerHTML = headerRow + rows;

    // Show math detail log
    mathDetails.textContent = mathLog.join("
");

    results.classList.remove("hidden");
  };

  renderDebts();
});