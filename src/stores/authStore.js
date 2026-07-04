import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  deviceId: null,
  isLifetimePaid: false,
  isLoading: true,
  
  forceSetLifetimePaid: (status) => set({ isLifetimePaid: status }),
  
  initAuth: async () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('device_id', deviceId);
    }
    set({ deviceId });

    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await get().checkUserStatus(session.user);
    } else {
      set({ isLoading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await get().checkUserStatus(session.user);
      } else {
        set({ user: null, session: null, isLifetimePaid: false, isLoading: false });
      }
    });
  },

  checkUserStatus: async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('current_device_id, is_lifetime_paid')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (error) {
        console.warn("Supabase users table error (might not exist yet):", error);
        const isMockPaid = localStorage.getItem('mock_lifetime_paid') === 'true';
        set({ user: authUser, session: true, isLifetimePaid: isMockPaid, isLoading: false });
        return;
      }

      if (!data) {
        // Jika data tidak ada (user lama yang mendaftar sebelum ada trigger)
        // Buat baris baru di public.users
        const { data: newData, error: insertError } = await supabase
          .from('users')
          .insert({ id: authUser.id, email: authUser.email })
          .select('current_device_id, is_lifetime_paid')
          .single();
          
        if (insertError) {
          console.error("Gagal membuat profil user:", insertError);
        }
        
        set({ 
          user: authUser, 
          session: true, 
          isLifetimePaid: newData?.is_lifetime_paid || false, 
          isLoading: false 
        });
        return;
      }

      set({ 
        user: authUser, 
        session: true, 
        isLifetimePaid: data?.is_lifetime_paid || false, 
        isLoading: false 
      });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },
  
  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signUp: async (email, password) => {
    return await supabase.auth.signUp({ email, password });
  },

  resetPassword: async (email) => {
    // This will send either a magic link or OTP depending on Supabase email template settings
    return await supabase.auth.resetPasswordForEmail(email);
  },

  verifyResetOtp: async (email, token, newPassword) => {
    // 1. Verify the OTP for password recovery
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    if (verifyError) return { error: verifyError };

    // 2. If successful, session is established. Now update the password.
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    
    // Sign out to enforce a fresh login with the new credentials
    await supabase.auth.signOut();
    
    return { error: updateError };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  }
}));

export default useAuthStore;
