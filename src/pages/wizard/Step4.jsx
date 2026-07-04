import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { FamilyExpenseDB } from '../../db/db';

export default function Step4({ respondentId, onNext, setDirty, isEditMode }) {
  // PRD Step 4: Padi, Palawija, Daging, Ikan, Sayur, Buah, Makanan Jadi, Rokok
  const categories = [
    { id: 'padi', label: 'Padi-padian' },
    { id: 'palawija', label: 'Umbi-umbian / Palawija' },
    { id: 'daging', label: 'Daging, Telur & Susu' },
    { id: 'ikan', label: 'Ikan' },
    { id: 'sayur', label: 'Sayuran & Buah' },
    { id: 'minuman', label: 'Minuman & Bumbu' },
    { id: 'makanan_jadi', label: 'Makanan Jadi / Jajan' },
    { id: 'rokok', label: 'Rokok & Tembakau' }
  ];

  const [data, setData] = useState({});

  useEffect(() => {
    // Initialize empty state based on categories
    const initData = {};
    categories.forEach(c => {
      initData[c.id] = { nilai: '', periode: 'Minggu' };
    });
    setData(initData);
    loadData();
  }, []);

  const loadData = async () => {
    const ex = await FamilyExpenseDB.get(respondentId);
    if (ex && ex.rincian_makan) {
      try {
        const parsed = JSON.parse(ex.rincian_makan);
        setData(parsed);
      } catch (e) {
        // ignore
      }
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
      
      // Calculate total makanan (convert everything to month)
      let totalMakan = 0;
      Object.keys(data).forEach(k => {
        const item = data[k];
        const val = parseInt(item.nilai) || 0;
        let perBulan = val;
        if (item.periode === 'Hari') perBulan = val * 30;
        if (item.periode === 'Minggu') perBulan = val * 4;
        if (item.periode === 'Tahun') perBulan = Math.round(val / 12);
        totalMakan += perBulan;
      });

      await FamilyExpenseDB.put({
        ...existing,
        rincian_makan: JSON.stringify(data),
        total_makanan_bulan: totalMakan,
        total_makan_bulan: totalMakan
      });
    };

    onNext(data, saveFunction);
  };

  if (Object.keys(data).length === 0) return null;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-2 text-xl">Pengeluaran Makanan</h4>
        <p className="font-['Space_Mono'] text-sm text-gray-600 mb-6">Pilih periode yang paling mudah diingat responden, sistem akan menghitung per bulannya secara otomatis.</p>
        
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
                  value={data[c.id]?.periode || 'Minggu'} 
                  onChange={e => handleChange(c.id, 'periode', e.target.value)}
                  options={[
                    {label: 'Hari', value: 'Hari'},
                    {label: 'Minggu', value: 'Minggu'},
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
