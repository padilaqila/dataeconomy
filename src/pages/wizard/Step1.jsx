import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { RespondentDB, FamilyMemberDB } from '../../db/db';
import { Plus, X } from 'lucide-react';

export default function Step1({ respondentId, onNext, setDirty, isEditMode }) {
  const [data, setData] = useState({
    no_bangunan: '',
    no_urut_kk: '',
    nomor_kk: '',
    nama_kpl_keluarga: '',
    alamat: ''
  });
  
  const [members, setMembers] = useState([]);

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
    const mems = await FamilyMemberDB.getAllByRespondent(respondentId);
    setMembers(mems);
  };

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
    setDirty(true);
  };

  const addMember = () => {
    setMembers([...members, { 
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      respondent_id: respondentId, 
      nama: '', 
      pekerjaan: '', 
      gaji: '', 
      ijarah: '', 
      status_tinggal: '1' 
    }]);
    setDirty(true);
  };

  const removeMember = (index) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
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
      
      await FamilyMemberDB.deleteByRespondent(respondentId);
      if (members.length > 0) {
        await FamilyMemberDB.bulkAdd(members.map(m => ({
          ...m,
          gaji: parseInt(m.gaji) || 0,
          ijarah: parseInt(m.ijarah) || 0
        })));
      }
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

      <Card className="mb-6 p-0 border-none">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-['Archivo_Black'] uppercase text-xl">Anggota Keluarga</h4>
        </div>
        
        {members.map((mem, idx) => (
          <div key={mem.id} className="border-[3px] border-black p-4 mb-4 relative bg-[#F9F9F9]">
            <button 
              type="button" 
              onClick={() => removeMember(idx)} 
              className="absolute top-0 right-0 bg-[#FF0000] text-white w-10 h-10 flex items-center justify-center font-bold border-l-[3px] border-b-[3px] border-black hover:bg-black active:bg-black"
            >
              <X strokeWidth={3} />
            </button>
            <h5 className="font-['Archivo_Black'] mb-3">#{idx + 1}</h5>
            <Input label="Nama" value={mem.nama} onChange={e => handleMemberChange(idx, 'nama', e.target.value)} required />
            <Input label="Pekerjaan" value={mem.pekerjaan} onChange={e => handleMemberChange(idx, 'pekerjaan', e.target.value)} />
            <CurrencyInput label="Gaji/Bulan (Rp)" value={mem.gaji} onChange={e => handleMemberChange(idx, 'gaji', e.target.value)} />
            <Select label="Status Tinggal" value={mem.status_tinggal} onChange={e => handleMemberChange(idx, 'status_tinggal', e.target.value)} options={[
              {label: 'Tinggal Bersama', value: '1'},
              {label: 'Di Luar Kota/Mondok', value: '2'}
            ]} />
          </div>
        ))}

        <Button type="button" variant="secondary" onClick={addMember} className="w-full border-dashed">
          <Plus className="mr-2" /> Tambah Anggota
        </Button>
      </Card>

      <Button type="submit" className="w-full">
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Lanjut (Simpan)'}
      </Button>
    </form>
  );
}
