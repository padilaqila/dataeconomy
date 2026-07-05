import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Select from '../../components/Select';
import Button from '../../components/Button';
import { FinancialRecordDB } from '../../db/db';

export default function ModuleRumahTangga({ recordId, onFinish, setDirty }) {
  const [data, setData] = useState({
    pengeluaran: []
  });

  useEffect(() => {
    loadData();
  }, [recordId]);

  const loadData = async () => {
    const record = await FinancialRecordDB.getById(recordId);
    if (record && record.module_data && record.module_data.pengeluaran) {
      setData(record.module_data);
    } else {
      setData({ pengeluaran: [] });
    }
  };

  const addRow = () => {
    setData(prev => ({
      ...prev,
      pengeluaran: [
        ...prev.pengeluaran,
        { id: Date.now(), item: '', freq: 'Bulan', nilai: '' }
      ]
    }));
    setDirty(true);
  };

  const removeRow = (id) => {
    setData(prev => ({
      ...prev,
      pengeluaran: prev.pengeluaran.filter(p => p.id !== id)
    }));
    setDirty(true);
  };

  const handleChange = (id, field, value) => {
    setData(prev => ({
      ...prev,
      pengeluaran: prev.pengeluaran.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
    setDirty(true);
  };

  const handleSimpan = async () => {
    try {
      // Hitung total bulanan dan tahunan
      let totalMonthly = 0;
      let totalYearly = 0;

      data.pengeluaran.forEach(p => {
        const val = parseInt(p.nilai) || 0;
        if (p.freq === 'Hari') {
          totalMonthly += val * 30;
          totalYearly += val * 365;
        } else if (p.freq === 'Minggu') {
          totalMonthly += val * 4;
          totalYearly += val * 52;
        } else {
          totalMonthly += val;
          totalYearly += val * 12;
        }
      });

      const existing = await FinancialRecordDB.getById(recordId);
      await FinancialRecordDB.put({
        ...existing,
        module_data: data,
        total_expense_monthly: totalMonthly,
        total_expense_yearly: totalYearly
      });

      onFinish();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Keuangan Rumah Tangga</h4>
        <p className="font-['Work_Sans'] mb-4 text-gray-700">
          Masukkan pengeluaran rutin keluarga. Anda dapat memilih frekuensi pengeluaran sesuai jawaban responden, sistem akan menghitung total bulanannya secara otomatis.
        </p>

        {data.pengeluaran.map((p, index) => (
          <div key={p.id} className="border-[3px] border-black p-4 mb-4 relative bg-[#F9F9F9]">
            <button 
              type="button" 
              onClick={() => removeRow(p.id)} 
              className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center font-bold border-l-[3px] border-b-[3px] border-black"
            >
              X
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="Nama Pengeluaran (Beras, Listrik, dll)" 
                value={p.item} 
                onChange={e => handleChange(p.id, 'item', e.target.value)} 
              />
              <Select 
                label="Frekuensi" 
                value={p.freq} 
                onChange={e => handleChange(p.id, 'freq', e.target.value)}
                options={[
                  { label: 'Harian', value: 'Hari' },
                  { label: 'Mingguan', value: 'Minggu' },
                  { label: 'Bulanan', value: 'Bulan' }
                ]}
              />
              <CurrencyInput 
                label="Nilai (Rp)" 
                value={p.nilai} 
                onChange={e => handleChange(p.id, 'nilai', e.target.value)} 
              />
            </div>
          </div>
        ))}

        <Button type="button" variant="secondary" onClick={addRow} className="w-full border-dashed mb-6">
          + Tambah Pengeluaran
        </Button>

        <Button type="button" className="w-full" onClick={handleSimpan}>
          Hitung, Simpan & Selesai
        </Button>
      </Card>
    </div>
  );
}
