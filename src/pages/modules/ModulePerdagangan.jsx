import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Select from '../../components/Select';
import Button from '../../components/Button';
import { FinancialRecordDB } from '../../db/db';

export default function ModulePerdagangan({ recordId, onFinish, setDirty }) {
  const [data, setData] = useState({
    pendapatan: [], // Omset
    pengeluaran: [] // HPP & Operasional
  });

  useEffect(() => {
    loadData();
  }, [recordId]);

  const loadData = async () => {
    const record = await FinancialRecordDB.getById(recordId);
    if (record && record.module_data) {
      setData({
        pendapatan: record.module_data.pendapatan || [],
        pengeluaran: record.module_data.pengeluaran || []
      });
    }
  };

  const addList = (type) => {
    setData(prev => ({
      ...prev,
      [type]: [
        ...prev[type],
        { id: Date.now(), item: '', freq: 'Bulan', nilai: '' }
      ]
    }));
    setDirty(true);
  };

  const removeList = (type, id) => {
    setData(prev => ({
      ...prev,
      [type]: prev[type].filter(p => p.id !== id)
    }));
    setDirty(true);
  };

  const handleChangeList = (type, id, field, value) => {
    setData(prev => ({
      ...prev,
      [type]: prev[type].map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
    setDirty(true);
  };

  const calculateTotal = (list) => {
    let totalMonthly = 0;
    let totalYearly = 0;

    list.forEach(p => {
      const val = parseInt(p.nilai) || 0;
      if (p.freq === 'Hari') {
        totalMonthly += val * 30;
        totalYearly += val * 365;
      } else if (p.freq === 'Minggu') {
        totalMonthly += val * 4;
        totalYearly += val * 52;
      } else if (p.freq === 'Bulan') {
        totalMonthly += val;
        totalYearly += val * 12;
      }
    });
    return { totalMonthly, totalYearly };
  };

  const handleSimpan = async () => {
    try {
      const exp = calculateTotal(data.pengeluaran);
      const inc = calculateTotal(data.pendapatan);

      const existing = await FinancialRecordDB.getById(recordId);
      await FinancialRecordDB.put({
        ...existing,
        module_data: data,
        total_expense_monthly: exp.totalMonthly,
        total_expense_yearly: exp.totalYearly,
        total_income_monthly: inc.totalMonthly,
        total_income_yearly: inc.totalYearly
      });

      onFinish();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Sektor Perdagangan & Jasa</h4>
        <p className="font-['Work_Sans'] mb-4 text-gray-700">
          Masukkan omset pendapatan usaha serta biaya modal dagang (kulakan) dan operasional (karyawan, listrik toko).
        </p>

        {/* PENDAPATAN / OMSET */}
        <div className="mb-6">
          <h5 className="font-bold uppercase mb-4 text-green-700 border-b-2 border-black pb-2">Pendapatan / Omset Usaha</h5>
          {data.pendapatan.map((p) => (
            <div key={p.id} className="border-[3px] border-black p-4 mb-4 relative bg-[#F9F9F9]">
              <button 
                type="button" 
                onClick={() => removeList('pendapatan', p.id)} 
                className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center font-bold border-l-[3px] border-b-[3px] border-black"
              >
                X
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Sumber Omset" 
                  value={p.item} 
                  onChange={e => handleChangeList('pendapatan', p.id, 'item', e.target.value)} 
                  placeholder="Contoh: Penjualan Toko Kelontong"
                />
                <Select 
                  label="Frekuensi Pendapatan" 
                  value={p.freq} 
                  onChange={e => handleChangeList('pendapatan', p.id, 'freq', e.target.value)}
                  options={[
                    { label: 'Harian', value: 'Hari' },
                    { label: 'Mingguan', value: 'Minggu' },
                    { label: 'Bulanan', value: 'Bulan' }
                  ]}
                />
                <CurrencyInput 
                  label="Nilai Omset (Rp)" 
                  value={p.nilai} 
                  onChange={e => handleChangeList('pendapatan', p.id, 'nilai', e.target.value)} 
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => addList('pendapatan')} className="w-full border-dashed">
            + Tambah Sumber Omset
          </Button>
        </div>

        {/* PENGELUARAN */}
        <div className="mb-6">
          <h5 className="font-bold uppercase mb-4 text-red-700 border-b-2 border-black pb-2">Pengeluaran & Modal Belanja</h5>
          {data.pengeluaran.map((p) => (
            <div key={p.id} className="border-[3px] border-black p-4 mb-4 relative bg-[#F9F9F9]">
              <button 
                type="button" 
                onClick={() => removeList('pengeluaran', p.id)} 
                className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center font-bold border-l-[3px] border-b-[3px] border-black"
              >
                X
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Nama Pengeluaran" 
                  value={p.item} 
                  onChange={e => handleChangeList('pengeluaran', p.id, 'item', e.target.value)} 
                  placeholder="Contoh: Kulakan Barang, Gaji Pegawai"
                />
                <Select 
                  label="Frekuensi" 
                  value={p.freq} 
                  onChange={e => handleChangeList('pengeluaran', p.id, 'freq', e.target.value)}
                  options={[
                    { label: 'Harian', value: 'Hari' },
                    { label: 'Mingguan', value: 'Minggu' },
                    { label: 'Bulanan', value: 'Bulan' }
                  ]}
                />
                <CurrencyInput 
                  label="Biaya (Rp)" 
                  value={p.nilai} 
                  onChange={e => handleChangeList('pengeluaran', p.id, 'nilai', e.target.value)} 
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => addList('pengeluaran')} className="w-full border-dashed mb-6">
            + Tambah Pengeluaran Usaha
          </Button>
        </div>

        <Button type="button" className="w-full" onClick={handleSimpan}>
          Hitung, Simpan & Selesai
        </Button>
      </Card>
    </div>
  );
}
