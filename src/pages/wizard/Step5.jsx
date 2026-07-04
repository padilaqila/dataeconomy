import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { FamilyExpenseDB } from '../../db/db';

export default function Step5({ respondentId, onNext, setDirty, isEditMode }) {
  const categories = [
    { id: 'perumahan', label: 'Perumahan, Listrik, Air & BBM' },
    { id: 'pakaian', label: 'Pakaian & Alas Kaki' },
    { id: 'kesehatan_pendidikan', label: 'Kesehatan & Pendidikan' },
    { id: 'pajak_asuransi', label: 'Pajak & Asuransi' },
    { id: 'pesta_sosial', label: 'Keperluan Pesta / Sosial' }
  ];

  const [data, setData] = useState({});

  useEffect(() => {
    const initData = {};
    categories.forEach(c => {
      initData[c.id] = { nilai: '', periode: 'Bulan' };
    });
    setData(initData);
    loadData();
  }, []);

  const loadData = async () => {
    const ex = await FamilyExpenseDB.get(respondentId);
    if (ex && ex.rincian_non_makan) {
      try {
        const parsed = JSON.parse(ex.rincian_non_makan);
        setData(parsed);
      } catch (e) { }
    }
  };

  const handleChange = (id, field, value) => {
    setData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
    setDirty(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const saveFunction = async () => {
      const existing = await FamilyExpenseDB.get(respondentId) || { respondent_id: respondentId };
      
      let totalNonMakan = 0;
      Object.keys(data).forEach(k => {
        const item = data[k];
        const val = parseInt(item.nilai) || 0;
        let perBulan = val;
        if (item.periode === 'Tahun') perBulan = Math.round(val / 12);
        totalNonMakan += perBulan;
      });

      await FamilyExpenseDB.put({
        ...existing,
        rincian_non_makan: JSON.stringify(data),
        total_non_makanan_bulan: totalNonMakan
      });
    };

    onNext(data, saveFunction);
  };

  if (Object.keys(data).length === 0) return null;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-2 text-xl">Pengeluaran Non-Makanan</h4>
        <p className="font-['Space_Mono'] text-sm text-gray-600 mb-6">Pilih periode, sistem akan menghitung per bulannya secara otomatis.</p>
        
        {categories.map(c => (
          <div key={c.id} className="mb-6 border-b-[3px] border-black pb-4 border-dashed last:border-0">
            <h5 className="font-['Archivo_Black'] text-[15px] mb-2">{c.label}</h5>
            <div className="flex gap-2">
              <div className="flex-1">
                <CurrencyInput 
                  placeholder="Rp..." 
                  value={data[c.id]?.nilai || ''} 
                  onChange={e => handleChange(c.id, 'nilai', e.target.value)} 
                />
              </div>
              <div className="w-[120px]">
                <Select 
                  value={data[c.id]?.periode || 'Bulan'} 
                  onChange={e => handleChange(c.id, 'periode', e.target.value)}
                  options={[
                    {label: 'Bulan', value: 'Bulan'},
                    {label: 'Tahun', value: 'Tahun'}
                  ]}
                />
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Button type="submit" className="w-full">
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Lanjut (Simpan)'}
      </Button>
    </form>
  );
}
