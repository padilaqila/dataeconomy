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
        .single();
      
      if (error) {
        console.warn("Supabase users table error (might not exist yet):", error);
        const isMockPaid = localStorage.getItem('mock_lifetime_paid') === 'true';
        set({ user: authUser, session: true, isLifetimePaid: isMockPaid, isLoading: false });
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

  signOut: async () => {
    await supabase.auth.signOut();
  }
}));

export default useAuthStore;
