import { supabase } from './supabase';
import { BlockDB, RespondentDB, FinancialRecordDB, DeletedRecordDB } from '../db/db';
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
      } else if (del.type === 'financial_record') {
        const { error } = await supabase.from('financial_records').delete().eq('id', del.id);
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
      if (error) {
        console.error('Sync block error:', error);
      } else if (block.sync_status !== 'synced') {
        await BlockDB.update(block.id, { sync_status: 'synced' });
      }
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
        
        if (resErr) throw resErr;

        const records = await FinancialRecordDB.getAllByRespondent(res.id);
        for (const record of records) {
          await supabase.from('financial_records').upsert({
            id: record.id,
            respondent_id: record.respondent_id,
            module_type: record.module_type || null,
            module_data: record.module_data || {},
            total_income_monthly: record.total_income_monthly || 0,
            total_income_yearly: record.total_income_yearly || 0,
            total_expense_monthly: record.total_expense_monthly || 0,
            total_expense_yearly: record.total_expense_yearly || 0,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
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
    // ── 1. Ambil Blocks dari Cloud ──────────────────────────────
    const { data: cloudBlocks, error: blockErr } = await supabase.from('blocks').select('*').eq('user_id', user.id);
    if (blockErr) throw blockErr;

    const cloudBlockIds = new Set((cloudBlocks || []).map(b => b.id));

    if (cloudBlocks) {
      for (const b of cloudBlocks) {
        const isDeletedLocal = await DeletedRecordDB.isDeleted(b.id);
        if (isDeletedLocal) continue;

        const existing = await BlockDB.getById(b.id);
        if (!existing) {
          await BlockDB.add({
            id: b.id,
            user_id: b.user_id,
            nama_blok: b.nama_blok,
            created_at: new Date(b.created_at).getTime(),
            sync_status: 'synced'
          });
        } else {
          await BlockDB.update(b.id, {
            nama_blok: b.nama_blok,
            sync_status: 'synced'
          });
        }
      }
    }

    const localBlocks = await BlockDB.getAllByUser(user.id);
    for (const lb of localBlocks) {
      if (!cloudBlockIds.has(lb.id)) {
        const isDeletedLocal = await DeletedRecordDB.isDeleted(lb.id);
        if (!isDeletedLocal && lb.sync_status !== 'pending') {
          await BlockDB.delete(lb.id);
        }
      }
    }

    // ── 2. Ambil Respondents dari Cloud ─────────────────────────
    const { data: cloudRespondents, error: resErr } = await supabase.from('respondents').select('*');
    if (resErr) throw resErr;

    const cloudRespondentIds = new Set((cloudRespondents || []).map(r => r.id));

    if (cloudRespondents) {
      for (const r of cloudRespondents) {
        const isDeletedLocal = await DeletedRecordDB.isDeleted(r.id);
        if (isDeletedLocal) continue;

        const existing = await RespondentDB.getById(r.id);
        if (!existing || existing.sync_status === 'synced') {
          const resObj = {
            id: r.id,
            block_id: r.block_id,
            no_bangunan: r.no_bangunan,
            no_urut_kk: r.no_urut_kk,
            nomor_kk: r.nomor_kk,
            nama_kpl_keluarga: r.nama_kpl_keluarga,
            alamat: r.alamat,
            sync_status: 'synced',
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

    const localAllRespondents = await RespondentDB.getAll();
    for (const lr of localAllRespondents) {
      if (!cloudRespondentIds.has(lr.id)) {
        const isDeletedLocal = await DeletedRecordDB.isDeleted(lr.id);
        if (lr.sync_status === 'synced' && !isDeletedLocal) {
          await RespondentDB.delete(lr.id);
        }
      }
    }

    // ── 3. Ambil Financial Records ─────────────────────────────────
    const { data: cloudRecords, error: recErr } = await supabase.from('financial_records').select('*');
    if (recErr) throw recErr;

    const cloudRecordIds = new Set((cloudRecords || []).map(r => r.id));

    if (cloudRecords) {
      for (const rec of cloudRecords) {
        const localRes = await RespondentDB.getById(rec.respondent_id);
        if (!localRes || localRes.sync_status === 'synced') {
          await FinancialRecordDB.put(rec);
        }
      }
    }

    // Reconcile: Hapus financial_records lokal yang tidak ada di cloud untuk respondent yang synced
    const allRespondents = await RespondentDB.getAll();
    for (const res of allRespondents) {
      if (res.sync_status === 'synced') {
        const localRecords = await FinancialRecordDB.getAllByRespondent(res.id);
        for (const lr of localRecords) {
          if (!cloudRecordIds.has(lr.id)) {
            await FinancialRecordDB.delete(lr.id);
          }
        }
      }
    }

    return { success: true, message: 'Data berhasil ditarik dari Cloud' };
  } catch (err) {
    console.error('Fatal pull error:', err);
    return { success: false, message: 'Gagal menarik data: ' + err.message };
  }
};
