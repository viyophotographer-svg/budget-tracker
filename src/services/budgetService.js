import { supabase } from "../supabase";

// Current month in YYYY-MM format
const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

// Get current month's budget
export const getBudget = async (userId) => {
  try {
    const monthYear = getCurrentMonth();

    // Get budget
    const { data: budgetData, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month_year", monthYear)
      .maybeSingle();

    if (budgetError) throw budgetError;

    // Get expenses for this month
    const start = `${monthYear}-01`;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 7) + "-01";

    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("transaction_date", start)
      .lt("transaction_date", end);

    if (transactionError) throw transactionError;

    const spent =
      transactions?.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      ) || 0;

    return {
      budget: budgetData?.monthly_limit || 0,
      spent,
      remaining: (budgetData?.monthly_limit || 0) - spent,
      month: monthYear,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Create Budget
export const createBudget = async (userId, amount) => {
  const monthYear = getCurrentMonth();

  const { data, error } = await supabase
    .from("budgets")
    .insert([
      {
        user_id: userId,
        month_year: monthYear,
        monthly_limit: amount,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Update Budget
export const updateBudget = async (userId, amount) => {
  const monthYear = getCurrentMonth();

  const { data, error } = await supabase
    .from("budgets")
    .update({
      monthly_limit: amount,
    })
    .eq("user_id", userId)
    .eq("month_year", monthYear)
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Create or Update
export const saveBudget = async (userId, amount) => {
  const monthYear = getCurrentMonth();

  const { data } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month_year", monthYear)
    .maybeSingle();

  if (data) {
    return updateBudget(userId, amount);
  }

  return createBudget(userId, amount);
};

// Budget History
export const getBudgetHistory = async (userId) => {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("month_year", {
      ascending: false,
    });

  if (error) throw error;

  return data;
};

// Progress
export const checkBudgetStatus = async (userId) => {
  const budget = await getBudget(userId);

  const percentage =
    budget.budget > 0
      ? (budget.spent / budget.budget) * 100
      : 0;

  return {
    budget: budget.budget,
    spent: budget.spent,
    remaining: budget.remaining,
    percentage,
  };
};