import { create } from 'zustand';

const useFormStore = create((set) => ({
  respondentId: null,
  step1: {}, 
  step2: {}, 
  step3: {}, 
  step4: {}, 
  step5: {}, 
  step6: {}, 

  initForm: (respondentId) => set({
    respondentId,
    step1: {},
    step2: {},
    step3: {},
    step4: {},
    step5: {},
    step6: {}
  }),

  setStepData: (step, data) => set((state) => ({
    [step]: { ...state[step], ...data }
  })),

  // Memuat data dari Dexie ke memori state untuk di-edit
  loadFromDB: (data) => set((state) => ({
    ...state,
    ...data
  }))
}));

export default useFormStore;
