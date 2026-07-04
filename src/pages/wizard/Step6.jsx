import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { AssetsConditionDB } from '../../db/db';

export default function Step6({ respondentId, onNext, setDirty, isEditMode }) {
  const [data, setData] = useState({
    status_kepemilikan_rumah: 'Milik Sendiri',
    luas_lantai: '',
    jenis_lantai: 'Keramik',
    jenis_dinding: 'Tembok',
    sumber_air_minum: 'Leding',
    sumber_penerangan: 'PLN'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const asset = await AssetsConditionDB.get(respondentId);
    if (asset) {
      setData({
        status_kepemilikan_rumah: asset.status_kepemilikan_rumah || 'Milik Sendiri',
        luas_lantai: asset.luas_lantai || '',
        jenis_lantai: asset.jenis_lantai || 'Keramik',
        jenis_dinding: asset.jenis_dinding || 'Tembok',
        sumber_air_minum: asset.sumber_air_minum || 'Leding',
        sumber_penerangan: asset.sumber_penerangan || 'PLN'
      });
    }
  };

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const saveFunction = async () => {
      await AssetsConditionDB.put({
        respondent_id: respondentId,
        ...data,
        luas_lantai: parseInt(data.luas_lantai) || 0
      });
    };

    onNext(data, saveFunction);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Aset & Kondisi Hunian</h4>
        
        <Select 
          label="Status Kepemilikan Bangunan Tempat Tinggal" 
          value={data.status_kepemilikan_rumah} 
          onChange={e => handleChange('status_kepemilikan_rumah', e.target.value)}
          options={[
            {label: 'Milik Sendiri', value: 'Milik Sendiri'},
            {label: 'Kontrak / Sewa', value: 'Kontrak / Sewa'},
            {label: 'Bebas Sewa', value: 'Bebas Sewa'},
            {label: 'Dinas', value: 'Dinas'},
            {label: 'Lainnya', value: 'Lainnya'}
          ]}
        />
        
        <Input 
          label="Luas Lantai (m²)" 
          type="number" 
          value={data.luas_lantai} 
          onChange={e => handleChange('luas_lantai', e.target.value)} 
        />
        
        <Select 
          label="Jenis Lantai Terluas" 
          value={data.jenis_lantai} 
          onChange={e => handleChange('jenis_lantai', e.target.value)}
          options={[
            {label: 'Marmer / Granit / Keramik', value: 'Keramik'},
            {label: 'Semen / Bata Merah', value: 'Semen'},
            {label: 'Kayu / Papan', value: 'Kayu'},
            {label: 'Tanah', value: 'Tanah'},
            {label: 'Lainnya', value: 'Lainnya'}
          ]}
        />
        
        <Select 
          label="Jenis Dinding Terluas" 
          value={data.jenis_dinding} 
          onChange={e => handleChange('jenis_dinding', e.target.value)}
          options={[
            {label: 'Tembok', value: 'Tembok'},
            {label: 'Kayu / Papan', value: 'Kayu'},
            {label: 'Bambu / Anyaman', value: 'Bambu'},
            {label: 'Lainnya', value: 'Lainnya'}
          ]}
        />
        
        <Select 
          label="Sumber Air Minum Utama" 
          value={data.sumber_air_minum} 
          onChange={e => handleChange('sumber_air_minum', e.target.value)}
          options={[
            {label: 'Leding / Air Kemasan / Isi Ulang', value: 'Leding'},
            {label: 'Sumur Bor / Pompa', value: 'Sumur'},
            {label: 'Mata Air', value: 'Mata Air'},
            {label: 'Air Sungai / Hujan', value: 'Sungai'},
            {label: 'Lainnya', value: 'Lainnya'}
          ]}
        />
        
        <Select 
          label="Sumber Penerangan Utama" 
          value={data.sumber_penerangan} 
          onChange={e => handleChange('sumber_penerangan', e.target.value)}
          options={[
            {label: 'Listrik PLN', value: 'PLN'},
            {label: 'Listrik Non-PLN', value: 'Non-PLN'},
            {label: 'Bukan Listrik', value: 'Bukan Listrik'}
          ]}
        />
      </Card>

      <Button type="submit" className="w-full">
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Simpan & Selesai'}
      </Button>
    </form>
  );
}
