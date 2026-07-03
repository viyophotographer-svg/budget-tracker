import { useState, useEffect } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/transactionService';
import { useAuth } from './useAuth';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  const fetchTransactions = async (limit = 50, offset = 0) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const { data, count: totalCount } = await getTransactions(user.id, limit, offset);
      setTransactions(data || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction) => {
    if (!user) return;

    try {
      setError(null);
      const newTransaction = await createTransaction(user.id, transaction);
      setTransactions([newTransaction, ...transactions]);
      return newTransaction;
    } catch (err) {
      setError(err.message);
      console.error('Error creating transaction:', err);
      throw err;
    }
  };

  const editTransaction = async (transactionId, updates) => {
    try {
      setError(null);
      const updatedTransaction = await updateTransaction(transactionId, updates);
      setTransactions(
        transactions.map((t) => (t.id === transactionId ? updatedTransaction : t))
      );
      return updatedTransaction;
    } catch (err) {
      setError(err.message);
      console.error('Error updating transaction:', err);
      throw err;
    }
  };

  const removeTransaction = async (transactionId) => {
    try {
      setError(null);
      await deleteTransaction(transactionId);
      setTransactions(transactions.filter((t) => t.id !== transactionId));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting transaction:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    error,
    count,
    fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
  };
}