import { supabase } from '../supabase';
import { getErrorMessage } from '../api-helpers';

export const signUp = async (email: string, password: string, fullName?: string) => {
  try {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          email,
          full_name: fullName ?? email.split('@')[0],
          role: 'visitor',
        },
      },
    });
    return response;
  } catch (err: unknown) {
    return { data: { user: null, session: null }, error: { message: getErrorMessage(err), name: 'UnknownError' } };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await supabase.auth.signInWithPassword({ email, password });
    return response;
  } catch (err: unknown) {
    return { data: { user: null, session: null }, error: { message: getErrorMessage(err), name: 'UnknownError' } };
  }
};

export const signOut = async () => {
  try {
    const response = await supabase.auth.signOut();
    return response;
  } catch (err: unknown) {
    return { error: { message: getErrorMessage(err), name: 'UnknownError' }, data: { user: null, session: null } };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const response = await supabase.auth.resetPasswordForEmail(email);
    return response;
  } catch (err: unknown) {
    return { data: { user: null, session: null }, error: { message: getErrorMessage(err), name: 'UnknownError' } };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const response = await supabase.auth.updateUser({ password: newPassword });
    return response;
  } catch (err: unknown) {
    return { data: { user: null }, error: { message: getErrorMessage(err), name: 'UnknownError' } };
  }
};

export const signInWithProvider = async (provider: 'google') => {
  try {
    const response = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
      },
    });
    return response;
  } catch (err: unknown) {
    return { data: { provider, url: null }, error: { message: getErrorMessage(err), name: 'UnknownError' } };
  }
};
