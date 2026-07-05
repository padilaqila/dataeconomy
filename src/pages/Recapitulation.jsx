import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import useUIStore from '../stores/uiStore';
import { RespondentDB, FamilyMemberDB, BusinessDetailDB, FamilyExpenseDB, DeletedRecordDB } from '../db/db';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Recapitulation() {
  const { respondentId } = useParams();
  const navigate = useNavigate();
  const addToast = useUIStore(state => state.addToast);
  const showConfirm = useUIStore(state => state.showConfirm);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showR26, setShowR26] = useState(true);
  const [showR27, setShowR27] = useState(true);
  const [showKeluarga, setShowKeluarga] = useState(true);

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
      
      // R26 fields
      const upah = parseInt(business.r26a_upah || business.total_upah_bulan || business.upah) || 0;
      const biayaProduksi = parseInt(business.r26b_produksi || business.biaya_produksi_bulan || business.biaya_produksi) || 0;
      const biayaBarangTerjual = parseInt(business.r26c_barang_dagangan || business.biaya_pembelian_barang_bulan || business.biaya_barang_terjual) || 0;
      const operasional = parseInt(business.r26d_operasional || business.operasional_bulan || business.operasional) || 0;
      const nonOperasional = parseInt(business.r26e_non_operasional || business.non_operasional_bulan || business.non_operasional) || 0;
      const pengeluaranUsaha = parseInt(business.total_pengeluaran_usaha_bulan || business.pengeluaran_usaha_bulan) || (upah + biayaProduksi + biayaBarangTerjual + operasional + nonOperasional);

      // R27 fields (new structure)
      const pendapatanBarangJasaTahun = parseInt(business.pendapatan_barang_jasa_tahun) || 0;
      const pendapatanLainnyaTahun = parseInt(business.pendapatan_lainnya_tahun) || 0;
      const totalPendapatanTahun = parseInt(business.total_pendapatan_tahun) || (pendapatanBarangJasaTahun + pendapatanLainnyaTahun);

      // Backward compat: use pendapatan_total_bulan if new fields not available
      const pendapatanUsahaBulan = parseInt(business.pendapatan_total_bulan) || Math.round(totalPendapatanTahun / 12);
      const labaUsaha = pendapatanUsahaBulan - pengeluaranUsaha;

      const expense = await FamilyExpenseDB.get(respondentId) || {};
      const pengeluaranMakan = parseInt(expense.total_makan_bulan || expense.total_makanan_bulan) || 0;
      const pengeluaranNonMakan = parseInt(expense.total_non_makan_bulan || expense.total_non_makanan_bulan) || 0;
      const totalPengeluaranKeluarga = pengeluaranMakan + pengeluaranNonMakan;

      const surplusDefisit = labaUsaha + totalGajiIjarah - totalPengeluaranKeluarga;

      setData({
        block_id: res.block_id,
        nama_kpl_keluarga: res.nama_kpl_keluarga,
        // R26 detail
        upah,
        biayaProduksi,
        biayaBarangTerjual,
        operasional,
        nonOperasional,
        pengeluaranUsaha,
        // R27 detail
        pendapatanBarangJasaTahun,
        pendapatanLainnyaTahun,
        totalPendapatanTahun,
        // Kalkulasi
        pendapatanUsahaBulan,
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

  const handleDelete = () => {
    showConfirm({
      title: 'Hapus Draf',
      message: 'Apakah Anda yakin ingin menghapus data draft ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          let deletedInCloud = false;
          if (navigator.onLine) {
            // Hard delete in Supabase if online so it doesn't get pulled back
            const { error } = await supabase.from('respondents').delete().eq('id', respondentId);
            if (!error) deletedInCloud = true;
          }
          
          if (!deletedInCloud) {
            // Track deletion for offline sync
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

  const SectionHeader = ({ title, isOpen, onToggle }) => (
    <button 
      type="button"
      onClick={onToggle} 
      className="flex justify-between items-center w-full font-['Archivo_Black'] uppercase text-xl border-b-[3px] border-black pb-2 mb-4"
    >
      <span>{title}</span>
      {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
    </button>
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

      {/* RINCIAN 26 — PENGELUARAN */}
      <Card className="mb-6">
        <SectionHeader title="Rincian 26 — Pengeluaran" isOpen={showR26} onToggle={() => setShowR26(!showR26)} />
        {showR26 && (
          <>
            <RecapItem label="26.a. Total upah & gaji" value={data.upah} />
            <RecapItem label="26.b. Biaya produksi" value={data.biayaProduksi} />
            <RecapItem label="26.c. Biaya barang dagangan" value={data.biayaBarangTerjual} />
            <RecapItem label="26.d. Biaya operasional" value={data.operasional} />
            <RecapItem label="26.e. Biaya non-operasional" value={data.nonOperasional} />
            <RecapItem label="26.f. TOTAL PENGELUARAN (a+b+c+d+e)" value={data.pengeluaranUsaha} isBold={true} />
          </>
        )}
      </Card>

      {/* RINCIAN 27 — PENDAPATAN/PENJUALAN */}
      <Card className="mb-6">
        <SectionHeader title="Rincian 27 — Pendapatan" isOpen={showR27} onToggle={() => setShowR27(!showR27)} />
        {showR27 && (
          <>
            <RecapItem label="27.a. Penjualan barang & jasa / tahun" value={data.pendapatanBarangJasaTahun} />
            <RecapItem label="27.b. Pendapatan lainnya / tahun" value={data.pendapatanLainnyaTahun} />
            <RecapItem label="27.c. TOTAL PENDAPATAN (a+b) / tahun" value={data.totalPendapatanTahun} isBold={true} />
          </>
        )}
      </Card>

      {/* KALKULASI KELUARGA */}
      <Card className="mb-6">
        <SectionHeader title="Keluarga" isOpen={showKeluarga} onToggle={() => setShowKeluarga(!showKeluarga)} />
        {showKeluarga && (
          <>
            <RecapItem label="Gaji & Ijarah Anggota" value={data.totalGajiIjarah} />
            <RecapItem label="Pengeluaran Makan" value={data.pengeluaranMakan} />
            <RecapItem label="Pengeluaran Non-Makan" value={data.pengeluaranNonMakan} />
            <RecapItem label="TOTAL PENG. KELUARGA / bulan" value={data.totalPengeluaranKeluarga} isBold={true} />
          </>
        )}
      </Card>

      {/* SURPLUS / DEFISIT */}
      <Card className={`mb-6 border-[5px] ${data.surplusDefisit >= 0 ? 'border-[#008000] bg-[#E5F2E5]' : 'border-[#FF0000] bg-[#FFE5E5]'}`}>
        <h4 className="font-['Archivo_Black'] uppercase mb-2 text-xl border-b-[3px] border-black pb-2">Kalkulasi Akhir</h4>
        <RecapItem label="Laba Bersih Usaha / bulan" value={data.labaUsaha} />
        <RecapItem label="Total Peng. Keluarga / bulan" value={data.totalPengeluaranKeluarga} />
        <div className="flex justify-between items-center mt-4 pt-4 border-t-[3px] border-black">
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
          Kembali ke Detail Blok
        </Button>
        <Button className="w-full" variant="destructive" onClick={handleDelete}>
          Hapus Data
        </Button>
      </div>
    </MainLayout>
  );
}
