import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { BusinessDetailDB } from '../../db/db';
import { Calculator } from 'lucide-react';

export default function Step3({ respondentId, onNext, setDirty, isEditMode }) {
  const [data, setData] = useState({
    pendapatan_total_bulan: '',
    pendapatan_total_tahun: '',
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
        pendapatan_total_bulan: b.pendapatan_total_bulan || '',
        pendapatan_total_tahun: b.pendapatan_total_tahun || '',
        total_aset_usaha: b.total_aset_usaha || ''
      });
    }
  };

  const handleChange = (field, value) => {
    setData(prev => {
      const newData = { ...prev, [field]: value };
      // Auto calc tahun
      if (field === 'pendapatan_total_bulan' && value !== '') {
        newData.pendapatan_total_tahun = parseInt(value) * 12;
      }
      return newData;
    });
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
        
        // Asumsi nilai musiman terjadi 1x dalam siklus.
        // ex: panen 5jt per 4 bulan.
        // setahun: (12 / 4) * 5jt = 15jt
        // sebulan: 15jt / 12 = 1.25jt
        
        hasilTahun = Math.round((12 / siklus) * nilai);
        hasilBulan = Math.round(hasilTahun / 12);
        break;
      default: 
        hasilBulan = nilai;
        hasilTahun = nilai * 12;
    }
    
    setData(prev => ({
      ...prev,
      pendapatan_total_bulan: hasilBulan,
      pendapatan_total_tahun: hasilTahun
    }));
    setDirty(true);
    setShowHelper(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const saveFunction = async () => {
      // Get existing data to not overwrite Step 2
      const existing = await BusinessDetailDB.get(respondentId) || { respondent_id: respondentId };
      
      await BusinessDetailDB.put({
        ...existing,
        pendapatan_total_bulan: parseInt(data.pendapatan_total_bulan) || 0,
        pendapatan_total_tahun: parseInt(data.pendapatan_total_tahun) || 0,
        total_aset_usaha: parseInt(data.total_aset_usaha) || 0
      });
    };

    onNext(data, saveFunction);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <div className="flex justify-between items-end mb-4">
          <h4 className="font-['Archivo_Black'] uppercase text-xl">Pendapatan Usaha</h4>
          <button type="button" onClick={() => setShowHelper(!showHelper)} className="text-[12px] font-['Space_Mono'] underline text-[#0000FF] flex items-center">
            <Calculator size={14} className="mr-1" /> Panel Musiman
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
                  {label: 'Lainnya', value: 'Lainnya'}
                ]}
              />
            )}
            
            {helperData.periode === 'Musiman' && helperData.lama_siklus === 'Lainnya' && (
              <Input label="Berapa Bulan?" type="number" value={helperData.lama_siklus_custom} onChange={e => handleHelperChange('lama_siklus_custom', e.target.value)} />
            )}
            
            <CurrencyInput label="Nilai Pendapatan" value={helperData.nilai} onChange={e => handleHelperChange('nilai', e.target.value)} />
            <Button type="button" onClick={applyHelper} className="w-full">Terapkan</Button>
          </div>
        )}
        
        <CurrencyInput label="Pendapatan / Bulan (Rp)" value={data.pendapatan_total_bulan} onChange={e => handleChange('pendapatan_total_bulan', e.target.value)} />
        <CurrencyInput label="Pendapatan / Tahun (Rp)" value={data.pendapatan_total_tahun} onChange={e => setData(prev => ({...prev, pendapatan_total_tahun: e.target.value}))} />
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
