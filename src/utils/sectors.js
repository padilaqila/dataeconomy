export const SECTORS = [
  { id: 'retail', label: 'Dagang / Retail' },
  { id: 'kuliner', label: 'Kuliner / Makanan' },
  { id: 'jasa', label: 'Usaha Jasa' },
  { id: 'perikanan', label: 'Perikanan' },
  { id: 'pertanian', label: 'Pertanian / Perkebunan' },
  { id: 'peternakan', label: 'Peternakan' },
  { id: 'pendidikan', label: 'Sektor Pendidikan' },
  { id: 'pemerintah_desa', label: 'Pemerintah Desa (BUMDes)' },
  { id: 'posyandu', label: 'Posyandu / Sosial' }
];

export const getSectorFields = (sectorId) => {
  switch (sectorId) {
    case 'retail':
      return [
        { id: 'modal_awal', label: 'Modal Awal / Kulakan (Bulan)', type: 'currency' },
        { id: 'omset_hari', label: 'Omset Rata-rata (Hari)', type: 'currency' },
        { id: 'gaji_karyawan', label: 'Gaji Karyawan Total (Bulan)', type: 'currency' },
        { id: 'sewa_tempat', label: 'Sewa Tempat (Bulan)', type: 'currency' },
        { id: 'operasional', label: 'Biaya Operasional (Listrik/Air - Bulan)', type: 'currency' }
      ];
    case 'kuliner':
      return [
        { id: 'bahan_baku', label: 'Belanja Bahan Baku (Hari)', type: 'currency' },
        { id: 'omset_hari', label: 'Omset Rata-rata (Hari)', type: 'currency' },
        { id: 'gaji_karyawan', label: 'Gaji Karyawan Total (Bulan)', type: 'currency' },
        { id: 'sewa_tempat', label: 'Sewa Tempat (Bulan)', type: 'currency' },
        { id: 'operasional', label: 'Biaya Operasional (Gas/Listrik - Bulan)', type: 'currency' }
      ];
    case 'jasa':
      return [
        { id: 'pelanggan_hari', label: 'Rata-rata Pelanggan (Hari)', type: 'number' },
        { id: 'tarif_rata', label: 'Tarif Rata-rata per Pelanggan', type: 'currency' },
        { id: 'gaji_karyawan', label: 'Gaji Karyawan Total (Bulan)', type: 'currency' },
        { id: 'sewa_tempat', label: 'Sewa Tempat (Bulan)', type: 'currency' },
        { id: 'bahan_habis', label: 'Bahan Habis Pakai (Bulan)', type: 'currency' },
        { id: 'operasional', label: 'Biaya Operasional (Bulan)', type: 'currency' }
      ];
    case 'perikanan':
      return [
        { id: 'luas_tambak', label: 'Luas Tambak/Kolam (M2)', type: 'number' },
        { id: 'siklus_panen', label: 'Lama 1 Siklus Panen (Bulan)', type: 'number' },
        { id: 'omset_panen', label: 'Omset per Panen', type: 'currency' },
        { id: 'biaya_bibit', label: 'Biaya Bibit (per Panen)', type: 'currency' },
        { id: 'biaya_pakan', label: 'Biaya Pakan (per Panen)', type: 'currency' },
        { id: 'biaya_perawatan', label: 'Biaya Perawatan (per Panen)', type: 'currency' }
      ];
    case 'pertanian':
      return [
        { id: 'luas_lahan', label: 'Luas Lahan (M2)', type: 'number' },
        { id: 'siklus_panen', label: 'Lama 1 Siklus Panen (Bulan)', type: 'number' },
        { id: 'hasil_panen', label: 'Total Hasil Panen (Kg/Ton)', type: 'number' },
        { id: 'harga_jual', label: 'Harga Jual (per Satuan)', type: 'currency' },
        { id: 'biaya_bibit', label: 'Biaya Bibit (per Panen)', type: 'currency' },
        { id: 'biaya_pupuk', label: 'Biaya Pupuk (per Panen)', type: 'currency' },
        { id: 'biaya_pestisida', label: 'Biaya Pestisida (per Panen)', type: 'currency' },
        { id: 'biaya_buruh', label: 'Biaya Buruh Tani (per Panen)', type: 'currency' },
        { id: 'biaya_sewa_lahan', label: 'Biaya Sewa Lahan (per Panen)', type: 'currency' },
        { id: 'biaya_sewa_alat', label: 'Biaya Sewa Alat/Traktor (per Panen)', type: 'currency' },
        { id: 'biaya_transportasi', label: 'Biaya Transportasi (per Panen)', type: 'currency' }
      ];
    case 'peternakan':
      return [
        { id: 'jumlah_ternak', label: 'Jumlah Ternak', type: 'number' },
        { id: 'tipe_produksi', label: 'Tipe Produksi (1=Harian, Lainnya=Siklus/Panen dalam Bulan)', type: 'number' },
        { id: 'hasil_produksi', label: 'Hasil Produksi (per Siklus)', type: 'number' },
        { id: 'harga_jual', label: 'Harga Jual (per Satuan)', type: 'currency' },
        { id: 'biaya_pakan', label: 'Biaya Pakan (Bulan)', type: 'currency' },
        { id: 'biaya_vaksin', label: 'Biaya Vaksin/Obat (Bulan)', type: 'currency' },
        { id: 'gaji_karyawan', label: 'Gaji Karyawan Total (Bulan)', type: 'currency' }
      ];
    case 'pendidikan':
      return [
        { id: 'jumlah_siswa', label: 'Jumlah Siswa Aktif', type: 'number' },
        { id: 'spp_siswa', label: 'SPP/Biaya Rata-rata per Siswa (Bulan)', type: 'currency' },
        { id: 'gaji_guru', label: 'Total Gaji Guru/Pengajar (Bulan)', type: 'currency' },
        { id: 'sewa_gedung', label: 'Sewa Gedung (Bulan)', type: 'currency' },
        { id: 'operasional', label: 'Biaya Operasional (Listrik/Internet - Bulan)', type: 'currency' }
      ];
    case 'pemerintah_desa':
      return [
        { id: 'omset_kotor', label: 'Omset Kotor Unit Usaha (Bulan)', type: 'currency' },
        { id: 'gaji_pengurus', label: 'Total Gaji Pengurus (Bulan)', type: 'currency' },
        { id: 'operasional', label: 'Biaya Operasional BUMDes (Bulan)', type: 'currency' },
        { id: 'setoran_pades', label: 'Setoran PADes (Tahun)', type: 'currency' }
      ];
    case 'posyandu':
      return [
        { id: 'dana_desa', label: 'Pemasukan Dana Desa/Hibah (Bulan)', type: 'currency' },
        { id: 'dana_swadaya', label: 'Pemasukan Swadaya Masyarakat (Bulan)', type: 'currency' },
        { id: 'biaya_pmt', label: 'Biaya PMT / Makanan Tambahan (Bulan)', type: 'currency' },
        { id: 'insentif_kader', label: 'Total Insentif Kader (Bulan)', type: 'currency' }
      ];
    default:
      return [];
  }
};

