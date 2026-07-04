import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { BusinessDetailDB } from '../../db/db';
import { Calculator, AlertTriangle } from 'lucide-react';

export default function Step2({ respondentId, onNext, setDirty, isEditMode }) {
  const [data, setData] = useState({
    jenis_usaha: '',
    jenis_barang: '',
    tahun_mulai: '',
    nib: '',
    alamat_usaha: '',
    upah: '',
    biaya_produksi: '',
    biaya_barang_terjual: '',
    operasional: '',
    non_operasional: ''
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
        jenis_usaha: b.jenis_usaha || '',
        jenis_barang: b.jenis_barang || '',
        tahun_mulai: b.tahun_mulai || '',
        nib: b.nib || '',
        alamat_usaha: b.alamat_usaha || '',
        upah: b.upah || '',
        biaya_produksi: b.biaya_produksi || '',
        biaya_barang_terjual: b.biaya_barang_terjual || '',
        operasional: b.operasional || '',
        non_operasional: b.non_operasional || ''
      });
    }
  };

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleHelperChange = (field, value) => {
    setHelperData(prev => ({ ...prev, [field]: value }));
  };

  const applyHelper = () => {
    const nilai = parseInt(helperData.nilai) || 0;
    let hasil = 0;
    
    switch(helperData.periode) {
      case 'Hari': hasil = nilai * 30; break;
      case 'Minggu': hasil = nilai * 4; break;
      case 'Bulan': hasil = nilai; break;
      case 'Tahun': hasil = Math.round(nilai / 12); break;
      case 'Musiman':
        const siklus = helperData.lama_siklus === 'Lainnya' 
          ? (parseInt(helperData.lama_siklus_custom) || 1) 
          : (parseInt(helperData.lama_siklus) || 1);
        hasil = Math.round(nilai / siklus);
        break;
      default: hasil = nilai;
    }
    
    handleChange('biaya_produksi', hasil);
    setShowHelper(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const saveFunction = async () => {
      const upah = parseInt(data.upah) || 0;
      const produksi = parseInt(data.biaya_produksi) || 0;
      const terjual = parseInt(data.biaya_barang_terjual) || 0;
      const ops = parseInt(data.operasional) || 0;
      const non_ops = parseInt(data.non_operasional) || 0;
      
      const total = upah + produksi + terjual + ops + non_ops;
      
      await BusinessDetailDB.put({
        respondent_id: respondentId,
        jenis_usaha: data.jenis_usaha,
        nib: data.nib,
        jenis_barang: data.jenis_barang,
        tahun_mulai: data.tahun_mulai,
        alamat_usaha: data.alamat_usaha,
        upah,
        biaya_produksi: produksi,
        biaya_barang_terjual: terjual,
        operasional: ops,
        non_operasional: non_ops,
        pengeluaran_usaha_bulan: total
      });
    };

    onNext(data, saveFunction);
  };

  const totalPengeluaran = (parseInt(data.upah||0) + parseInt(data.biaya_produksi||0) + parseInt(data.biaya_barang_terjual||0) + parseInt(data.operasional||0) + parseInt(data.non_operasional||0));

  // Validasi BPS: upah wajib > 50.000 jika ada pekerja dibayar
  const showUpahWarning = parseInt(data.upah || 0) > 0 && parseInt(data.upah || 0) < 50000;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Profil Usaha</h4>
        <Input label="Jenis Usaha" value={data.jenis_usaha} onChange={e => handleChange('jenis_usaha', e.target.value)} required />
        <Input label="Jenis Barang/Jasa Utama" value={data.jenis_barang} onChange={e => handleChange('jenis_barang', e.target.value)} />
        <Input label="Tahun Mulai Beroperasi" type="number" value={data.tahun_mulai} onChange={e => handleChange('tahun_mulai', e.target.value)} />
        <Input label="NIB" value={data.nib} onChange={e => handleChange('nib', e.target.value)} />
        <Input label="Alamat Usaha" value={data.alamat_usaha} onChange={e => handleChange('alamat_usaha', e.target.value)} />
      </Card>

      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-2 text-xl">Rincian 26 — Pengeluaran Usaha</h4>
        <p className="font-['Space_Mono'] text-[12px] text-gray-600 mb-6">Satuan: per bulan. Isi sesuai Rincian 26 kuesioner BPS.</p>
        
        <CurrencyInput 
          label="26.a. Total upah dan gaji, serta jaminan sosial pegawai" 
          value={data.upah} 
          onChange={e => handleChange('upah', e.target.value)} 
        />
        {showUpahWarning && (
          <div className="flex items-start gap-2 bg-[#FFF3E0] border-[3px] border-[#FF6600] p-3 mb-4 -mt-2">
            <AlertTriangle size={18} className="text-[#FF6600] flex-shrink-0 mt-0.5" />
            <p className="font-['Space_Mono'] text-[12px] text-[#FF6600]">
              Nilai R26a wajib &gt; Rp 50.000 jika ada pekerja dibayar (R24a2 &gt; 0)
            </p>
          </div>
        )}
        
        <div className="relative mb-4">
          <div className="flex justify-between items-end mb-1">
            <label className="font-['Archivo_Black'] text-sm uppercase text-black">26.b. Biaya produksi</label>
            <button type="button" onClick={() => setShowHelper(!showHelper)} className="text-[12px] font-['Space_Mono'] underline text-[#0000FF] flex items-center">
              <Calculator size={14} className="mr-1" /> Panel Musiman
            </button>
          </div>
          
          {showHelper && (
            <div className="bg-[#F9F9F9] border-[3px] border-black p-4 mb-2">
              <h5 className="font-['Archivo_Black'] text-sm mb-3">Kalkulator Bantu (Otomatis ke Bulan)</h5>
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
              
              <CurrencyInput label="Nilai Pengeluaran" value={helperData.nilai} onChange={e => handleHelperChange('nilai', e.target.value)} />
              <Button type="button" onClick={applyHelper} className="w-full">Terapkan</Button>
            </div>
          )}
          
          <CurrencyInput 
            className="!mb-0"
            value={data.biaya_produksi}
            onChange={e => handleChange('biaya_produksi', e.target.value)}
          />
        </div>
        
        <CurrencyInput label="26.c. Biaya pembelian barang dagangan" value={data.biaya_barang_terjual} onChange={e => handleChange('biaya_barang_terjual', e.target.value)} />
        <CurrencyInput label="26.d. Biaya operasional (air, listrik, gas, internet, pulsa, pemeliharaan, biaya angkutan, dll.)" value={data.operasional} onChange={e => handleChange('operasional', e.target.value)} />
        <CurrencyInput label="26.e. Biaya non-operasional" value={data.non_operasional} onChange={e => handleChange('non_operasional', e.target.value)} />
        
        <div className="bg-black text-white p-4 mt-6 border-[3px] border-black">
          <p className="font-['Archivo_Black'] text-sm uppercase mb-1">26.f. Total pengeluaran (a+b+c+d+e)</p>
          <p className="font-['Space_Mono'] text-xl text-right">
            Rp {totalPengeluaran.toLocaleString('id-ID')}
          </p>
        </div>
      </Card>

      <Button type="submit" className="w-full">
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Lanjut (Simpan)'}
      </Button>
    </form>
  );
}
