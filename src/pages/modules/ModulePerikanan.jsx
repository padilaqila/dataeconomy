import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Select from '../../components/Select';
import Button from '../../components/Button';
import ConversionInput from '../../components/ConversionInput';
import { FinancialRecordDB } from '../../db/db';

export default function ModulePerikanan({ recordId, onFinish, setDirty }) {
  const [data, setData] = useState({
    referensi: {
      pakan: '', 
      benur: '',  
      bbm: '', 
      tangkapan: '', 
    },
    pengeluaran: [],
    pendapatan: []
  });

  useEffect(() => {
    loadData();
  }, [recordId]);

  const loadData = async () => {
    const record = await FinancialRecordDB.getById(recordId);
    if (record && record.module_data) {
      setData({
        referensi: record.module_data.referensi || { pakan: '', benur: '', bbm: '', tangkapan: '' },
        pengeluaran: record.module_data.pengeluaran || [],
        pendapatan: record.module_data.pendapatan || []
      });
    }
  };

  const handleChangeRef = (field, value) => {
    setData(prev => ({
      ...prev,
      referensi: { ...prev.referensi, [field]: value }
    }));
    setDirty(true);
  };

  const addPengeluaran = () => {
    setData(prev => ({
      ...prev,
      pengeluaran: [
        ...prev.pengeluaran,
        { id: Date.now(), item: '', ref_type: '', freq: 'Bulan', nilai: '', qty: '' }
      ]
    }));
    setDirty(true);
  };

  const addPendapatan = () => {
    setData(prev => ({
      ...prev,
      pendapatan: [
        ...prev.pendapatan,
        { id: Date.now(), item: '', ref_type: 'tangkapan', freq: 'Musim', nilai: '', qty: '' }
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
      } else if (p.freq === 'Musim' || p.freq === 'Sekali') {
        totalMonthly += val / 3; 
        totalYearly += val * 4;
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
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Sektor Perikanan</h4>
        <p className="font-['Work_Sans'] mb-4 text-gray-700">
          Modul ini mencakup perikanan tangkap (nelayan) dan budidaya (tambak). Gunakan Harga Referensi untuk menghitung biaya operasional dengan lebih cepat.
        </p>

        {/* HARGA REFERENSI */}
        <div className="border-4 border-black p-4 mb-6 bg-[#E3F2FD]">
          <h5 className="font-bold uppercase mb-4 border-b-2 border-black pb-2">Step 1: Harga Referensi Lokal</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencyInput 
              label="Harga Pakan per Karung (Budidaya)" 
              value={data.referensi.pakan} 
              onChange={e => handleChangeRef('pakan', e.target.value)} 
            />
            <CurrencyInput 
              label="Harga Bibit/Benur per Ekor" 
              value={data.referensi.benur} 
              onChange={e => handleChangeRef('benur', e.target.value)} 
            />
            <CurrencyInput 
              label="Harga BBM per Liter (Tangkap)" 
              value={data.referensi.bbm} 
              onChange={e => handleChangeRef('bbm', e.target.value)} 
            />
            <CurrencyInput 
              label="Harga Jual Panen/Tangkapan per Kg" 
              value={data.referensi.tangkapan} 
              onChange={e => handleChangeRef('tangkapan', e.target.value)} 
            />
          </div>
        </div>

        {/* BIAYA OPERASIONAL */}
        <div className="mb-6">
          <h5 className="font-bold uppercase mb-4">Step 2: Biaya Operasional & Pemeliharaan</h5>
          {data.pengeluaran.map((p) => {
            const refPrice = p.ref_type ? (parseInt(data.referensi[p.ref_type]) || 0) : 0;
            const unitName = p.ref_type === 'pakan' ? 'Karung' : p.ref_type === 'benur' ? 'Ekor' : p.ref_type === 'bbm' ? 'Liter' : 'Unit';

            return (
              <div key={p.id} className="border-[3px] border-black p-4 mb-4 relative bg-[#F9F9F9] pt-10">
                <button 
                  type="button" 
                  onClick={() => removeList('pengeluaran', p.id)} 
                  className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center font-bold border-l-[3px] border-b-[3px] border-black"
                >
                  X
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Input 
                    label="Nama Pengeluaran" 
                    value={p.item} 
                    onChange={e => handleChangeList('pengeluaran', p.id, 'item', e.target.value)} 
                    placeholder="Contoh: Beli BBM Solar, Beli Pelet"
                  />
                  <Select 
                    label="Kategori Barang" 
                    value={p.ref_type} 
                    onChange={e => handleChangeList('pengeluaran', p.id, 'ref_type', e.target.value)}
                    options={[
                      { label: 'Lainnya (Sewa Tambak, dll)', value: '' },
                      { label: 'Pakan Ikan', value: 'pakan' },
                      { label: 'Bibit/Benur', value: 'benur' },
                      { label: 'BBM Perahu', value: 'bbm' }
                    ]}
                  />
                  <Select 
                    label="Frekuensi" 
                    value={p.freq} 
                    onChange={e => handleChangeList('pengeluaran', p.id, 'freq', e.target.value)}
                    options={[
                      { label: 'Sekali / Per Siklus', value: 'Sekali' },
                      { label: 'Harian (Setiap Melaut)', value: 'Hari' },
                      { label: 'Mingguan', value: 'Minggu' },
                      { label: 'Bulanan', value: 'Bulan' }
                    ]}
                  />
                </div>

                <ConversionInput
                  label="Konversi Biaya"
                  unitName={unitName}
                  referencePrice={refPrice}
                  amountValue={p.nilai}
                  quantityValue={p.qty}
                  onAmountChange={(val) => handleChangeList('pengeluaran', p.id, 'nilai', val)}
                  onQuantityChange={(val) => handleChangeList('pengeluaran', p.id, 'qty', val)}
                />

              </div>
            )
          })}
          <Button type="button" variant="secondary" onClick={addPengeluaran} className="w-full border-dashed">
            + Tambah Biaya Operasional
          </Button>
        </div>

        {/* PENDAPATAN */}
        <div className="mb-6">
          <h5 className="font-bold uppercase mb-4">Step 3: Pendapatan Hasil Perikanan</h5>
          {data.pendapatan.map((p) => {
            const refPrice = p.ref_type ? (parseInt(data.referensi[p.ref_type]) || 0) : 0;
            const unitName = p.ref_type === 'tangkapan' ? 'Kg' : 'Unit';

            return (
              <div key={p.id} className="border-[3px] border-black p-4 mb-4 relative bg-[#F9F9F9] pt-10">
                <button 
                  type="button" 
                  onClick={() => removeList('pendapatan', p.id)} 
                  className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center font-bold border-l-[3px] border-b-[3px] border-black"
                >
                  X
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input 
                    label="Jenis Hasil" 
                    value={p.item} 
                    onChange={e => handleChangeList('pendapatan', p.id, 'item', e.target.value)} 
                    placeholder="Contoh: Ikan Bandeng, Udang Vaname"
                  />
                  <Select 
                    label="Frekuensi Penjualan" 
                    value={p.freq} 
                    onChange={e => handleChangeList('pendapatan', p.id, 'freq', e.target.value)}
                    options={[
                      { label: 'Per Siklus Panen', value: 'Musim' },
                      { label: 'Harian (Setiap Pulang Melaut)', value: 'Hari' },
                      { label: 'Mingguan', value: 'Minggu' },
                      { label: 'Bulanan', value: 'Bulan' }
                    ]}
                  />
                </div>

                <ConversionInput
                  label="Konversi Pendapatan"
                  unitName={unitName}
                  referencePrice={refPrice}
                  amountValue={p.nilai}
                  quantityValue={p.qty}
                  onAmountChange={(val) => handleChangeList('pendapatan', p.id, 'nilai', val)}
                  onQuantityChange={(val) => handleChangeList('pendapatan', p.id, 'qty', val)}
                />

              </div>
            )
          })}
          <Button type="button" variant="secondary" onClick={addPendapatan} className="w-full border-dashed mb-6">
            + Tambah Data Penjualan
          </Button>
        </div>

        <Button type="button" className="w-full" onClick={handleSimpan}>
          Hitung, Simpan & Selesai
        </Button>
      </Card>
    </div>
  );
}
