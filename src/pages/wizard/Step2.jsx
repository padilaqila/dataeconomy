import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import CurrencyInput from '../../components/CurrencyInput';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { BusinessDetailDB } from '../../db/db';
import { SECTORS, getSectorFields, calculateSectorTotals } from '../../utils/sectors';
import { AlertTriangle } from 'lucide-react';

export default function Step2({ respondentId, onNext, setDirty, isEditMode }) {
  const [baseData, setBaseData] = useState({
    jenis_barang: '',
    tahun_mulai: '',
    nib: '',
    alamat_usaha: ''
  });
  
  const [sektorId, setSektorId] = useState('');
  const [sektorData, setSektorData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const b = await BusinessDetailDB.get(respondentId);
    if (b) {
      setBaseData({
        jenis_barang: b.jenis_barang || '',
        tahun_mulai: b.tahun_mulai || '',
        nib: b.nib || '',
        alamat_usaha: b.alamat_usaha || ''
      });
      
      if (b.sektor_id) {
        setSektorId(b.sektor_id);
      } else if (b.jenis_usaha) {
        // Fallback for old data: Map text to closest sector if possible, otherwise retail
        const match = SECTORS.find(s => s.label.toLowerCase() === (b.jenis_usaha || '').toLowerCase());
        setSektorId(match ? match.id : 'retail');
      }
      
      if (b.sektor_data) {
        setSektorData(b.sektor_data);
      }
    }
  };

  const handleBaseChange = (field, value) => {
    setBaseData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSectorChange = (value) => {
    setSektorId(value);
    // Optional: reset sektorData here if you want to clear on change
    // setSektorData({}); 
    setDirty(true);
  };

  const handleSectorDataChange = (field, value) => {
    setSektorData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const saveFunction = async () => {
      // Calculate derived totals
      const { omsetBulan, pengeluaranBulan, bpsMapped } = calculateSectorTotals(sektorId, sektorData);
      const omsetTahun = omsetBulan * 12;

      // Map back to DB schema format
      const sektorLabel = SECTORS.find(s => s.id === sektorId)?.label || 'Lainnya';
      
      const existing = await BusinessDetailDB.get(respondentId) || { respondent_id: respondentId };
      
      await BusinessDetailDB.put({
        ...existing,
        respondent_id: respondentId,
        jenis_usaha: sektorLabel,
        sektor_id: sektorId,
        sektor_data: sektorData,
        nib: baseData.nib,
        jenis_barang: baseData.jenis_barang,
        tahun_mulai: baseData.tahun_mulai,
        alamat_usaha: baseData.alamat_usaha,
        
        // Final Rollup for Recapitulation & API
        pengeluaran_usaha_bulan: pengeluaranBulan,
        total_pengeluaran_usaha_bulan: pengeluaranBulan,
        pendapatan_barang_jasa_bulan: omsetBulan,
        pendapatan_barang_jasa_tahun: omsetTahun,
        
        // BPS Exact Field Mappings (Rincian 26)
        r26a_upah: bpsMapped.r26a,
        r26b_produksi: bpsMapped.r26b,
        r26c_barang_dagangan: bpsMapped.r26c,
        r26d_operasional: bpsMapped.r26d,
        r26e_non_operasional: bpsMapped.r26e,

        // Legacy fallback
        pendapatan_total_bulan: omsetBulan,
        pendapatan_total_tahun: omsetTahun
      });
    };

    onNext({ ...baseData, sektor_id: sektorId, sektor_data: sektorData }, saveFunction);
  };

  const activeFields = getSectorFields(sektorId);
  const { omsetBulan, pengeluaranBulan } = calculateSectorTotals(sektorId, sektorData);

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Profil & Sektor Usaha</h4>
        
        <Select 
          label="Kategori Sektor Usaha"
          value={sektorId}
          onChange={(e) => handleSectorChange(e.target.value)}
          options={[
            { value: '', label: 'Pilih Sektor Usaha...' },
            ...SECTORS.map(s => ({ value: s.id, label: s.label }))
          ]}
          required
        />
        
        <Input label="Jenis Barang/Jasa Utama" value={baseData.jenis_barang} onChange={e => handleBaseChange('jenis_barang', e.target.value)} />
        <Input label="Tahun Mulai Beroperasi" type="number" value={baseData.tahun_mulai} onChange={e => handleBaseChange('tahun_mulai', e.target.value)} />
        <Input label="NIB" value={baseData.nib} onChange={e => handleBaseChange('nib', e.target.value)} />
        <Input label="Alamat Usaha" value={baseData.alamat_usaha} onChange={e => handleBaseChange('alamat_usaha', e.target.value)} />
      </Card>

      {sektorId && (
        <Card className="mb-6">
          <h4 className="font-['Archivo_Black'] uppercase mb-2 text-xl">Rincian Finansial Sektor</h4>
          <p className="font-['Space_Mono'] text-[12px] text-gray-600 mb-6">Input dinamis menyesuaikan kategori usaha.</p>
          
          {activeFields.map((field) => {
            if (field.type === 'currency') {
              return (
                <CurrencyInput
                  key={field.id}
                  label={field.label}
                  value={sektorData[field.id] || ''}
                  onChange={(e) => handleSectorDataChange(field.id, e.target.value)}
                />
              );
            }
            return (
              <Input
                key={field.id}
                type="number"
                label={field.label}
                value={sektorData[field.id] || ''}
                onChange={(e) => handleSectorDataChange(field.id, e.target.value)}
              />
            );
          })}
          
          <div className="bg-[#F9F9F9] border-[3px] border-black p-4 mt-6">
            <h5 className="font-['Archivo_Black'] text-sm uppercase mb-3">Estimasi Otomatis (Per Bulan)</h5>
            
            <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-dashed border-gray-300">
              <span className="font-['Space_Mono'] text-sm text-gray-700">Total Pengeluaran:</span>
              <span className="font-['Archivo_Black']">Rp {pengeluaranBulan.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-['Space_Mono'] text-sm text-gray-700">Total Pemasukan (Omset):</span>
              <span className="font-['Archivo_Black']">Rp {omsetBulan.toLocaleString('id-ID')}</span>
            </div>
          </div>
          
        </Card>
      )}

      <Button type="submit" className="w-full" disabled={!sektorId}>
        {isEditMode ? 'Simpan & Kembali ke Draft' : 'Lanjut (Simpan)'}
      </Button>
    </form>
  );
}
