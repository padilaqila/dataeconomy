import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import useUIStore from '../stores/uiStore';
import { RespondentDB, FinancialRecordDB, DeletedRecordDB } from '../db/db';
import { Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Recapitulation() {
  const { respondentId } = useParams();
  const navigate = useNavigate();
  const addToast = useUIStore(state => state.addToast);
  const showConfirm = useUIStore(state => state.showConfirm);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadRecap();
  }, [respondentId]);

  const loadRecap = async () => {
    try {
      const res = await RespondentDB.getById(respondentId);
      if (!res) {
        addToast('Data responden tidak ditemukan', 'error');
        navigate('/dashboard');
        return;
      }

      const records = await FinancialRecordDB.getAllByRespondent(respondentId);
      
      let pendapatanBulan = 0;
      let pendapatanTahun = 0;
      let pengeluaranBulan = 0;
      let pengeluaranTahun = 0;

      records.forEach(r => {
        pendapatanBulan += r.total_income_monthly || 0;
        pendapatanTahun += r.total_income_yearly || 0;
        pengeluaranBulan += r.total_expense_monthly || 0;
        pengeluaranTahun += r.total_expense_yearly || 0;
      });

      const surplusDefisit = pendapatanBulan - pengeluaranBulan;

      setData({
        block_id: res.block_id,
        nama_kpl_keluarga: res.nama_kpl_keluarga,
        records,
        pendapatanBulan,
        pendapatanTahun,
        pengeluaranBulan,
        pengeluaranTahun,
        surplusDefisit
      });
      setLoading(false);
    } catch (e) {
      addToast('Gagal memuat rekap', 'error');
      navigate('/dashboard');
    }
  };

  const handleCopy = (value) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value.toString());
      addToast('Tersalin!', 'success');
    } else {
      addToast('Browser tidak mendukung copy', 'error');
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Hapus Draf',
      message: 'Apakah Anda yakin ingin menghapus data draft ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          let deletedInCloud = false;
          if (navigator.onLine) {
            const { error } = await supabase.from('respondents').delete().eq('id', respondentId);
            if (!error) deletedInCloud = true;
          }
          
          if (!deletedInCloud) {
            await DeletedRecordDB.add({ id: respondentId, type: 'respondent', created_at: Date.now() });
          }
          
          await RespondentDB.delete(respondentId);
          addToast('Data berhasil dihapus', 'success');
          navigate(`/block/${data.block_id}`);
        } catch (e) {
          console.error('Delete error', e);
          addToast('Gagal menghapus data', 'error');
        }
      }
    });
  };

  if (loading || !data) return <MainLayout title="Loading..." />;

  const RecapItem = ({ label, value, isBold = false }) => (
    <div className={`flex justify-between items-center py-3 border-b-2 border-dashed border-gray-300 last:border-0 ${isBold ? 'font-bold text-lg border-b-[3px] border-black border-solid' : ''}`}>
      <span className="font-['Space_Mono'] text-[13px] flex-1 pr-3">{label}</span>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span className="font-['Space_Mono'] text-[13px]">Rp {value.toLocaleString('id-ID')}</span>
        <button 
          onClick={() => handleCopy(value)}
          className="bg-black text-white p-2 hover:bg-gray-800 active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Quick Copy"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <MainLayout title="Laporan Akhir" showBack={true} onBack={() => navigate(`/block/${data.block_id}`)}>
      <Card className="mb-6 border-[3px] border-black">
        <h3 className="font-['Archivo_Black'] text-xl uppercase mb-1">Laporan Status Keuangan</h3>
        <p className="font-['Space_Mono'] text-sm opacity-80 mb-2">Keluarga/Usaha: {data.nama_kpl_keluarga}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.records.length === 0 && <span className="font-['Space_Mono'] text-sm text-red-500">Belum ada data modul</span>}
          {data.records.map((r, idx) => (
            <span key={r.id} className="font-['Space_Mono'] text-xs font-bold bg-yellow-100 p-1 border-[2px] border-black">
              {idx + 1}. {r.module_type.replace('_', ' ')}
            </span>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl border-b-[3px] border-black pb-2">Edit Data</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => navigate(`/wizard/${respondentId}?mode=edit`)}>Buka Dashboard Sektor</Button>
        </div>
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl border-b-[3px] border-black pb-2">Agregat Bulanan (KUMULATIF)</h4>
        <RecapItem label="Total Pemasukan / Bulan" value={data.pendapatanBulan} />
        <RecapItem label="Total Pengeluaran / Bulan" value={data.pengeluaranBulan} />
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl border-b-[3px] border-black pb-2">Agregat Tahunan (KUMULATIF)</h4>
        <RecapItem label="Total Pemasukan / Tahun" value={data.pendapatanTahun} />
        <RecapItem label="Total Pengeluaran / Tahun" value={data.pengeluaranTahun} />
      </Card>

      {/* SURPLUS / DEFISIT BULANAN */}
      <Card className={`mb-6 border-[5px] ${data.surplusDefisit >= 0 ? 'border-[#008000] bg-[#E5F2E5]' : 'border-[#FF0000] bg-[#FFE5E5]'}`}>
        <h4 className="font-['Archivo_Black'] uppercase mb-2 text-xl border-b-[3px] border-black pb-2">Status Keuangan (Bulan)</h4>
        <div className="flex justify-between items-center mt-4 pt-4">
          <span className="font-['Archivo_Black'] text-lg md:text-xl">SURPLUS / DEFISIT</span>
          <div className="flex items-center space-x-3">
            <span className={`font-['Archivo_Black'] text-lg md:text-xl ${data.surplusDefisit >= 0 ? 'text-[#008000]' : 'text-[#FF0000]'}`}>
              Rp {data.surplusDefisit.toLocaleString('id-ID')}
            </span>
            <button 
              onClick={() => handleCopy(data.surplusDefisit)}
              className="bg-black text-white p-3 hover:bg-gray-800 active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col space-y-3">
        <Button className="w-full" onClick={() => navigate(`/block/${data.block_id}`)}>
          Simpan & Kembali
        </Button>
        <Button className="w-full" variant="destructive" onClick={handleDelete}>
          Hapus Data
        </Button>
      </div>
    </MainLayout>
  );
}
