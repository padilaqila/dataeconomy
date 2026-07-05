import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { RespondentDB } from '../../db/db';

export default function Step1({ respondentId, onNext, setDirty, isEditMode }) {
  const [data, setData] = useState({
    no_bangunan: '',
    no_urut_kk: '',
    nomor_kk: '',
    nama_kpl_keluarga: '',
    alamat: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await RespondentDB.getById(respondentId);
    if (res) {
      setData({
        no_bangunan: res.no_bangunan || '',
        no_urut_kk: res.no_urut_kk || '',
        nomor_kk: res.nomor_kk || '',
        nama_kpl_keluarga: res.nama_kpl_keluarga === 'Draft Baru' ? '' : (res.nama_kpl_keluarga || ''),
        alamat: res.alamat || ''
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
      await RespondentDB.update(respondentId, {
        no_bangunan: data.no_bangunan,
        no_urut_kk: data.no_urut_kk,
        nomor_kk: data.nomor_kk,
        nama_kpl_keluarga: data.nama_kpl_keluarga || 'Tanpa Nama',
        alamat: data.alamat,
        updated_at: Date.now()
      });
    };

    onNext(data, saveFunction);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Identitas Keluarga</h4>
        <Input label="No Bangunan" value={data.no_bangunan} onChange={e => handleChange('no_bangunan', e.target.value)} />
        <Input label="No Urut KK" value={data.no_urut_kk} onChange={e => handleChange('no_urut_kk', e.target.value)} />
        <Input label="Nomor KK (16 Digit)" type="number" value={data.nomor_kk} onChange={e => handleChange('nomor_kk', e.target.value)} />
        <Input label="Nama Kepala Keluarga" value={data.nama_kpl_keluarga} onChange={e => handleChange('nama_kpl_keluarga', e.target.value)} required />
        <Input label="Alamat" value={data.alamat} onChange={e => handleChange('alamat', e.target.value)} />
      </Card>

      <Button type="submit" className="w-full">
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Lanjut (Simpan)'}
      </Button>
    </form>
  );
}
