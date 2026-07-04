import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { BusinessDetailDB } from '../../db/db';
import { Calculator } from 'lucide-react';

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
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Pengeluaran Usaha (Per Bulan)</h4>
        
        <CurrencyInput label="Total Upah Pekerja" value={data.upah} onChange={e => handleChange('upah', e.target.value)} />
        
        <div className="relative mb-4">
          <div className="flex justify-between items-end mb-1">
            <label className="font-['Archivo_Black'] text-sm uppercase text-black">Biaya Produksi</label>
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
        
        <CurrencyInput label="Biaya Pembelian Barang Terjual" value={data.biaya_barang_terjual} onChange={e => handleChange('biaya_barang_terjual', e.target.value)} />
        <CurrencyInput label="Operasional (Listrik, BBM, Air, dll)" value={data.operasional} onChange={e => handleChange('operasional', e.target.value)} />
        <CurrencyInput label="Non-Operasional (Perawatan, dll)" value={data.non_operasional} onChange={e => handleChange('non_operasional', e.target.value)} />
        
        <div className="bg-black text-white p-4 mt-6 border-[3px] border-black flex justify-between items-center font-['Space_Mono']">
          <span className="font-bold">TOTAL / BULAN</span>
          <span className="text-xl">
            Rp {(parseInt(data.upah||0) + parseInt(data.biaya_produksi||0) + parseInt(data.biaya_barang_terjual||0) + parseInt(data.operasional||0) + parseInt(data.non_operasional||0)).toLocaleString('id-ID')}
          </span>
        </div>
      </Card>

      <Button type="submit" className="w-full">
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Lanjut (Simpan)'}
      </Button>
    </form>
  );
}
