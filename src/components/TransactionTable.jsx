import React, { useState, useMemo, useRef } from "react";
import { Plus, Download, Upload, X, Check, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import { useAuth } from "../hooks/useAuth";
import { bulkInsertTransactions } from "../services/transactionService";

export default function Transactions() {
  const { transactions, addTransaction, editTransaction, removeTransaction, fetchTransactions } = useTransactions();
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    notes: "",
    amount: "",
    category: "Food",
    type: "expense",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await editTransaction(editingId, {
          notes: formData.notes,
          amount: Number(formData.amount),
          category: formData.category,
          type: formData.type,
        });
        setEditingId(null);
      } else {
        await addTransaction({
          notes: formData.notes,
          amount: Number(formData.amount),
          category: formData.category,
          type: formData.type,
        });
      }

      setFormData({
        notes: "",
        amount: "",
        category: "Food",
        type: "expense",
      });

      setShowForm(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({
      notes: item.notes || "",
      amount: String(item.amount),
      category: item.category || "Food",
      type: item.type || "expense",
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      notes: "",
      amount: "",
      category: "Food",
      type: "expense",
    });
  };

  const handleDeleteClick = async (id) => {
    try {
      setDeletingId(id);
      await removeTransaction(id);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setDeletingId(null);
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

  // Parse a selected CSV file. Expected headers (case-insensitive):
  // date, notes, amount, category, type
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const Papa = (await import("papaparse")).default;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const valid = [];
          const errors = [];

          results.data.forEach((row, index) => {
            // Normalize header casing/whitespace
            const normalized = {};
            Object.keys(row).forEach((key) => {
              normalized[key.trim().toLowerCase()] = row[key]?.trim?.() ?? row[key];
            });

            const dateStr = normalized.date;
            const notes = normalized.notes || normalized.description;
            const amountStr = normalized.amount;
            const category = normalized.category || "Other";
            let type = (normalized.type || "").toLowerCase();

            const rowNum = index + 2; // +2 = header row + 1-indexing

            if (!dateStr || !amountStr) {
              errors.push(`Row ${rowNum}: missing date or amount`);
              return;
            }

            const parsedDate = new Date(dateStr);
            if (isNaN(parsedDate)) {
              errors.push(`Row ${rowNum}: unrecognized date "${dateStr}"`);
              return;
            }

            let amount = parseFloat(String(amountStr).replace(/[^0-9.-]/g, ""));
            if (isNaN(amount)) {
              errors.push(`Row ${rowNum}: unrecognized amount "${amountStr}"`);
              return;
            }

            // Infer type from a negative amount if no explicit type column
            if (type !== "income" && type !== "expense") {
              type = amount < 0 ? "expense" : "income";
            }
            amount = Math.abs(amount);

            valid.push({
              notes: notes || "Imported transaction",
              amount,
              category,
              type,
              transaction_date: parsedDate.toISOString(),
            });
          });

          setParsedRows(valid);
          setParseErrors(errors);
          setShowImportModal(true);
        },
        error: (err) => {
          setParseErrors([`Failed to read file: ${err.message}`]);
          setShowImportModal(true);
        },
      });
    } catch (err) {
      console.error("CSV parsing error:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!user || parsedRows.length === 0) return;

    try {
      setImporting(true);
      await bulkInsertTransactions(user.id, parsedRows);
      setShowImportModal(false);
      setParsedRows([]);
      setParseErrors([]);
      fetchTransactions?.();
    } catch (err) {
      console.error("Error importing transactions:", err);
      setParseErrors([err.message || "Import failed"]);
    } finally {
      setImporting(false);
    }
  };


  const groupedTransactions = useMemo(() => {
    const groups = {};

    transactions.forEach((item) => {
      if (!item.transaction_date) {
        const key = "No Date";
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return;
      }

      const date = new Date(item.transaction_date);
      const key = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // transactions already come sorted newest-first from the hook, so
    // preserving insertion order here keeps months newest-first too
    return Object.entries(groups);
  }, [transactions]);

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
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition"
          >
            <Upload className="w-5 h-5" />
            Import CSV
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting || transactions.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition"
          >
            <Download className="w-5 h-5" />
            {exporting ? "Exporting..." : "Export PDF"}
          </button>

          <button
            onClick={() => (showForm ? handleCancelForm() : setShowForm(true))}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Add/Edit Transaction Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? "Edit Transaction" : "New Transaction"}
            </h3>
          </div>

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

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg py-3 text-white font-semibold transition"
            >
              {editingId ? "Update Transaction" : "Save Transaction"}
            </button>
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-6 bg-slate-700 hover:bg-slate-600 rounded-lg py-3 text-white font-semibold transition"
            >
              Cancel
            </button>
          </div>

        </form>
      )}

      {/* Transactions grouped by month */}
      {groupedTransactions.length > 0 ? (
        groupedTransactions.map(([monthLabel, items]) => {
          const monthIncome = items
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const monthExpenses = items
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);

          return (
            <div
              key={monthLabel}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-semibold text-white">
                  {monthLabel}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400 font-medium">
                    +₹{monthIncome.toLocaleString()}
                  </span>
                  <span className="text-red-400 font-medium">
                    -₹{monthExpenses.toLocaleString()}
                  </span>
                </div>
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
                      <th className="text-right px-6 py-4 text-slate-300">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
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
                            ? new Date(item.transaction_date).toLocaleDateString("en-IN")
                            : "-"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.id)}
                              disabled={deletingId === item.id}
                              className="p-2 hover:bg-red-900/20 rounded-lg transition text-red-400 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-10 text-center text-slate-400">
          No transactions found
        </div>
      )}

      {/* CSV Import Preview Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !importing && setShowImportModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Import Preview
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="text-slate-400 hover:text-white transition rounded-lg p-1.5 hover:bg-slate-700/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-400">
                <Check className="w-4 h-4" />
                {parsedRows.length} ready to import
              </span>
              {parseErrors.length > 0 && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {parseErrors.length} skipped
                </span>
              )}
            </div>

            {parseErrors.length > 0 && (
              <div className="mb-4 max-h-24 overflow-y-auto bg-red-900/20 border border-red-700/50 rounded-lg p-3 space-y-1">
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400">{err}</p>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-slate-300">Date</th>
                    <th className="text-left px-4 py-2 text-slate-300">Notes</th>
                    <th className="text-left px-4 py-2 text-slate-300">Category</th>
                    <th className="text-left px-4 py-2 text-slate-300">Type</th>
                    <th className="text-right px-4 py-2 text-slate-300">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="border-t border-slate-700/50">
                      <td className="px-4 py-2 text-slate-400">
                        {new Date(row.transaction_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-2 text-white">{row.notes}</td>
                      <td className="px-4 py-2 text-slate-300">{row.category}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.type === "income"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-red-900/30 text-red-400"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          row.type === "income" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {row.type === "income" ? "+" : "-"}₹{row.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={importing || parsedRows.length === 0}
              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-lg py-3 text-white font-semibold transition"
            >
              {importing ? "Importing..." : `Import ${parsedRows.length} Transaction${parsedRows.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}