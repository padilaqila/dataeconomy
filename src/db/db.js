import Dexie from 'dexie';

export const db = new Dexie('KalkulatorSE2026DB');

db.version(1).stores({
  blocks: 'id, user_id, nama_blok, created_at',
  respondents: 'id, block_id, no_bangunan, no_urut_kk, nomor_kk, nama_kpl_keluarga, sync_status, updated_at',
  family_members: 'id, respondent_id, nama, pekerjaan, status_tinggal',
  business_details: 'respondent_id, jenis_usaha, nib',
  family_expenses: 'respondent_id', 
  assets_conditions: 'respondent_id',
  deleted_records: 'id, type, created_at'
});

// Version 2: Migrate pendapatan fields to match BPS R27 structure
db.version(2).stores({
  blocks: 'id, user_id, nama_blok, created_at',
  respondents: 'id, block_id, no_bangunan, no_urut_kk, nomor_kk, nama_kpl_keluarga, sync_status, updated_at',
  family_members: 'id, respondent_id, nama, pekerjaan, status_tinggal',
  business_details: 'respondent_id, jenis_usaha, nib',
  family_expenses: 'respondent_id', 
  assets_conditions: 'respondent_id'
});

// Version 3: Add deleted_records for offline deletion sync
db.version(3).stores({
  blocks: 'id, user_id, nama_blok, created_at',
  respondents: 'id, block_id, no_bangunan, no_urut_kk, nomor_kk, nama_kpl_keluarga, sync_status, updated_at',
  family_members: 'id, respondent_id, nama, pekerjaan, status_tinggal',
  business_details: 'respondent_id, jenis_usaha, nib',
  family_expenses: 'respondent_id', 
  assets_conditions: 'respondent_id',
  deleted_records: 'id, type, created_at' // type: 'respondent' | 'block'
});

// Version 4: PRD 3.0.0 Refactor (6 Modules). Drop old tables, add financial_records
db.version(4).stores({
  blocks: 'id, user_id, nama_blok, created_at',
  respondents: 'id, block_id, no_bangunan, no_urut_kk, nomor_kk, nama_kpl_keluarga, sync_status, updated_at',
  financial_records: 'respondent_id, module_type',
  deleted_records: 'id, type, created_at',
  family_members: null,
  business_details: null,
  family_expenses: null,
  assets_conditions: null
});

// Version 6: Allow multiple financial records by renaming local table to avoid Dexie PK error
db.version(6).stores({
  blocks: 'id, user_id, nama_blok, created_at',
  respondents: 'id, block_id, no_bangunan, no_urut_kk, nomor_kk, nama_kpl_keluarga, sync_status, updated_at',
  financial_data: 'id, respondent_id, module_type',
  financial_records: null, // Drop old table
  deleted_records: 'id, type, created_at',
});

export const BlockDB = {
  add: async (block) => await db.blocks.add(block),
  getAllByUser: async (userId) => await db.blocks.where('user_id').equals(userId).toArray(),
  getById: async (id) => await db.blocks.get(id),
  update: async (id, changes) => await db.blocks.update(id, changes),
  delete: async (id) => {
    const respondents = await db.respondents.where('block_id').equals(id).toArray();
    for (const res of respondents) {
      await db.transaction('rw', db.respondents, db.financial_data, async () => {
        await db.respondents.delete(res.id);
        await db.financial_data.where('respondent_id').equals(res.id).delete();
      });
    }
    await db.blocks.delete(id);
  }
};

export const RespondentDB = {
  add: async (res) => await db.respondents.add(res),
  getAll: async () => await db.respondents.toArray(),
  getAllByBlock: async (blockId) => await db.respondents.where('block_id').equals(blockId).toArray(),
  getAllPending: async () => await db.respondents.where('sync_status').equals('pending').toArray(),
  getById: async (id) => await db.respondents.get(id),
  update: async (id, changes) => await db.respondents.update(id, changes),
  delete: async (id) => {
    await db.transaction('rw', db.respondents, db.financial_data, async () => {
      await db.respondents.delete(id);
      await db.financial_data.where('respondent_id').equals(id).delete();
    });
  }
};

export const FinancialRecordDB = {
  put: async (record) => await db.financial_data.put(record),
  getById: async (id) => await db.financial_data.get(id),
  getAllByRespondent: async (respondentId) => await db.financial_data.where('respondent_id').equals(respondentId).toArray(),
  delete: async (id) => await db.financial_data.delete(id)
};

export const DeletedRecordDB = {
  add: async (record) => await db.deleted_records.put(record),
  getAll: async () => await db.deleted_records.toArray(),
  delete: async (id) => await db.deleted_records.delete(id),
  isDeleted: async (id) => {
    const record = await db.deleted_records.get(id);
    return !!record;
  }
};
