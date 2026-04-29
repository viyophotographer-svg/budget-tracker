import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  Wallet,
  Plus,
  Trash2,
  BarChart3
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import "./App.css";

function App() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("id", { ascending: false });

    if (!error) {
      setExpenses(data);
    }
  }

  async function addExpense() {
    if (!amount || !category) {
      alert("Please fill all fields");
      return;
    }

    const currentDate = new Date().toISOString();

    const { error } = await supabase
      .from("expenses")
      .insert([
        {
          amount,
          category,
          date: currentDate
        }
      ]);

    if (!error) {
      fetchExpenses();
      setAmount("");
      setCategory("");
    }
  }

  async function deleteExpense(id) {
    await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    fetchExpenses();
  }

  const totalSpent = expenses.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const chartData = expenses.map((item) => ({
    name: item.category,
    amount: Number(item.amount)
  }));

  return (
    <div className="app">
      <h1>Budget Dashboard</h1>

      {/* Total Spending Card */}
      <div className="total-card">
        <Wallet size={30} />
        <h2>₹{totalSpent}</h2>
        <p>Total Spent This Month</p>
      </div>

      {/* Add Expense */}
      <div className="form-card">
        <h2>
          <Plus size={18} /> Add Expense
        </h2>

        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <button onClick={addExpense}>
          Add Expense
        </button>
      </div>

      {/* Chart */}
      <div className="chart-card">
        <h2>
          <BarChart3 size={18} /> Spending Chart
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="amount"
              fill="#8b5cf6"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Expenses */}
      <div className="list-card">
        <h2>Recent Expenses</h2>

        {expenses.map((item) => (
          <div className="expense-item" key={item.id}>
            <div>
              <h4>{item.category}</h4>

              <p>
                {new Date(item.date).toLocaleString()}
              </p>
            </div>

            <div className="right-section">
              <span>₹{item.amount}</span>

              <button
                className="delete-btn"
                onClick={() => deleteExpense(item.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;