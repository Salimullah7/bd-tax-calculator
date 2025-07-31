const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

function getExemption(category) {
  switch (category) {
    case "senior": return 425000;
    case "disabled": return 500000;
    case "freedomFighter": return 525000;
    case "guardian": return 450000;
    default: return 350000;
  }
}

function calculateRebate(income, investment) {
  const oneThird = income / 3;
  const eligibleBase = (oneThird >= 450000) ? (2 * income) / 3 : income;
  const allowableInvestment = Math.min(eligibleBase * 0.15, investment);
  return allowableInvestment * 0.15;
}

function applyTaxSlabs(taxableIncome) {
  const slabs = [
    { limit: 100000, rate: 0.10 },
    { limit: 400000, rate: 0.15 },
    { limit: 500000, rate: 0.20 },
    { limit: 2000000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 }
  ];
  let remaining = taxableIncome;
  let totalTax = 0;
  const breakdown = [];
  for (const slab of slabs) {
    const applicable = Math.min(remaining, slab.limit);
    const slabTax = applicable * slab.rate;
    breakdown.push({ amount: applicable, rate: slab.rate * 100, tax: slabTax });
    totalTax += slabTax;
    remaining -= applicable;
    if (remaining <= 0) break;
  }
  return { totalTax: Math.round(totalTax), breakdown };
}

app.post('/calculate', async (req, res) => {
  const { income, investment, email, category } = req.body;
  const exemption = getExemption(category);
  const rebate = calculateRebate(income, investment);
  const taxableIncome = Math.max(income - exemption - rebate, 0);
  const { totalTax, breakdown } = applyTaxSlabs(taxableIncome);

  const report = `
  Total Income: ৳${income.toLocaleString()}
  Taxpayer Category: ${category}
  Exemption: ৳${exemption.toLocaleString()}
  Investment Rebate: ৳${Math.round(rebate).toLocaleString()}
  Taxable Income: ৳${taxableIncome.toLocaleString()}
  Total Tax Payable: ৳${totalTax.toLocaleString()}

  Breakdown:
  ${breakdown.map(b => `৳${b.amount.toLocaleString()} @ ${b.rate}% = ৳${b.tax.toLocaleString()}`).join('\n  ')}
  `;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `BD Tax App <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Your Bangladesh Tax Calculation Report',
    text: report
  });

res.json({ message: `✅ Tax report emailed to ${email}` });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Server running on port 3000');
});
