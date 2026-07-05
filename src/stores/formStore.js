import { create } from 'zustand';

const useFormStore = create((set) => ({
  respondentId: null,
  step1: {}, 
  step2: {}, 
  step3: {}, 
  step4: {}, 
  step5: {}, 
  step6: {}, 
  bpsData: {
    r26a: 0, // Upah
    r26b: 0, // Biaya produksi
    r26c: 0, // Pembelian barang dagangan
    r26d: 0, // Operasional
    r26e: 0, // Non-operasional
    r27a: 0, // Nilai penjualan/pendapatan utama
    r27b: 0  // Pendapatan lainnya
  },

  initForm: (respondentId) => set({
    respondentId,
    step1: {},
    step2: {},
    step3: {},
    step4: {},
    step5: {},
    step6: {},
    bpsData: { r26a: 0, r26b: 0, r26c: 0, r26d: 0, r26e: 0, r27a: 0, r27b: 0 }
  }),

  setStepData: (step, data) => set((state) => ({
    [step]: { ...state[step], ...data }
  })),

  setBpsData: (data) => set((state) => ({
    bpsData: { ...state.bpsData, ...data }
  })),

  // Memuat data dari Dexie ke memori state untuk di-edit
  loadFromDB: (data) => set((state) => ({
    ...state,
    ...data
  }))
}));

export default useFormStore;
