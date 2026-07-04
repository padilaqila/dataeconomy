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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('login'); // 'login' | 'register' | 'reset' | 'verify-otp'

  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, verifyResetOtp } = useAuthStore();
  const addToast = useUIStore(state => state.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (view === 'register') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        addToast('Registrasi berhasil! Silakan cek email Anda.', 'success');
        setView('login');
      } else if (view === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        addToast('Kode OTP telah dikirim ke email Anda', 'success');
        setView('verify-otp');
      } else if (view === 'verify-otp') {
        if (password !== confirmPassword) {
          throw new Error('Password baru tidak cocok');
        }
        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter');
        }
        const { error } = await verifyResetOtp(email, otp, password);
        if (error) throw error;
        
        addToast('Password berhasil diubah. Silakan login.', 'success');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setView('login');
      } else {
        const { error } = await signIn(email, password);
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
    <MainLayout title={view === 'register' ? "Daftar Akun" : (view === 'reset' || view === 'verify-otp') ? "Reset Password" : "Login Petugas"} className="flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto mt-10">
        
        {/* Header Tabs (only show for login/register to keep it simple, or hide if in reset flow) */}
        {(view === 'login' || view === 'register') && (
          <div className="flex bg-white border-[3px] border-black border-b-0">
             <button 
               type="button" 
               className={`flex-1 py-3 text-sm font-['Archivo_Black'] uppercase transition-colors border-r-[3px] border-black outline-none focus:bg-gray-200 ${view === 'login' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'}`}
               onClick={() => setView('login')}
             >
               Login
             </button>
             <button 
               type="button" 
               className={`flex-1 py-3 text-sm font-['Archivo_Black'] uppercase transition-colors outline-none focus:bg-gray-200 ${view === 'register' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'}`}
               onClick={() => setView('register')}
             >
               Daftar
             </button>
          </div>
        )}

        {/* Form Card */}
        <div className={`border-[3px] border-black p-6 bg-white ${(view === 'reset' || view === 'verify-otp') ? 'border-t-[3px]' : ''}`}>
          <h2 className="font-['Archivo_Black'] text-2xl uppercase mb-6 pb-4 border-b-[3px] border-black border-dashed">
            {view === 'register' ? 'Daftar Baru' : (view === 'reset' || view === 'verify-otp') ? 'Reset Password' : 'Login Petugas'}
          </h2>
          
          {view === 'reset' && (
            <p className="font-['Space_Mono'] text-[13px] text-gray-700 mb-6 bg-gray-100 p-3 border-l-[3px] border-black">
              Masukkan alamat email Anda untuk menerima 6-digit OTP reset password.
            </p>
          )}

          {view === 'verify-otp' && (
            <p className="font-['Space_Mono'] text-[13px] text-gray-700 mb-6 bg-gray-100 p-3 border-l-[3px] border-black">
              Cek email <b>{email}</b> dan masukkan 6-digit OTP beserta password baru Anda.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            {view !== 'verify-otp' && (
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="emailkamu@gmail.com"
                disabled={loading}
              />
            )}

            {view === 'verify-otp' && (
              <>
                <Input
                  label="Kode OTP (6 Digit)"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="123456"
                  disabled={loading}
                  className="text-center font-['Space_Mono'] tracking-[0.5em] text-lg"
                />
                <Input
                  label="Password Baru"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
                <Input
                  label="Konfirmasi Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </>
            )}

            {(view === 'login' || view === 'register') && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading || (view === 'verify-otp' && otp.length < 6)}
            >
              {loading ? 'Memproses...' : view === 'register' ? 'Daftar' : view === 'reset' ? 'Kirim OTP' : view === 'verify-otp' ? 'Simpan Password Baru' : 'Masuk'}
            </Button>

            <div className="mt-6 flex flex-col gap-3 text-center">
              {view === 'login' && (
                <button
                  type="button"
                  className="text-sm font-['Work_Sans'] underline text-[#0000FF] hover:text-[#000099]"
                  onClick={() => setView('reset')}
                >
                  Lupa password?
                </button>
              )}
              {(view === 'reset' || view === 'verify-otp') && (
                <button
                  type="button"
                  className="text-sm font-['Work_Sans'] underline text-[#0000FF] hover:text-[#000099]"
                  onClick={() => setView('login')}
                >
                  Kembali ke Halaman Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
