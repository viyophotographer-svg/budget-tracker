import { supabase } from '../supabase';

// Sign up new user
export const signUp = async (email, password, name) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      await createUserProfile(authData.user.id, email, name);
    }

    return authData.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session?.user || null);
      }
    );
    return subscription?.unsubscribe;
  } catch (error) {
    console.error('Error setting up auth listener:', error);
    return () => {};
  }
};

// Create user profile
export const createUserProfile = async (userId, email, name = '') => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email,
          name: name || email.split('@')[0],
          avatar: null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    console.log("========== UPDATE PROFILE ==========");
    console.log("User ID:", userId);
    console.log("Updates:", updates);

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select();

    console.log("Data:", data);
    console.log("Error:", error);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Full Error:", error);
    throw error;
  }
};

// Update email
export const updateUserEmail = async (newEmail) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

// Update password
export const updateUserPassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};