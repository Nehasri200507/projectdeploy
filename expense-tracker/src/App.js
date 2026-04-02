import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const API_URL = "http://localhost:8080/api/expenses";

  // 1. Fetch data from Backend when the app loads
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(API_URL);
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // 2. Add Expense to Backend
  const addExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) return alert("Please fill all fields");

    const newExpense = { title, amount: parseFloat(amount), category };

    try {
      await axios.post(API_URL, newExpense);
      fetchExpenses(); // Refresh the list
      setTitle('');
      setAmount('');
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  // 3. Delete Expense from Backend
  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchExpenses(); // Refresh the list
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const total = expenses.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card shadow p-4">
            <h2 className="text-center mb-4">Expense Tracker (Full Stack)</h2>
            
            <div className="alert alert-success text-center">
              <h4>Total Spent: ${total.toFixed(2)}</h4>
            </div>

            <form onSubmit={addExpense} className="row g-2 mb-4">
              <div className="col-md-5">
                <input type="text" className="form-control" placeholder="Item name" 
                  value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="col-md-3">
                <input type="number" className="form-control" placeholder="Amount" 
                  value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="col-md-3">
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Food">Food</option>
                  <option value="Rent">Rent</option>
                  <option value="Transport">Transport</option>
                  <option value="Bills">Bills</option>
                </select>
              </div>
              <div className="col-md-1">
                <button className="btn btn-primary">+</button>
              </div>
            </form>

            <ul className="list-group">
              {expenses.map((exp) => (
                <li key={exp.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{exp.title}</strong> - <small className="text-muted">{exp.category}</small>
                  </div>
                  <div>
                    <span className="badge bg-danger me-3">-${exp.amount}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="btn btn-sm btn-outline-secondary">X</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
