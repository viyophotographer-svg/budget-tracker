import { useState } from "react";

function ExpenseForm({ onAdd }) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onAdd(amount, notes);
    setAmount("");
    setNotes("");
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl">
      <h2 className="text-xl font-bold mb-4">
        Add Expense
      </h2>

      <input
        className="w-full p-3 rounded-lg bg-slate-700 mb-3"
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        className="w-full p-3 rounded-lg bg-slate-700 mb-3"
        type="text"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        className="bg-blue-600 px-4 py-2 rounded-lg"
        onClick={handleSubmit}
      >
        Add Expense
      </button>
    </div>
  );
}

export default ExpenseForm;