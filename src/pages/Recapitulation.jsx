import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import useUIStore from '../stores/uiStore';
import { RespondentDB, FamilyMemberDB, BusinessDetailDB, FamilyExpenseDB } from '../db/db';
import { Copy } from 'lucide-react';

export default function Recapitulation() {
  const { respondentId } = useParams();
  const navigate = useNavigate();
  const addToast = useUIStore(state => state.addToast);

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

      const members = await FamilyMemberDB.getAllByRespondent(respondentId);
      let gaji = 0;
      let ijarah = 0;
      members.forEach(m => {
        gaji += parseInt(m.gaji) || 0;
        ijarah += parseInt(m.ijarah) || 0;
      });
      const totalGajiIjarah = gaji + ijarah;

      const business = await BusinessDetailDB.get(respondentId) || {};
      const pendapatanUsaha = parseInt(business.pendapatan_total_bulan) || 0;
      const pengeluaranUsaha = parseInt(business.pengeluaran_usaha_bulan) || 0;
      const labaUsaha = pendapatanUsaha - pengeluaranUsaha;

      const expense = await FamilyExpenseDB.get(respondentId) || {};
      const pengeluaranMakan = parseInt(expense.total_makanan_bulan) || 0;
      const pengeluaranNonMakan = parseInt(expense.total_non_makanan_bulan) || 0;
      const totalPengeluaranKeluarga = pengeluaranMakan + pengeluaranNonMakan;

      const surplusDefisit = labaUsaha + totalGajiIjarah - totalPengeluaranKeluarga;

      setData({
        block_id: res.block_id,
        nama_kpl_keluarga: res.nama_kpl_keluarga,
        pendapatanUsaha,
        pengeluaranUsaha,
        labaUsaha,
        totalGajiIjarah,
        pengeluaranMakan,
        pengeluaranNonMakan,
        totalPengeluaranKeluarga,
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

  const handleDelete = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data draft ini? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        await RespondentDB.delete(respondentId);
        addToast('Data berhasil dihapus', 'success');
        navigate(`/block/${data.block_id}`);
      } catch (e) {
        addToast('Gagal menghapus data', 'error');
      }
    }
  };

  if (loading || !data) return <MainLayout title="Loading..." />;

  const RecapItem = ({ label, value, isBold = false }) => (
    <div className={`flex justify-between items-center py-3 border-b-2 border-dashed border-gray-300 last:border-0 ${isBold ? 'font-bold text-lg border-b-[3px] border-black border-solid' : ''}`}>
      <span className="font-['Space_Mono']">{label}</span>
      <div className="flex items-center space-x-3">
        <span className="font-['Space_Mono']">Rp {value.toLocaleString('id-ID')}</span>
        <button 
          onClick={() => handleCopy(value)}
          className="bg-black text-white p-2 hover:bg-gray-800 active:scale-95 transition-transform"
          title="Quick Copy"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <MainLayout title="Rekapitulasi" showBack={true} onBack={() => navigate(`/block/${data.block_id}`)}>
      <Card className="mb-6 border-[3px] border-black">
        <h3 className="font-['Archivo_Black'] text-xl uppercase mb-1">Draft / Rekapitulasi Sensus</h3>
        <p className="font-['Space_Mono'] text-sm opacity-80">Keluarga: {data.nama_kpl_keluarga}</p>
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl border-b-[3px] border-black pb-2">Edit Data (Lompat ke Langkah)</h4>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => navigate(`/wizard/${respondentId}?step=1&mode=edit`)}>1. Identitas</Button>
          <Button variant="secondary" onClick={() => navigate(`/wizard/${respondentId}?step=2&mode=edit`)}>2. Usaha</Button>
          <Button variant="secondary" onClick={() => navigate(`/wizard/${respondentId}?step=3&mode=edit`)}>3. Pendapatan</Button>
          <Button variant="secondary" onClick={() => navigate(`/wizard/${respondentId}?step=4&mode=edit`)}>4. Peng. Makan</Button>
          <Button variant="secondary" onClick={() => navigate(`/wizard/${respondentId}?step=5&mode=edit`)}>5. Peng. Non-Makan</Button>
          <Button variant="secondary" onClick={() => navigate(`/wizard/${respondentId}?step=6&mode=edit`)}>6. Aset</Button>
        </div>
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl border-b-[3px] border-black pb-2">Usaha</h4>
        <RecapItem label="Total Pendapatan" value={data.pendapatanUsaha} />
        <RecapItem label="Total Pengeluaran" value={data.pengeluaranUsaha} />
        <RecapItem label="Laba Bersih Usaha" value={data.labaUsaha} isBold={true} />
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl border-b-[3px] border-black pb-2">Keluarga</h4>
        <RecapItem label="Gaji & Ijarah Anggota" value={data.totalGajiIjarah} />
        <RecapItem label="Pengeluaran Makan" value={data.pengeluaranMakan} />
        <RecapItem label="Pengeluaran Non-Makan" value={data.pengeluaranNonMakan} />
        <RecapItem label="Total Peng. Keluarga" value={data.totalPengeluaranKeluarga} isBold={true} />
      </Card>

      <Card className={`mb-6 border-[5px] ${data.surplusDefisit >= 0 ? 'border-[#008000] bg-[#E5F2E5]' : 'border-[#FF0000] bg-[#FFE5E5]'}`}>
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl border-b-[3px] border-black pb-2">Surplus / Defisit</h4>
        <div className="flex justify-between items-center mt-4">
          <span className="font-['Archivo_Black'] text-xl md:text-2xl">TOTAL</span>
          <div className="flex items-center space-x-3">
            <span className={`font-['Archivo_Black'] text-xl md:text-2xl ${data.surplusDefisit >= 0 ? 'text-[#008000]' : 'text-[#FF0000]'}`}>
              Rp {data.surplusDefisit.toLocaleString('id-ID')}
            </span>
            <button 
              onClick={() => handleCopy(data.surplusDefisit)}
              className="bg-black text-white p-3 hover:bg-gray-800 active:scale-95 transition-transform"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col space-y-3">
        <Button className="w-full" onClick={() => navigate(`/block/${data.block_id}`)}>
          Kembali ke Detail Blok
        </Button>
        <Button className="w-full" variant="destructive" onClick={handleDelete}>
          Hapus Data
        </Button>
      </div>
    </MainLayout>
  );
}
