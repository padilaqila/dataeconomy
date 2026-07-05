import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import useAuthStore from '../stores/authStore';
import { supabase } from '../lib/supabase';
import useUIStore from '../stores/uiStore';

export default function Payment() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const checkUserStatus = useAuthStore(state => state.checkUserStatus);
  const addToast = useUIStore(state => state.addToast);

  const handlePay = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Anda belum login");
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          user_id: user.id, 
          email: user.email,
          first_name: user.user_metadata?.first_name || 'Petugas Sensus'
        }
      });
      
      if (error) throw error;
      if (!data?.redirect_url) throw new Error("Gagal mendapatkan link pembayaran dari server");

      // Menggunakan mode Redirect URL (lebih kebal AdBlocker daripada mode Pop-up)
      window.location.href = data.redirect_url;
      
    } catch (e) {
      console.error(e);
      addToast(e.message || "Terjadi kesalahan saat memproses pembayaran", "error");
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Akses Terkunci">
      <div className="flex flex-col items-center justify-center mt-10">
        <Card className="max-w-md w-full border-[5px] text-center">
          <h2 className="font-['Archivo_Black'] uppercase text-2xl md:text-3xl mb-4">
            Beli Akses Lifetime
          </h2>
          <div className="flex flex-col items-center justify-center mb-6">
            <span className="text-xl text-gray-500 line-through decoration-2 font-['Archivo_Black']">
              Rp 35.000
            </span>
            <span className="text-5xl text-red-600 font-['Archivo_Black'] mt-1">
              Rp 20.000
            </span>
          </div>
          <p className="font-['Work_Sans'] text-gray-700 mb-8 text-left border-t-[3px] border-b-[3px] border-black py-4 border-dashed">
            - Akses selamanya (Lifetime)<br/>
            - Tidak ada batasan blok & responden<br/>
            - Sinkronisasi Cloud Backup<br/>
            - Dukungan Multi-Device<br/>
          </p>
          <Button className="w-full text-lg h-14" onClick={handlePay} disabled={loading}>
            {loading ? 'Memproses ke Midtrans...' : 'Bayar Sekarang'}
          </Button>
          <p className="font-['Space_Mono'] text-xs text-gray-500 mt-4">
            *Pembayaran diproses aman melalui Midtrans
          </p>
          <button 
            onClick={async () => {
              await useAuthStore.getState().signOut();
              navigate('/login');
            }}
            className="mt-6 text-sm underline text-gray-600 hover:text-black font-['Work_Sans'] cursor-pointer"
          >
            Salah akun? Keluar
          </button>
        </Card>
      </div>
    </MainLayout>
  );
}
