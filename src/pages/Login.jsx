import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../stores/authStore';
import { supabase } from '../lib/supabase';
import useUIStore from '../stores/uiStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, signUp, deviceId } = useAuthStore();
  const addToast = useUIStore(state => state.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isRegister) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        addToast('Registrasi berhasil! Silakan cek email Anda.', 'success');
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        
        addToast('Login berhasil', 'success');
        navigate('/dashboard');
      }
    } catch (error) {
      addToast(error.message || 'Terjadi kesalahan', 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <MainLayout title={isRegister ? "Daftar Akun" : "Login Petugas"} className="flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto border-[3px] border-black p-6 bg-white mt-10">
        <form onSubmit={handleSubmit}>
          <Input 
            label="Email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="petugas@bps.go.id"
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          
          <Button 
            type="submit" 
            className="w-full mt-4" 
            disabled={loading}
          >
            {loading ? 'Memproses...' : (isRegister ? 'Daftar' : 'Masuk')}
          </Button>
          
          <div className="mt-6 text-center">
            <button 
              type="button"
              className="text-sm font-['Work_Sans'] underline text-[#0000FF]"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
