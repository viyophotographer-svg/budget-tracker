import React, { useState } from "react";
import { Plus, Download } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";

export default function Transactions() {
  const { transactions, addTransaction } = useTransactions();

  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    notes: "",
    amount: "",
    category: "Food",
    type: "expense",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addTransaction({
        notes: formData.notes,
        amount: Number(formData.amount),
        category: formData.category,
        type: formData.type,
      });

      setFormData({
        notes: "",
        amount: "",
        category: "Food",
        type: "expense",
      });

      setShowForm(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);

      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Transactions Report", 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, 14, 25);

      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Income: Rs. ${totalIncome.toLocaleString()}`, 14, 34);
      doc.text(`Total Expenses: Rs. ${totalExpenses.toLocaleString()}`, 14, 40);
      doc.text(`Net Balance: Rs. ${(totalIncome - totalExpenses).toLocaleString()}`, 14, 46);

      const rows = transactions.map((t) => [
        t.transaction_date
          ? new Date(t.transaction_date).toLocaleDateString("en-IN")
          : "-",
        t.notes || "-",
        t.category || "-",
        t.type === "income" ? "Income" : "Expense",
        `${t.type === "income" ? "+" : "-"} Rs. ${Number(t.amount).toLocaleString()}`,
      ]);

      autoTable(doc, {
        head: [["Date", "Notes", "Category", "Type", "Amount"]],
        body: rows,
        startY: 54,
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 },
      });

      doc.save(`transactions-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Transactions
          </h1>
          <p className="text-slate-400">
            Manage your income and expenses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={exporting || transactions.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition"
          >
            <Download className="w-5 h-5" />
            {exporting ? "Exporting..." : "Export PDF"}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 space-y-4"
        >

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Notes
            </label>

            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
              className="w-full bg-slate-700 rounded-lg p-3 text-white"
              placeholder="Enter transaction notes..."
              rows={3}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Amount
              </label>

              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value,
                  })
                }
                className="w-full bg-slate-700 rounded-lg p-3 text-white"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Category
              </label>

              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                className="w-full bg-slate-700 rounded-lg p-3 text-white"
              >
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Salary">Salary</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Type
              </label>

              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value,
                  })
                }
                className="w-full bg-slate-700 rounded-lg p-3 text-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 rounded-lg py-3 text-white font-semibold transition"
          >
            Save Transaction
          </button>

        </form>
      )}
            {/* Transactions Table */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Recent Transactions
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-700/50">

              <tr>
                <th className="text-left px-6 py-4 text-slate-300">Notes</th>
                <th className="text-left px-6 py-4 text-slate-300">Category</th>
                <th className="text-left px-6 py-4 text-slate-300">Type</th>
                <th className="text-right px-6 py-4 text-slate-300">Amount</th>
                <th className="text-left px-6 py-4 text-slate-300">Date</th>
              </tr>

            </thead>

            <tbody>

              {transactions.length > 0 ? (

                transactions.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                  >

                    <td className="px-6 py-4 text-white">
                      {item.notes}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {item.category}
                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === "income"
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {item.type}
                      </span>

                    </td>

                    <td
                      className={`px-6 py-4 text-right font-bold ${
                        item.type === "income"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.type === "income" ? "+" : "-"}₹
                      {Number(item.amount).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-slate-400">

                      {item.transaction_date
                        ? new Date(
                            item.transaction_date
                          ).toLocaleDateString("en-IN")
                        : "-"}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={5}
                    className="text-center py-10 text-slate-400"
                  >
                    No transactions found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}