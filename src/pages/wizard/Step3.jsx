import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { BusinessDetailDB } from '../../db/db';
import { Calculator, AlertTriangle } from 'lucide-react';

export default function Step3({ respondentId, onNext, setDirty, isEditMode }) {
  const [data, setData] = useState({
    pendapatan_barang_jasa_bulan: '',
    pendapatan_barang_jasa_tahun: '',
    pendapatan_lainnya_bulan: '',
    pendapatan_lainnya_tahun: '',
    total_aset_usaha: ''
  });

  const [showHelper, setShowHelper] = useState(false);
  const [helperData, setHelperData] = useState({
    periode: '',
    lama_siklus: '',
    lama_siklus_custom: '',
    nilai: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const b = await BusinessDetailDB.get(respondentId);
    if (b) {
      setData({
        pendapatan_barang_jasa_bulan: b.pendapatan_barang_jasa_bulan || b.pendapatan_total_bulan || '',
        pendapatan_barang_jasa_tahun: b.pendapatan_barang_jasa_tahun || b.pendapatan_total_tahun || '',
        pendapatan_lainnya_bulan: b.pendapatan_lainnya_bulan || '',
        pendapatan_lainnya_tahun: b.pendapatan_lainnya_tahun || '',
        total_aset_usaha: b.total_aset_usaha || ''
      });
    }
  };

  const handleChange = (field, value) => {
    setData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'pendapatan_lainnya_bulan' && value !== '') {
        newData.pendapatan_lainnya_tahun = parseInt(value) * 12;
      }
      return newData;
    });
    setDirty(true);
  };

  const handleTahunOverride = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleHelperChange = (field, value) => {
    setHelperData(prev => ({ ...prev, [field]: value }));
  };

  const applyHelper = () => {
    const nilai = parseInt(helperData.nilai) || 0;
    let hasilBulan = 0;
    let hasilTahun = 0;
    
    switch(helperData.periode) {
      case 'Hari': 
        hasilBulan = nilai * 30; 
        hasilTahun = hasilBulan * 12;
        break;
      case 'Minggu': 
        hasilBulan = nilai * 4; 
        hasilTahun = hasilBulan * 12;
        break;
      case 'Bulan': 
        hasilBulan = nilai; 
        hasilTahun = nilai * 12;
        break;
      case 'Tahun': 
        hasilTahun = nilai; 
        hasilBulan = Math.round(nilai / 12);
        break;
      case 'Musiman':
        const siklus = helperData.lama_siklus === 'Lainnya' 
          ? (parseInt(helperData.lama_siklus_custom) || 1) 
          : (parseInt(helperData.lama_siklus) || 1);
        hasilTahun = Math.round((12 / siklus) * nilai);
        hasilBulan = Math.round(hasilTahun / 12);
        break;
      default: 
        hasilBulan = nilai;
        hasilTahun = nilai * 12;
    }
    
    setData(prev => ({
      ...prev,
      pendapatan_lainnya_bulan: hasilBulan,
      pendapatan_lainnya_tahun: hasilTahun
    }));
    setDirty(true);
    setShowHelper(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const saveFunction = async () => {
      const existing = await BusinessDetailDB.get(respondentId) || { respondent_id: respondentId };
      
      const barangJasaTahun = parseInt(data.pendapatan_barang_jasa_tahun) || 0;
      const lainnyaTahun = parseInt(data.pendapatan_lainnya_tahun) || 0;
      const totalTahun = barangJasaTahun + lainnyaTahun;
      const totalBulan = Math.round(totalTahun / 12);
      
      await BusinessDetailDB.put({
        ...existing,
        // Don't overwrite the barang_jasa fields, they were computed in Step 2.
        // We just ensure they are saved back as is.
        pendapatan_lainnya_bulan: parseInt(data.pendapatan_lainnya_bulan) || 0,
        pendapatan_lainnya_tahun: lainnyaTahun,
        total_pendapatan_tahun: totalTahun,
        pendapatan_total_bulan: totalBulan, // For backward compatibility
        pendapatan_total_tahun: totalTahun,
        total_aset_usaha: parseInt(data.total_aset_usaha) || 0
      });
    };

    onNext(data, saveFunction);
  };

  const totalPendapatanTahun = (parseInt(data.pendapatan_barang_jasa_tahun || 0)) + (parseInt(data.pendapatan_lainnya_tahun || 0));
  const showMinWarning = totalPendapatanTahun > 0 && totalPendapatanTahun < 100000;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-2 text-xl">Rincian 27 — Pendapatan</h4>
        <p className="font-['Space_Mono'] text-[12px] text-gray-600 mb-6">Tahun 2025. Pendapatan Usaha telah dikalkulasi otomatis dari Step sebelumnya.</p>

        {/* 27.a — Penjualan Barang & Jasa */}
        <div className="mb-6 pb-4 border-b-[3px] border-black border-dashed opacity-80">
          <label className="font-['Archivo_Black'] text-sm uppercase text-black mb-3 block">27.a. Nilai produksi/pendapatan utama (Otomatis)</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-['Space_Mono'] text-gray-500 mb-1">/ Bulan (Rp)</label>
              <div className="bg-gray-100 p-3 border-[3px] border-black font-['Space_Mono'] text-base">
                {parseInt(data.pendapatan_barang_jasa_bulan || 0).toLocaleString('id-ID')}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-['Space_Mono'] text-gray-500 mb-1">/ Tahun (Rp)</label>
              <div className="bg-gray-100 p-3 border-[3px] border-black font-['Space_Mono'] text-base">
                {parseInt(data.pendapatan_barang_jasa_tahun || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* 27.b — Pendapatan Lainnya */}
        <div className="mb-6 pb-4 border-b-[3px] border-black border-dashed">
          <div className="flex justify-between items-start mb-1">
            <label className="font-['Archivo_Black'] text-sm uppercase text-black flex-1 pr-2">27.b. Pendapatan lainnya yang dihasilkan perusahaan</label>
            <button type="button" onClick={() => setShowHelper(!showHelper)} className="text-[12px] font-['Space_Mono'] underline text-[#0000FF] flex items-center flex-shrink-0">
              <Calculator size={14} className="mr-1" /> Bantu
            </button>
          </div>

          {showHelper && (
            <div className="bg-[#F9F9F9] border-[3px] border-black p-4 mb-4">
              <h5 className="font-['Archivo_Black'] text-sm mb-3">Kalkulator Bantu (Auto Bulan & Tahun)</h5>
              <Select 
                label="Periode" 
                value={helperData.periode} 
                onChange={e => handleHelperChange('periode', e.target.value)}
                options={[
                  {label: 'Hari', value: 'Hari'},
                  {label: 'Minggu', value: 'Minggu'},
                  {label: 'Bulan', value: 'Bulan'},
                  {label: 'Musiman', value: 'Musiman'},
                  {label: 'Tahun', value: 'Tahun'}
                ]}
              />
              {helperData.periode === 'Musiman' && (
                <Select 
                  label="Lama Siklus" 
                  value={helperData.lama_siklus} 
                  onChange={e => handleHelperChange('lama_siklus', e.target.value)}
                  options={[
                    {label: '3 Bulan', value: '3'},
                    {label: '4 Bulan', value: '4'},
                    {label: '6 Bulan', value: '6'},
                    {label: '12 Bulan', value: '12'},
                    {label: 'Lainnya', value: 'Lainnya'}
                  ]}
                />
              )}
              {helperData.periode === 'Musiman' && helperData.lama_siklus === 'Lainnya' && (
                <Input label="Berapa Bulan?" type="number" value={helperData.lama_siklus_custom} onChange={e => handleHelperChange('lama_siklus_custom', e.target.value)} />
              )}
              <CurrencyInput label="Nilai Pendapatan" value={helperData.nilai} onChange={e => handleHelperChange('nilai', e.target.value)} />
              <div className="flex gap-2">
                <Button type="button" onClick={applyHelper} className="flex-1">Terapkan</Button>
                <Button type="button" variant="secondary" onClick={() => setShowHelper(false)} className="flex-1">Batal</Button>
              </div>
            </div>
          )}
          
          <CurrencyInput 
            label="/ Bulan (Rp)" 
            value={data.pendapatan_lainnya_bulan} 
            onChange={e => handleChange('pendapatan_lainnya_bulan', e.target.value)} 
          />
          <CurrencyInput 
            label="/ Tahun (Rp)" 
            value={data.pendapatan_lainnya_tahun} 
            onChange={e => handleTahunOverride('pendapatan_lainnya_tahun', e.target.value)} 
          />
        </div>

        {/* 27.c — Total (auto) */}
        <div className="bg-black text-white p-4 border-[3px] border-black">
          <p className="font-['Archivo_Black'] text-sm uppercase mb-1">27.c. Total nilai pendapatan/penjualan (a+b)</p>
          <p className="font-['Space_Mono'] text-xl text-right">
            Rp {totalPendapatanTahun.toLocaleString('id-ID')}
          </p>
        </div>

        {showMinWarning && (
          <div className="flex items-start gap-2 bg-[#FFF3E0] border-[3px] border-[#FF6600] p-3 mt-3">
            <AlertTriangle size={18} className="text-[#FF6600] flex-shrink-0 mt-0.5" />
            <p className="font-['Space_Mono'] text-[12px] text-[#FF6600]">
              Nilai minimal Rp 100.000 untuk total pendapatan/penjualan
            </p>
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Aset Usaha</h4>
        <CurrencyInput label="Total Perkiraan Aset Usaha (Rp)" value={data.total_aset_usaha} onChange={e => handleChange('total_aset_usaha', e.target.value)} helperText="Perkiraan kasar nilai bangunan/kendaraan yang murni untuk usaha" />
      </Card>

      <Button type="submit" className="w-full">
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Lanjut (Simpan)'}
      </Button>
    </form>
  );
}