export const calculateSectorTotals = (sectorId, data) => {
  let omsetBulan = 0;
  let pengeluaranBulan = 0;
  
  // Helper for safe number conversion
  const val = (key) => Number(data[key]) || 0;

  switch (sectorId) {
    case 'retail':
      omsetBulan = val('omset_hari') * 30;
      pengeluaranBulan = val('modal_awal') + val('gaji_karyawan') + val('sewa_tempat') + val('operasional');
      break;
    
    case 'kuliner':
      omsetBulan = val('omset_hari') * 30;
      pengeluaranBulan = (val('bahan_baku') * 30) + val('gaji_karyawan') + val('sewa_tempat') + val('operasional');
      break;
      
    case 'jasa':
      omsetBulan = (val('pelanggan_hari') * val('tarif_rata')) * 30;
      pengeluaranBulan = val('gaji_karyawan') + val('sewa_tempat') + val('bahan_habis') + val('operasional');
      break;
      
    case 'perikanan': {
      const siklus = val('siklus_panen') || 1; // Prevent division by zero
      omsetBulan = val('omset_panen') / siklus;
      pengeluaranBulan = (val('biaya_bibit') + val('biaya_pakan') + val('biaya_perawatan')) / siklus;
      break;
    }
    
    case 'pertanian': {
      const siklus = val('siklus_panen') || 1;
      const totalPanen = val('hasil_panen') * val('harga_jual');
      const totalBiaya = val('biaya_bibit') + val('biaya_pupuk') + val('biaya_pestisida') + 
                         val('biaya_buruh') + val('biaya_sewa_lahan') + val('biaya_sewa_alat') + 
                         val('biaya_transportasi');
                         
      omsetBulan = totalPanen / siklus;
      pengeluaranBulan = totalBiaya / siklus;
      break;
    }
    
    case 'peternakan': {
      const siklus = val('tipe_produksi') || 1;
      if (siklus === 1) {
        // Harian
        omsetBulan = (val('hasil_produksi') * val('harga_jual')) * 30;
      } else {
        // Panen
        omsetBulan = (val('hasil_produksi') * val('harga_jual')) / siklus;
      }
      pengeluaranBulan = val('biaya_pakan') + val('biaya_vaksin') + val('gaji_karyawan');
      break;
    }
    
    case 'pendidikan':
      omsetBulan = val('jumlah_siswa') * val('spp_siswa');
      pengeluaranBulan = val('gaji_guru') + val('sewa_gedung') + val('operasional');
      break;
      
    case 'pemerintah_desa':
      omsetBulan = val('omset_kotor');
      pengeluaranBulan = val('gaji_pengurus') + val('operasional') + (val('setoran_pades') / 12);
      break;
      
    case 'posyandu':
      omsetBulan = val('dana_desa') + val('dana_swadaya');
      pengeluaranBulan = val('biaya_pmt') + val('insentif_kader');
      break;
  }
  
  return { omsetBulan, pengeluaranBulan };
};
