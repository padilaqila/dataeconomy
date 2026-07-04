import { supabase } from './supabase';
import { BlockDB, RespondentDB, FamilyMemberDB, BusinessDetailDB, FamilyExpenseDB, AssetsConditionDB } from '../db/db';
import useAuthStore from '../stores/authStore';

export const syncData = async () => {
  if (!navigator.onLine) return { success: false, message: 'Tidak ada koneksi internet' };
  
  const user = useAuthStore.getState().user;
  if (!user) return { success: false, message: 'Belum login' };

  try {
    const blocks = await BlockDB.getAllByUser(user.id);
    for (const block of blocks) {
      const { error } = await supabase.from('blocks').upsert({
        id: block.id,
        user_id: block.user_id,
        nama_blok: block.nama_blok,
        created_at: new Date(block.created_at).toISOString()
      }, { onConflict: 'id' });
      if (error) console.error('Sync block error:', error);
    }

    const respondents = await RespondentDB.getAllPending();
    let successCount = 0;
    let lastErr = null;
    
    for (const res of respondents) {
      try {
        const { error: resErr } = await supabase.from('respondents').upsert({
          id: res.id,
          block_id: res.block_id,
          no_bangunan: res.no_bangunan,
          no_urut_kk: res.no_urut_kk,
          nomor_kk: res.nomor_kk,
          nama_kpl_keluarga: res.nama_kpl_keluarga,
          alamat: res.alamat,
          sync_status: 'synced',
          updated_at: new Date(res.updated_at).toISOString()
        }, { onConflict: 'id' });
        
        // If table doesn't exist, this will error. Since we are testing offline-first and mock supabase,
        // we might fail here. If we fail, we throw and it stays pending.
        if (resErr) throw resErr;

        const members = await FamilyMemberDB.getAllByRespondent(res.id);
        if (members.length > 0) {
          await supabase.from('family_members').upsert(members.map(m => ({
            id: m.id,
            respondent_id: m.respondent_id,
            nama: m.nama,
            pekerjaan: m.pekerjaan,
            gaji: m.gaji,
            ijarah: m.ijarah,
            status_tinggal: m.status_tinggal
          })), { onConflict: 'id' });
        }

        const bus = await BusinessDetailDB.get(res.id);
        if (bus) {
          await supabase.from('business_details').upsert({
            respondent_id: bus.respondent_id,
            jenis_usaha: bus.jenis_usaha || null,
            nib: bus.nib || null,
            jenis_barang: bus.jenis_barang || null,
            tahun_mulai: bus.tahun_mulai || null,
            alamat_usaha: bus.alamat_usaha || null,
            
            total_upah_bulan: bus.total_upah_bulan || 0,
            biaya_produksi_bulan: bus.biaya_produksi_bulan || 0,
            biaya_pembelian_barang_bulan: bus.biaya_pembelian_barang_bulan || 0,
            operasional_bulan: bus.operasional_bulan || 0,
            non_operasional_bulan: bus.non_operasional_bulan || 0,
            total_pengeluaran_usaha_bulan: bus.total_pengeluaran_usaha_bulan || 0,
            
            pendapatan_barang_jasa_bulan: bus.pendapatan_barang_jasa_bulan || 0,
            pendapatan_barang_jasa_tahun: bus.pendapatan_barang_jasa_tahun || 0,
            pendapatan_lainnya_bulan: bus.pendapatan_lainnya_bulan || 0,
            pendapatan_lainnya_tahun: bus.pendapatan_lainnya_tahun || 0,
            total_pendapatan_tahun: bus.total_pendapatan_tahun || 0,
            
            nilai_aset_tanah_bangunan: bus.nilai_aset_tanah_bangunan || 0,
            nilai_aset_selain_tanah: bus.nilai_aset_selain_tanah || 0,
            total_aset_usaha: bus.total_aset_usaha || 0
          }, { onConflict: 'respondent_id' });
        }

        const exp = await FamilyExpenseDB.get(res.id);
        if (exp) {
          await supabase.from('family_expenses').upsert({
            respondent_id: exp.respondent_id,
            rincian_makan: exp.rincian_makan || {},
            rincian_non_makan: exp.rincian_non_makan || {},
            rincian_tahunan: exp.rincian_tahunan || {},
            total_makan_bulan: exp.total_makan_bulan || 0,
            total_non_makan_bulan: exp.total_non_makan_bulan || 0,
            total_beban_keluarga_bulan: exp.total_beban_keluarga_bulan || 0
          }, { onConflict: 'respondent_id' });
        }

        const ast = await AssetsConditionDB.get(res.id);
        if (ast) {
          await supabase.from('assets_conditions').upsert({
            respondent_id: ast.respondent_id,
            luas_bangunan_tinggal: ast.luas_bangunan_tinggal || 0,
            luas_tanah_ditempati: ast.luas_tanah_ditempati || 0,
            luas_bangunan_usaha: ast.luas_bangunan_usaha || 0,
            tanah_selain_ditempati_unit: ast.tanah_selain_ditempati_unit || 0,
            tanah_selain_ditempati_m2: ast.tanah_selain_ditempati_m2 || 0,
            tanah_selain_ditempati_rp: ast.tanah_selain_ditempati_rp || 0,
            nilai_aset_tanah_bangunan: ast.nilai_aset_tanah_bangunan || 0,
            jml_motor: ast.jml_motor || 0,
            val_motor_rp: ast.val_motor_rp || 0,
            jml_mobil: ast.jml_mobil || 0,
            val_mobil_rp: ast.val_mobil_rp || 0,
            emas_gram: ast.emas_gram || 0,
            emas_rp: ast.emas_rp || 0,
            riwayat_penyakit: ast.riwayat_penyakit || null,
            disabilitas: ast.disabilitas || null
          }, { onConflict: 'respondent_id' });
        }

        await RespondentDB.update(res.id, { sync_status: 'synced' });
        successCount++;
        
      } catch (err) {
        console.error('Error syncing respondent', res.id, err);
        lastErr = err;
      }
    }

    if (respondents.length > 0 && successCount === 0) {
        return { success: false, message: lastErr ? `Gagal: ${lastErr.message || JSON.stringify(lastErr)}` : 'Gagal sinkronisasi.' };
    }

    return { success: true, count: successCount, message: `${successCount} data berhasil disinkronisasi` };
  } catch (err) {
    console.error('Fatal sync error:', err);
    return { success: false, message: err.message };
  }
};
