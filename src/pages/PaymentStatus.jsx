import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import { CheckCircle2, XCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const transactionStatus = searchParams.get('transaction_status');
  const statusCode = searchParams.get('status_code');
  
  // Midtrans appends transaction_status (capture/settlement = success) or status_code (200/201 = success)
  const isSuccess = statusParam === 'success' || 
                    transactionStatus === 'capture' || 
                    transactionStatus === 'settlement' || 
                    statusCode === '200' || 
                    statusCode === '201';

  const navigate = useNavigate();
  const checkUserStatus = useAuthStore(state => state.checkUserStatus);
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(false);

  const handleGoToDashboard = async () => {
    setLoading(true);
    if (user) {
      await checkUserStatus(user);
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <MainLayout title="Status Pembayaran">
      <div className="flex flex-col items-center justify-center mt-10">
        <Card className={`max-w-md w-full border-[5px] text-center ${isSuccess ? 'border-[#008000] bg-[#E5F2E5]' : 'border-[#FF0000] bg-[#FFE5E5]'}`}>
          {isSuccess ? (
            <>
              <CheckCircle2 size={80} className="mx-auto text-[#008000] mb-6" strokeWidth={3} />
              <h2 className="font-['Archivo_Black'] uppercase text-2xl mb-4 text-[#008000]">
                Pembayaran Berhasil!
              </h2>
              <p className="font-['Work_Sans'] mb-8">
                Terima kasih. Akses lifetime Anda telah diaktifkan. Anda sekarang dapat menggunakan seluruh fitur Kalkulator SE-2026.
              </p>
              <Button className="w-full" onClick={handleGoToDashboard} disabled={loading}>
                {loading ? 'Memuat Data...' : 'Masuk ke Dashboard'}
              </Button>
            </>
          ) : (
            <>
              <XCircle size={80} className="mx-auto text-[#FF0000] mb-6" strokeWidth={3} />
              <h2 className="font-['Archivo_Black'] uppercase text-2xl mb-4 text-[#FF0000]">
                Pembayaran Gagal
              </h2>
              <p className="font-['Work_Sans'] mb-8">
                Mohon maaf, terjadi kesalahan pada proses pembayaran Anda atau batas waktu telah habis.
              </p>
              <Button className="w-full" onClick={() => navigate('/payment', { replace: true })}>
                Coba Lagi
              </Button>
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
