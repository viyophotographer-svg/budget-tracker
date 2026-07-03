import { supabase } from '../supabase';

export const getSavingsGoals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    throw error;
  }
};

export const createSavingsGoal = async (userId, goal) => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert([
        {
          user_id: userId,
          goal_name: goal.goal_name,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount || 0,
          target_date: goal.target_date,
          status: goal.status || 'active',
          color: goal.color || '#3b82f6',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating savings goal:', error);
    throw error;
  }
};

export const updateSavingsGoal = async (goalId, updates) => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating savings goal:', error);
    throw error;
  }
};

export const deleteSavingsGoal = async (goalId) => {
  try {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    throw error;
  }
};

export const addToSavingsGoal = async (goalId, amount) => {
  try {
    // Get current goal
    const { data: goal, error: fetchError } = await supabase
      .from('savings_goals')
      .select('current_amount')
      .eq('id', goalId)
      .single();

    if (fetchError) throw fetchError;

    // Update with new amount
    const newAmount = (goal.current_amount || 0) + amount;

    const { data, error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding to savings goal:', error);
    throw error;
  }
};

export const getSavingsProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const goals = data || [];
    const totalTarget = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
    const totalSaved = goals.reduce((sum, goal) => sum + (goal.current_amount || 0), 0);

    return {
      totalTarget,
      totalSaved,
      progress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      goalsCount: goals.length,
      goals,
    };
  } catch (error) {
    console.error('Error fetching savings progress:', error);
    throw error;
  }
};

export const getGoalStatus = async (goalId) => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error) throw error;

    const goal = data;
    const progress = (goal.current_amount / goal.target_amount) * 100;
    const remaining = goal.target_amount - goal.current_amount;
    const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return {
      ...goal,
      progress,
      remaining,
      daysLeft,
      isCompleted: goal.current_amount >= goal.target_amount,
    };
  } catch (error) {
    console.error('Error getting goal status:', error);
    throw error;
  }
};