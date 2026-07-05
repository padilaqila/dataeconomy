import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Select from '../../components/Select';
import Button from '../../components/Button';
import ConversionInput from '../../components/ConversionInput';
import { FinancialRecordDB } from '../../db/db';

export default function ModuleIndustri({ recordId, onFinish, setDirty }) {
  const [data, setData] = useState({
    referensi: {
      bahan_baku: '', 
      produk_jadi: '',  
      upah_buruh: '', 
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
        referensi: record.module_data.referensi || { bahan_baku: '', produk_jadi: '', upah_buruh: '' },
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
        { id: Date.now(), item: '', ref_type: 'produk_jadi', freq: 'Bulan', nilai: '', qty: '' }
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
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Sektor Industri Pengolahan</h4>
        <p className="font-['Work_Sans'] mb-4 text-gray-700">
          Modul ini dirancang untuk pabrik atau pengrajin rumahan. Gunakan konversi otomatis untuk menghitung bahan baku, upah harian buruh, dan penjualan produk jadi.
        </p>

        {/* HARGA REFERENSI */}
        <div className="border-4 border-black p-4 mb-6 bg-[#F3E5F5]">
          <h5 className="font-bold uppercase mb-4 border-b-2 border-black pb-2">Step 1: Harga Referensi Lokal</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CurrencyInput 
              label="Harga Bahan Baku Utama (per Kg/Sak/Unit)" 
              value={data.referensi.bahan_baku} 
              onChange={e => handleChangeRef('bahan_baku', e.target.value)} 
            />
            <CurrencyInput 
              label="Upah Buruh Harian (per Orang)" 
              value={data.referensi.upah_buruh} 
              onChange={e => handleChangeRef('upah_buruh', e.target.value)} 
            />
            <CurrencyInput 
              label="Harga Jual Produk Jadi (per Pcs/Unit)" 
              value={data.referensi.produk_jadi} 
              onChange={e => handleChangeRef('produk_jadi', e.target.value)} 
            />
          </div>
        </div>

        {/* BIAYA OPERASIONAL */}
        <div className="mb-6">
          <h5 className="font-bold uppercase mb-4">Step 2: Biaya Produksi & Upah</h5>
          {data.pengeluaran.map((p) => {
            const refPrice = p.ref_type ? (parseInt(data.referensi[p.ref_type]) || 0) : 0;
            const unitName = p.ref_type === 'bahan_baku' ? 'Unit BB' : p.ref_type === 'upah_buruh' ? 'Hari Kerja (Orang)' : 'Unit';

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
                    placeholder="Contoh: Beli Kayu, Bayar Tukang"
                  />
                  <Select 
                    label="Kategori" 
                    value={p.ref_type} 
                    onChange={e => handleChangeList('pengeluaran', p.id, 'ref_type', e.target.value)}
                    options={[
                      { label: 'Lainnya (Gas, Listrik, Air)', value: '' },
                      { label: 'Bahan Baku', value: 'bahan_baku' },
                      { label: 'Upah Buruh', value: 'upah_buruh' }
                    ]}
                  />
                  <Select 
                    label="Frekuensi Pengeluaran" 
                    value={p.freq} 
                    onChange={e => handleChangeList('pengeluaran', p.id, 'freq', e.target.value)}
                    options={[
                      { label: 'Harian', value: 'Hari' },
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
            + Tambah Biaya Produksi
          </Button>
        </div>

        {/* PENDAPATAN */}
        <div className="mb-6">
          <h5 className="font-bold uppercase mb-4">Step 3: Pendapatan / Penjualan Produk</h5>
          {data.pendapatan.map((p) => {
            const refPrice = p.ref_type ? (parseInt(data.referensi[p.ref_type]) || 0) : 0;
            const unitName = p.ref_type === 'produk_jadi' ? 'Pcs/Unit' : 'Unit';

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
                    label="Nama Produk" 
                    value={p.item} 
                    onChange={e => handleChangeList('pendapatan', p.id, 'item', e.target.value)} 
                    placeholder="Contoh: Kursi Kayu, Tempe"
                  />
                  <Select 
                    label="Frekuensi Penjualan" 
                    value={p.freq} 
                    onChange={e => handleChangeList('pendapatan', p.id, 'freq', e.target.value)}
                    options={[
                      { label: 'Harian', value: 'Hari' },
                      { label: 'Mingguan', value: 'Minggu' },
                      { label: 'Bulanan', value: 'Bulan' }
                    ]}
                  />
                </div>

                <ConversionInput
                  label="Konversi Penjualan"
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
