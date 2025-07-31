document.getElementById('taxForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const income = parseFloat(document.getElementById('income').value);
  const investment = parseFloat(document.getElementById('investment').value);
  const email = document.getElementById('email').value;
  const category = document.getElementById('userType').value;

  const res = await fetch('/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ income, investment, email, category })
  });

  const data = await res.json();
  document.getElementById('result').innerHTML = data.message;
});