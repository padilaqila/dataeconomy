import Dexie from 'dexie';

export const db = new Dexie('KalkulatorSE2026DB');

db.version(1).stores({
  blocks: 'id, user_id, nama_blok, created_at',
  respondents: 'id, block_id, no_bangunan, no_urut_kk, nomor_kk, nama_kpl_keluarga, sync_status, updated_at',
  family_members: 'id, respondent_id, nama, pekerjaan, status_tinggal',
  business_details: 'respondent_id, jenis_usaha, nib',
  family_expenses: 'respondent_id', 
  assets_conditions: 'respondent_id'
});

// Version 2: Migrate pendapatan fields to match BPS R27 structure
db.version(2).stores({
  blocks: 'id, user_id, nama_blok, created_at',
  respondents: 'id, block_id, no_bangunan, no_urut_kk, nomor_kk, nama_kpl_keluarga, sync_status, updated_at',
  family_members: 'id, respondent_id, nama, pekerjaan, status_tinggal',
  business_details: 'respondent_id, jenis_usaha, nib',
  family_expenses: 'respondent_id', 
  assets_conditions: 'respondent_id'
}).upgrade(tx => {
  return tx.table('business_details').toCollection().modify(record => {
    // Migrate old pendapatan_total_bulan → pendapatan_barang_jasa_bulan (R27.a)
    if (record.pendapatan_total_bulan !== undefined && record.pendapatan_barang_jasa_bulan === undefined) {
      record.pendapatan_barang_jasa_bulan = record.pendapatan_total_bulan;
    }
    if (record.pendapatan_total_tahun !== undefined && record.pendapatan_barang_jasa_tahun === undefined) {
      record.pendapatan_barang_jasa_tahun = record.pendapatan_total_tahun;
    }
    // Initialize new R27.b fields
    if (record.pendapatan_lainnya_bulan === undefined) {
      record.pendapatan_lainnya_bulan = 0;
    }
    if (record.pendapatan_lainnya_tahun === undefined) {
      record.pendapatan_lainnya_tahun = 0;
    }
    // Calculate R27.c total
    record.total_pendapatan_tahun = (record.pendapatan_barang_jasa_tahun || 0) + (record.pendapatan_lainnya_tahun || 0);
  });
});

export const BlockDB = {
  add: async (block) => await db.blocks.add(block),
  getAllByUser: async (userId) => await db.blocks.where('user_id').equals(userId).toArray(),
  getById: async (id) => await db.blocks.get(id),
  delete: async (id) => await db.blocks.delete(id)
};

export const RespondentDB = {
  add: async (res) => await db.respondents.add(res),
  getAll: async () => await db.respondents.toArray(),
  getAllByBlock: async (blockId) => await db.respondents.where('block_id').equals(blockId).toArray(),
  getAllPending: async () => await db.respondents.where('sync_status').equals('pending').toArray(),
  getById: async (id) => await db.respondents.get(id),
  update: async (id, changes) => await db.respondents.update(id, changes),
  delete: async (id) => {
    await db.transaction('rw', db.respondents, db.family_members, db.business_details, db.family_expenses, db.assets_conditions, async () => {
      await db.respondents.delete(id);
      await db.family_members.where('respondent_id').equals(id).delete();
      await db.business_details.delete(id);
      await db.family_expenses.delete(id);
      await db.assets_conditions.delete(id);
    });
  }
};

export const FamilyMemberDB = {
  add: async (member) => await db.family_members.add(member),
  bulkAdd: async (members) => await db.family_members.bulkAdd(members),
  getAllByRespondent: async (respondentId) => await db.family_members.where('respondent_id').equals(respondentId).toArray(),
  deleteByRespondent: async (respondentId) => await db.family_members.where('respondent_id').equals(respondentId).delete()
};

export const BusinessDetailDB = {
  put: async (detail) => await db.business_details.put(detail),
  get: async (respondentId) => await db.business_details.get(respondentId)
};

export const FamilyExpenseDB = {
  put: async (expense) => await db.family_expenses.put(expense),
  get: async (respondentId) => await db.family_expenses.get(respondentId)
};

export const AssetsConditionDB = {
  put: async (asset) => await db.assets_conditions.put(asset),
  get: async (respondentId) => await db.assets_conditions.get(respondentId)
};
