import React, { useState } from 'react';
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
  const forceSetLifetimePaid = useAuthStore(state => state.forceSetLifetimePaid);
  const addToast = useUIStore(state => state.addToast);

  const handlePay = async () => {
    setLoading(true);
    // Simulasi memanggil backend untuk Midtrans Snap Token
    setTimeout(async () => {
      try {
        if (user) {
          // Simulasi pembayaran sukses & update db
          const { error } = await supabase.from('users').update({ is_lifetime_paid: true }).eq('id', user.id);
          if (error) {
             console.warn("Update Supabase gagal (Tabel users mungkin belum disetup):", error);
             // Tetap izinkan masuk (mock berhasil) untuk demo
          }
          localStorage.setItem('mock_lifetime_paid', 'true');
          await checkUserStatus(user);
          forceSetLifetimePaid(true); // Bypass check jika tabel supabase belum ada
          navigate('/payment-status?status=success');
        }
      } catch (e) {
        addToast("Kesalahan simulasi pembayaran", "error");
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <MainLayout title="Akses Terkunci">
      <div className="flex flex-col items-center justify-center mt-10">
        <Card className="max-w-md w-full border-[5px] text-center">
          <h2 className="font-['Archivo_Black'] uppercase text-2xl md:text-3xl mb-4">
            Beli Akses Lifetime
          </h2>
          <div className="text-5xl font-['Archivo_Black'] mb-6">
            Rp 25.000
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
        </Card>
      </div>
    </MainLayout>
  );
}
