import React from 'react';
import Card from '../../components/Card';
import { Home, Sprout, Store, Beef, Fish, Factory } from 'lucide-react';

export default function ModuleSelector({ selected, onSelect }) {
  const modules = [
    { id: 'RUMAH_TANGGA', label: 'Keuangan Rumah Tangga', icon: Home, desc: 'Pengeluaran makan, tagihan bulanan keluarga' },
    { id: 'PERTANIAN', label: 'Pertanian', icon: Sprout, desc: 'Lahan, bibit, pupuk, hasil panen' },
    { id: 'PERDAGANGAN_JASA', label: 'Perdagangan & Jasa', icon: Store, desc: 'Toko, omset harian, kulakan' },
    { id: 'PETERNAKAN', label: 'Peternakan', icon: Beef, desc: 'Vaksin, pakan, siklus ternak' },
    { id: 'PERIKANAN', label: 'Perikanan', icon: Fish, desc: 'Benur, pakan ikan, tangkapan laut' },
    { id: 'INDUSTRI_PENGOLAHAN', label: 'Industri Pengolahan', icon: Factory, desc: 'Bahan baku, upah buruh, penjualan' }
  ];

  return (
    <div>
      <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Pilih Sektor Usaha</h4>
      <p className="font-['Work_Sans'] mb-6 text-gray-700">Pilih modul kalkulasi yang paling sesuai dengan aktivitas utama responden ini.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map(mod => {
          const Icon = mod.icon;
          const isSelected = selected === mod.id;
          return (
            <Card 
              key={mod.id} 
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${isSelected ? 'border-[5px] border-black bg-yellow-100' : ''}`}
              onClick={() => onSelect(mod.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 border-[3px] border-black ${isSelected ? 'bg-black text-white' : 'bg-white'}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h5 className="font-['Archivo_Black'] uppercase">{mod.label}</h5>
                  <p className="font-['Work_Sans'] text-sm text-gray-600">{mod.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
