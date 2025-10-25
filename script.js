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

  // ✅ Pre‑loaded debts (complete dataset with promos)
  const debts = [
    { prefix:"Retail", name:"Kohls", balance:387.89, apr:30, min:29.00 },
    { prefix:"Credit", name:"Aspire", balance:604.03, apr:30, min:71.85 },
    { prefix:"Credit", name:"Discover", balance:641.63, apr:30, min:25.00 },
    { prefix:"Loan", name:"Affirm", balance:683.74, apr:30, min:68.61 },
    { prefix:"Credit", name:"Indigo", balance:1009.22, apr:30, min:50.00 },
    { prefix:"Credit", name:"Credit 1", balance:1438.33, apr:30, min:50.00 },
    { prefix:"Loan", name:"AVANT", balance:1542.72, apr:30, min:59.84 },
    { prefix:"Promo", name:"BACKERWENCE", balance:999.73, apr:0, min:71.41 },
    { prefix:"Promo", name:"MCSUS.COM", balance:736.59, apr:0, min:49.11 },
    { prefix:"Promo", name:"HOTELS 1", balance:350.09, apr:0, min:23.34 },
    { prefix:"Promo", name:"HOTELS 2", balance:188.79, apr:0, min:12.59 },
    { prefix:"Promo", name:"HOTELS 3", balance:367.62, apr:0, min:24.51 }
  ];

  // Display debts with richer details
  const renderDebts = () => {
    debtList.innerHTML = debts.map(d =>
      `<div><strong>${d.prefix}</strong> – ${d.name}: $${d.balance.toFixed(2)} `
      + `(${d.apr}% APR, Min $${d.min.toFixed(2)})</div>`).join('');
  };
  renderDebts();

  // Core calculation
  calculateBtn.addEventListener('click', () => {

    const monthlyBudget = Number(document.getElementById('monthlyBudget').value) || 0;
    let sorted = [...debts].sort((a,b)=>a.balance-b.balance);
    let month=0,totalInterest=0,totalPaid=0;
    const schedule=[]; let mathLog="";

    while(sorted.some(d=>d.balance>0)&&month<600){
      month++;
      let extra = monthlyBudget;
      let monthLog = `Month ${month}:
`;

      // Reserve minimums first
      for(const d of sorted){ if(d.balance>0) extra -= d.min; }

      // Apply interest + payments
      for(const debt of sorted){
        if(debt.balance<=0) continue;
        const interest = debt.balance * (debt.apr/1200);
        const due = debt.balance + interest;
        let payment = Math.min(due, debt.min);
        const isPromo = debt.apr===0;

        const target = sorted.find(d=>d.balance>0 && d.apr>0);

        // Apply snowball only to first non‑promo
        if(!isPromo && target && debt===target && extra>0){
          const snowball = Math.min(extra, due - payment);
          payment += snowball;
          extra -= snowball;
          monthLog += ` ➤ Snowball → ${debt.name} +$${snowball.toFixed(2)}
`;
        }

        const newBal = Math.max(0,(due-payment).toFixed(2));
        monthLog += ` ${debt.name}: Start $${debt.balance.toFixed(2)} +Int $${interest.toFixed(2)} = $${due.toFixed(2)}
`;
        monthLog += `    Pay $${payment.toFixed(2)} → End $${newBal}
`;

        debt.balance = +newBal;
        totalInterest += interest; 
        totalPaid += payment;
      }

      schedule.push({month, balances:sorted.map(d=>d.balance)});
      mathLog += monthLog + "
";
    }

    // Summary output
    const remaining = sorted.reduce((s,d)=>s+d.balance,0);
    totalDebtEl.textContent = `$${remaining.toFixed(2)}`;
    payoffTimeEl.textContent = `${month} months`;
    totalInterestEl.textContent = `$${totalInterest.toFixed(2)}`;
    totalPaidEl.textContent = `$${totalPaid.toFixed(2)}`;

    results.classList.remove('hidden');
    scheduleTable.innerHTML =
      `<tr><th>Month</th>${sorted.map(d=>`<th>${d.name}</th>`).join('')}</tr>` +
      schedule.map(s=>`<tr><td>${s.month}</td>${s.balances.map(b=>`<td>$${b.toFixed(2)}</td>`).join('')}</tr>`).join('');
    mathDetails.textContent = mathLog;
  });
});