function TransactionTable({ expenses, onDelete }) {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl">
      <h2 className="text-xl font-bold mb-4">
        Transactions
      </h2>

      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex justify-between items-center border-b border-slate-700 py-3"
        >
          <div>
            <p className="font-semibold">
              ₹{expense.amount}
            </p>
            <p className="text-slate-400">
              {expense.notes}
            </p>
          </div>

          <button
            className="bg-red-600 px-3 py-1 rounded"
            onClick={() => onDelete(expense.id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default TransactionTable;