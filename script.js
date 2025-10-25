document.addEventListener('DOMContentLoaded',()=>{
  const calculateBtn=document.getElementById('calculateBtn');
  const debtList=document.getElementById('debtList');
  const results=document.getElementById('results');
  const scheduleTable=document.getElementById('scheduleTable');

  const debts=[
    {name:'Kohls',balance:387.89,apr:30,min:29},
    {name:'Aspire',balance:604.03,apr:30,min:71.85},
    {name:'Discover',balance:641.63,apr:30,min:25},
    {name:'Affirm',balance:683.74,apr:30,min:68.61},
    {name:'Indigo',balance:1009.22,apr:30,min:50},
    {name:'Credit 1',balance:1438.33,apr:30,min:50},
    {name:'AVANT',balance:1542.72,apr:30,min:59.84},
    {name:'BACKERWENCE',balance:999.73,apr:0,min:71.41},
    {name:'MCSUS.COM',balance:736.59,apr:0,min:49.11},
    {name:'HOTELS 1',balance:350.09,apr:0,min:23.34},
    {name:'HOTELS 2',balance:188.79,apr:0,min:12.59},
    {name:'HOTELS 3',balance:367.62,apr:0,min:24.51}
  ];

  const renderDebts=()=>{
    debtList.innerHTML=debts.map(d=>`<div>${d.name}: $${d.balance.toFixed(2)} (${d.apr}% APR)</div>`).join('');
  };
  renderDebts();

  calculateBtn.addEventListener('click',()=>{
    const monthlyBudget=parseFloat(document.getElementById('monthlyBudget').value)||0;
    let sorted=[...debts].sort((a,b)=>a.balance-b.balance);
    let month=0,totalInterest=0,totalPaid=0;
    const schedule=[];

    while(sorted.some(d=>d.balance>0)&&month<600){
      month++;
      let extra=monthlyBudget;
      for(const debt of sorted){
        if(debt.balance<=0) continue;
        const interest=debt.balance*(debt.apr/1200);
        const payment=Math.min(debt.balance+interest,debt.min+extra);
        extra-=Math.max(0,payment-debt.min);
        debt.balance=Math.max(0,+((debt.balance+interest)-payment).toFixed(2));
        totalInterest+=interest; totalPaid+=payment;
      }
      schedule.push({month:month,balances:sorted.map(d=>d.balance)});
    }

    results.classList.remove('hidden');
    scheduleTable.innerHTML=`<tr><th>Month</th>${sorted.map(d=>`<th>${d.name}</th>`).join('')}</tr>`+
      schedule.map(s=>`<tr><td>${s.month}</td>${s.balances.map(b=>`<td>$${b.toFixed(2)}</td>`).join('')}</tr>`).join('');
  });
});