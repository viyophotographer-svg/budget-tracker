import { supabase } from "../supabase";

// Get transactions for a user, paginated, most recent first
export const getTransactions = async (userId, limit = 50, offset = 0) => {
  try {
    const { data, error, count } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data, count };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Create a new transaction
export const createTransaction = async (userId, transaction) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          notes: transaction.notes,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          transaction_date:
            transaction.transaction_date || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Update an existing transaction
export const updateTransaction = async (transactionId, updates) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Delete a transaction
export const deleteTransaction = async (transactionId) => {
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};