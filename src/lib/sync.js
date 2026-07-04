import { supabase } from './supabase';
import { BlockDB, RespondentDB, FamilyMemberDB, BusinessDetailDB, FamilyExpenseDB, AssetsConditionDB, DeletedRecordDB } from '../db/db';
import useAuthStore from '../stores/authStore';

export const syncData = async () => {
  if (!navigator.onLine) return { success: false, message: 'Tidak ada koneksi internet' };
  
  const user = useAuthStore.getState().user;
  if (!user) return { success: false, message: 'Belum login' };

  try {
    // 1. Process deletions first
    const deletedRecords = await DeletedRecordDB.getAll();
    for (const del of deletedRecords) {
      if (del.type === 'respondent') {
        const { error } = await supabase.from('respondents').delete().eq('id', del.id);
        if (!error) {
          await DeletedRecordDB.delete(del.id);
        }
      } else if (del.type === 'block') {
        const { error } = await supabase.from('blocks').delete().eq('id', del.id);
        if (!error) {
          await DeletedRecordDB.delete(del.id);
        }
      }
    }

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
            rekening: m.rekening || 0,
            status_tinggal: m.status_tinggal
          })), { onConflict: 'id' });
        }

        const bus = await BusinessDetailDB.get(res.id);
        if (bus) {
          await supabase.from('business_details').upsert({
            respondent_id: bus.respondent_id,
            jenis_usaha: bus.jenis_usaha || null,
            sektor_id: bus.sektor_id || null,
            sektor_data: bus.sektor_data || null,
            nib: bus.nib || null,
            jenis_barang: bus.jenis_barang || null,
            tahun_mulai: bus.tahun_mulai || null,
            alamat_usaha: bus.alamat_usaha || null,
            
            total_upah_bulan: bus.total_upah_bulan || bus.upah || 0,
            biaya_produksi_bulan: bus.biaya_produksi_bulan || bus.biaya_produksi || 0,
            biaya_pembelian_barang_bulan: bus.biaya_pembelian_barang_bulan || bus.biaya_barang_terjual || 0,
            operasional_bulan: bus.operasional_bulan || bus.operasional || 0,
            non_operasional_bulan: bus.non_operasional_bulan || bus.non_operasional || 0,
            total_pengeluaran_usaha_bulan: bus.total_pengeluaran_usaha_bulan || bus.pengeluaran_usaha_bulan || 0,
            
            pendapatan_barang_jasa_bulan: bus.pendapatan_barang_jasa_bulan || bus.pendapatan_total_bulan || 0,
            pendapatan_barang_jasa_tahun: bus.pendapatan_barang_jasa_tahun || bus.pendapatan_total_tahun || 0,
            pendapatan_lainnya_bulan: bus.pendapatan_lainnya_bulan || 0,
            pendapatan_lainnya_tahun: bus.pendapatan_lainnya_tahun || 0,
            total_pendapatan_tahun: bus.total_pendapatan_tahun || bus.pendapatan_total_tahun || 0,
            
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
            total_makan_bulan: exp.total_makan_bulan || exp.total_makanan_bulan || 0,
            total_non_makan_bulan: exp.total_non_makan_bulan || exp.total_non_makanan_bulan || 0,
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

export const pullData = async () => {
  if (!navigator.onLine) return { success: false, message: 'Tidak ada koneksi internet' };
  
  const user = useAuthStore.getState().user;
  if (!user) return { success: false, message: 'Belum login' };

  try {
    // 1. Ambil Blocks
    const { data: blocks, error: blockErr } = await supabase.from('blocks').select('*').eq('user_id', user.id);
    if (blockErr) throw blockErr;

    if (blocks) {
      for (const b of blocks) {
        const isDeletedLocal = await DeletedRecordDB.isDeleted(b.id);
        if (isDeletedLocal) continue;

        const existing = await BlockDB.getById(b.id);
        if (!existing) {
          await BlockDB.add({
            id: b.id,
            user_id: b.user_id,
            nama_blok: b.nama_blok,
            created_at: new Date(b.created_at).getTime()
          });
        }
      }
    }

    // 2. Ambil Respondents
    const { data: respondents, error: resErr } = await supabase.from('respondents').select('*');
    if (resErr) throw resErr;

    if (respondents) {
      for (const r of respondents) {
        // Abaikan data yang sudah dihapus secara lokal (menunggu sync hapus)
        const isDeletedLocal = await DeletedRecordDB.isDeleted(r.id);
        if (isDeletedLocal) continue;

        const existing = await RespondentDB.getById(r.id);
        // Jangan timpa jika data lokal masih berstatus 'pending' (belum di-push)
        if (!existing || existing.sync_status === 'synced') {
          // Kalau sudah ada tapi 'synced', bisa kita put/update
          // Kalau belum ada, kita tambahkan
          const resObj = {
            id: r.id,
            block_id: r.block_id,
            no_bangunan: r.no_bangunan,
            no_urut_kk: r.no_urut_kk,
            nomor_kk: r.nomor_kk,
            nama_kpl_keluarga: r.nama_kpl_keluarga,
            alamat: r.alamat,
            sync_status: 'synced', // dari cloud selalu diset synced
            updated_at: new Date(r.updated_at).getTime()
          };
          if (!existing) {
            await RespondentDB.add(resObj);
          } else {
            await RespondentDB.update(r.id, resObj);
          }
        }
      }
    }

    // 3. Ambil Family Members
    const { data: members, error: memErr } = await supabase.from('family_members').select('*');
    if (memErr) throw memErr;
    if (members) {
      for (const m of members) {
        // Karena members tidak punya 'getById' di Helper kita, ambil via Respondent ID
        const existingAll = await FamilyMemberDB.getAllByRespondent(m.respondent_id);
        const existing = existingAll.find(em => em.id === m.id);
        if (!existing) {
          await FamilyMemberDB.add(m);
        }
      }
    }

    // 4. Ambil Business Details
    const { data: businesses, error: busErr } = await supabase.from('business_details').select('*');
    if (busErr) throw busErr;
    if (businesses) {
      for (const b of businesses) {
        const existing = await BusinessDetailDB.get(b.respondent_id);
        if (!existing) {
          await BusinessDetailDB.put(b);
        }
      }
    }

    // 5. Ambil Family Expenses
    const { data: expenses, error: expErr } = await supabase.from('family_expenses').select('*');
    if (expErr) throw expErr;
    if (expenses) {
      for (const e of expenses) {
        const existing = await FamilyExpenseDB.get(e.respondent_id);
        if (!existing) {
          await FamilyExpenseDB.put(e);
        }
      }
    }

    // 6. Ambil Assets Conditions
    const { data: assets, error: astErr } = await supabase.from('assets_conditions').select('*');
    if (astErr) throw astErr;
    if (assets) {
      for (const a of assets) {
        const existing = await AssetsConditionDB.get(a.respondent_id);
        if (!existing) {
          await AssetsConditionDB.put(a);
        }
      }
    }

    return { success: true, message: 'Data berhasil ditarik dari Cloud' };
  } catch (err) {
    console.error('Fatal pull error:', err);
    return { success: false, message: 'Gagal menarik data: ' + err.message };
  }
};
