import React, { useState, useEffect } from 'react';
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
  const [view, setView] = useState('login'); // 'login' | 'register' | 'reset'
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, verifyResetOtp } = useAuthStore();
  const addToast = useUIStore(state => state.addToast);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

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
        if (password !== confirmPassword) {
          throw new Error('Password baru tidak cocok');
        }
        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter');
        }
        const { error } = await resetPassword(email);
        if (error) throw error;
        addToast('Kode OTP telah dikirim ke email Anda', 'success');
        setCountdown(60);
        setShowOtpModal(true);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        addToast('Login berhasil', 'success');
        navigate('/dashboard');
      }
    } catch (error) {
      let errorMsg = error.message || 'Terjadi kesalahan';
      if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'Email belum terdaftar atau password salah.';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Akun sudah terdaftar. Silakan pilih menu Login.';
      } else if (errorMsg.includes('Password should be at least')) {
        errorMsg = 'Password minimal 6 karakter.';
      }
      
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await verifyResetOtp(email, otp, password);
      if (error) throw error;
      
      addToast('Password berhasil diubah. Silakan login.', 'success');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setShowOtpModal(false);
      setView('login');
    } catch (error) {
      addToast(error.message || 'OTP tidak valid atau kedaluwarsa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      addToast('Kode OTP baru telah dikirim', 'success');
      setCountdown(60);
    } catch (error) {
      addToast(error.message || 'Gagal mengirim ulang OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to reset states when switching views
  const switchView = (newView) => {
    setView(newView);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <MainLayout title={view === 'register' ? "Daftar Akun" : view === 'reset' ? "Reset Password" : "Login Petugas"} className="flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto mt-10">
        
        {/* Header Tabs (only show for login/register to keep it simple, or hide if in reset flow) */}
        {(view === 'login' || view === 'register') && (
          <div className="flex bg-white border-[3px] border-black border-b-0">
             <button 
               type="button" 
               className={`flex-1 py-3 text-sm font-['Archivo_Black'] uppercase transition-colors border-r-[3px] border-black outline-none focus:bg-gray-200 ${view === 'login' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'}`}
               onClick={() => switchView('login')}
             >
               Login
             </button>
             <button 
               type="button" 
               className={`flex-1 py-3 text-sm font-['Archivo_Black'] uppercase transition-colors outline-none focus:bg-gray-200 ${view === 'register' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'}`}
               onClick={() => switchView('register')}
             >
               Daftar
             </button>
          </div>
        )}

        {/* Form Card */}
        <div className={`border-[3px] border-black p-6 bg-white ${view === 'reset' ? 'border-t-[3px]' : ''}`}>
          <h2 className="font-['Archivo_Black'] text-2xl uppercase mb-6 pb-4 border-b-[3px] border-black border-dashed">
            {view === 'register' ? 'Daftar Baru' : view === 'reset' ? 'Reset Password' : 'Login Petugas'}
          </h2>
          
          {view === 'reset' && (
            <p className="font-['Space_Mono'] text-[13px] text-gray-700 mb-6 bg-gray-100 p-3 border-l-[3px] border-black">
              Masukkan email dan password baru Anda. Kami akan mengirimkan OTP untuk mengonfirmasi perubahan.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="emailkamu@gmail.com"
              disabled={loading}
            />

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

            {view === 'reset' && (
              <>
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

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Memproses...' : view === 'register' ? 'Daftar' : view === 'reset' ? 'Simpan & Kirim OTP' : 'Masuk'}
            </Button>

            <div className="mt-6 flex flex-col gap-3 text-center">
              {view === 'login' && (
                <button
                  type="button"
                  className="text-sm font-['Work_Sans'] underline text-[#0000FF] hover:text-[#000099]"
                  onClick={() => switchView('reset')}
                >
                  Lupa password?
                </button>
              )}
              {view === 'reset' && (
                <button
                  type="button"
                  className="text-sm font-['Work_Sans'] underline text-[#0000FF] hover:text-[#000099]"
                  onClick={() => switchView('login')}
                >
                  Kembali ke Halaman Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modal OTP */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-[3px] border-black p-6 w-full max-w-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-['Archivo_Black'] text-xl uppercase mb-4 border-b-[3px] border-black border-dashed pb-3">Konfirmasi OTP</h3>
            <p className="font-['Space_Mono'] text-[13px] text-gray-700 mb-6 bg-gray-100 p-3 border-l-[3px] border-black">
              Cek email <b>{email}</b> dan masukkan 6-digit OTP untuk memverifikasi penggantian password.
            </p>
            <form onSubmit={handleVerifyOtp}>
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
              
              <div className="text-right mt-1 mb-4">
                <button
                  type="button"
                  className="text-[13px] font-['Work_Sans'] underline text-[#0000FF] hover:text-[#000099] disabled:text-gray-400 disabled:no-underline"
                  onClick={handleResendOtp}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `Kirim ulang OTP dalam ${countdown}s` : 'Belum terima email? Kirim Ulang OTP'}
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 bg-white hover:bg-gray-100 text-black border-[3px] border-black"
                  disabled={loading}
                  onClick={() => setShowOtpModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || otp.length < 6}
                >
                  {loading ? '...' : 'Verifikasi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
