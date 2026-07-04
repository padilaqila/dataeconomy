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
            jenis_usaha: bus.jenis_usaha,
            nib: bus.nib,
            jenis_barang: bus.jenis_barang,
            tahun_mulai: bus.tahun_mulai,
            alamat_usaha: bus.alamat_usaha,
            upah: bus.upah,
            biaya_produksi: bus.biaya_produksi,
            biaya_barang_terjual: bus.biaya_barang_terjual,
            operasional: bus.operasional,
            non_operasional: bus.non_operasional,
            pengeluaran_usaha_bulan: bus.pengeluaran_usaha_bulan,
            pendapatan_total_bulan: bus.pendapatan_total_bulan,
            pendapatan_total_tahun: bus.pendapatan_total_tahun,
            total_aset_usaha: bus.total_aset_usaha
          }, { onConflict: 'respondent_id' });
        }

        const exp = await FamilyExpenseDB.get(res.id);
        if (exp) {
          await supabase.from('family_expenses').upsert({
            respondent_id: exp.respondent_id,
            rincian_makan: exp.rincian_makan,
            total_makanan_bulan: exp.total_makanan_bulan,
            rincian_non_makan: exp.rincian_non_makan,
            total_non_makanan_bulan: exp.total_non_makanan_bulan
          }, { onConflict: 'respondent_id' });
        }

        const ast = await AssetsConditionDB.get(res.id);
        if (ast) {
          await supabase.from('assets_conditions').upsert({
            respondent_id: ast.respondent_id,
            status_kepemilikan_rumah: ast.status_kepemilikan_rumah,
            luas_lantai: ast.luas_lantai,
            jenis_lantai: ast.jenis_lantai,
            jenis_dinding: ast.jenis_dinding,
            sumber_air_minum: ast.sumber_air_minum,
            sumber_penerangan: ast.sumber_penerangan
          }, { onConflict: 'respondent_id' });
        }

        await RespondentDB.update(res.id, { sync_status: 'synced' });
        successCount++;
        
      } catch (err) {
        console.error('Error syncing respondent', res.id, err);
      }
    }

    if (respondents.length > 0 && successCount === 0) {
        return { success: false, message: 'Gagal sinkronisasi (mungkin tabel database belum ada di Supabase)' };
    }

    return { success: true, count: successCount, message: `${successCount} data berhasil disinkronisasi` };
  } catch (err) {
    console.error('Fatal sync error:', err);
    return { success: false, message: err.message };
  }
};
