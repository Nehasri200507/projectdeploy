const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { users: [], transactions: [], budgets: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ message: 'Missing auth token' });

  const data = loadData();
  const user = data.users.find(u => u.token === token);
  if (!user) return res.status(401).json({ message: 'Invalid auth token' });

  req.user = user;
  req.data = data;
  next();
}

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const data = loadData();
  if (data.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = {
    id: randomUUID(),
    name,
    email,
    password,
    token: randomUUID(),
  };

  data.users.push(newUser);
  saveData(data);

  const { token, id } = newUser;
  res.status(201).json({ data: { token, id, name, email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const data = loadData();
  const user = data.users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ data: { token: user.token, id: user.id, name: user.name, email: user.email } });
});

app.get('/api/transactions/month', authMiddleware, (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const data = loadData();
  const transactions = data.transactions.filter(
    tx => tx.userId === req.user.id && tx.month === month && tx.year === year
  );

  res.json({ data: transactions });
});

app.post('/api/transactions', authMiddleware, (req, res) => {
  const { description, amount, date, category, type, note } = req.body || {};
  if (!description || !amount || !date || !category || !type) {
    return res.status(400).json({ message: 'Missing transaction data' });
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  const txDate = new Date(date);
  if (Number.isNaN(txDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  const month = txDate.getMonth() + 1;
  const year = txDate.getFullYear();

  const data = loadData();
  const newTransaction = {
    id: randomUUID(),
    userId: req.user.id,
    description,
    amount: parsedAmount,
    date,
    category,
    type,
    note: note || '',
    month,
    year,
  };

  data.transactions.push(newTransaction);
  saveData(data);
  res.status(201).json({ data: newTransaction });
});

app.put('/api/transactions/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { description, amount, date, category, type, note } = req.body || {};

  const data = loadData();
  const txIndex = data.transactions.findIndex(tx => tx.id === id && tx.userId === req.user.id);
  if (txIndex === -1) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  const parsedAmount = Number(amount);
  if (!description || Number.isNaN(parsedAmount) || !date || !category || !type) {
    return res.status(400).json({ message: 'Missing transaction data' });
  }

  const txDate = new Date(date);
  if (Number.isNaN(txDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  const month = txDate.getMonth() + 1;
  const year = txDate.getFullYear();

  const updated = {
    ...data.transactions[txIndex],
    description,
    amount: parsedAmount,
    date,
    category,
    type,
    note: note || '',
    month,
    year,
  };

  data.transactions[txIndex] = updated;
  saveData(data);
  res.json({ data: updated });
});

app.delete('/api/transactions/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const lengthBefore = data.transactions.length;
  data.transactions = data.transactions.filter(tx => !(tx.id === id && tx.userId === req.user.id));

  if (data.transactions.length === lengthBefore) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  saveData(data);
  res.json({ data: null });
});

app.delete('/api/transactions/month', authMiddleware, (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const data = loadData();
  data.transactions = data.transactions.filter(
    tx => !(tx.userId === req.user.id && tx.month === month && tx.year === year)
  );
  saveData(data);
  res.json({ data: null });
});

app.get('/api/budgets/month', authMiddleware, (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const data = loadData();
  const budget = data.budgets.find(b => b.userId === req.user.id && b.month === month && b.year === year);
  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  res.json({ data: budget });
});

app.post('/api/budgets', authMiddleware, (req, res) => {
  const { amount, month, year } = req.body || {};
  const parsedAmount = Number(amount);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (!parsedAmount || parsedAmount <= 0 || !parsedMonth || !parsedYear) {
    return res.status(400).json({ message: 'Invalid budget data' });
  }

  const data = loadData();
  let budget = data.budgets.find(b => b.userId === req.user.id && b.month === parsedMonth && b.year === parsedYear);
  if (budget) {
    budget.amount = parsedAmount;
  } else {
    budget = { id: randomUUID(), userId: req.user.id, amount: parsedAmount, month: parsedMonth, year: parsedYear };
    data.budgets.push(budget);
  }

  saveData(data);
  res.json({ data: budget });
});

app.delete('/api/budgets/month', authMiddleware, (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const data = loadData();
  data.budgets = data.budgets.filter(b => !(b.userId === req.user.id && b.month === month && b.year === year));
  saveData(data);
  res.json({ data: null });
});

app.get('/api/analytics/summary', authMiddleware, (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const data = loadData();
  const transactions = data.transactions.filter(
    tx => tx.userId === req.user.id && tx.month === month && tx.year === year
  );

  const totalIncome = transactions.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpenses = transactions.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const budget = data.budgets.find(b => b.userId === req.user.id && b.month === month && b.year === year)?.amount || 0;
  const balance = totalIncome - totalExpenses;
  const remaining = budget - totalExpenses;
  const savingsPct = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  res.json({ data: { totalIncome, totalExpenses, balance, budget, remaining, savingsPct } });
});

app.get('/api/transactions', authMiddleware, (req, res) => {
  const data = loadData();
  const transactions = data.transactions.filter(tx => tx.userId === req.user.id);
  res.json({ data: transactions });
});

app.get('/api/budgets', authMiddleware, (req, res) => {
  const data = loadData();
  const budgets = data.budgets.filter(b => b.userId === req.user.id);
  res.json({ data: budgets });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Backend API server is running on http://localhost:${PORT}`);
});
