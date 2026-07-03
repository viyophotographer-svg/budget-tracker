import { supabase } from "../supabase";

export const getAnalytics = async (userId) => {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;

    const categoryMap = {};
    const monthlyMap = {};

    (transactions || []).forEach((transaction) => {
      const category = transaction.category || "Other";
      const amount = Number(transaction.amount) || 0;

      // Category totals
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }

      if (transaction.type === "expense") {
        categoryMap[category] += amount;
      }

      // Monthly totals
      const date = new Date(transaction.transaction_date);

      const monthKey = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
        };
      }

      if (transaction.type === "income") {
        monthlyMap[monthKey].income += amount;
      } else {
        monthlyMap[monthKey].expense += amount;
      }
    });

    const categoryData = Object.entries(categoryMap).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    const monthlyData = Object.values(monthlyMap);

    return {
      categoryData,
      monthlyData,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};