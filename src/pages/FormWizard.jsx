import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import useUIStore from '../stores/uiStore';
import { RespondentDB, FinancialRecordDB } from '../db/db';
import { syncData } from '../lib/sync';
import { Edit2, Trash2 } from 'lucide-react';

import Step1 from './wizard/Step1';
import ModuleSelector from './modules/ModuleSelector';
import ModuleRumahTangga from './modules/ModuleRumahTangga';
import ModulePertanian from './modules/ModulePertanian';
import ModulePerdagangan from './modules/ModulePerdagangan';
import ModulePeternakan from './modules/ModulePeternakan';
import ModulePerikanan from './modules/ModulePerikanan';
import ModuleIndustri from './modules/ModuleIndustri';

export default function FormWizard() {
  const { respondentId } = useParams();
  const navigate = useNavigate();
  const addToast = useUIStore(state => state.addToast);
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  
  const [currentStep, setCurrentStep] = useState(1); // 1=Identitas, 2=Daftar Modul, 3=Pilih Modul, 4=Form Modul
  const [records, setRecords] = useState([]);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [moduleType, setModuleType] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRespondentData();
  }, [respondentId]);

  const loadRespondentData = async () => {
    try {
      const respondent = await RespondentDB.getById(respondentId);
      if (!respondent) {
        addToast('Responden tidak ditemukan', 'error');
        navigate('/dashboard');
        return;
      }
      
      await loadRecords();
      setLoading(false);
    } catch (e) {
      addToast('Gagal memuat data', 'error');
      navigate('/dashboard');
    }
  };

  const loadRecords = async () => {
    const recs = await FinancialRecordDB.getAllByRespondent(respondentId);
    setRecords(recs);
  };

  const handleBackNavigation = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      if (currentStep === 1) {
        navigate(-1);
      } else if (currentStep === 2) {
        setCurrentStep(1);
      } else if (currentStep === 3) {
        setCurrentStep(2);
      } else if (currentStep === 4) {
        setCurrentStep(2);
      }
    }
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setIsDirty(false);
    handleBackNavigation();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const onNextStep1 = async (dataToSave, saveFunction) => {
    try {
      if (saveFunction) await saveFunction(dataToSave);
      setIsDirty(false);
      addToast('Identitas Tersimpan', 'success');
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } catch (e) {
      addToast('Gagal menyimpan identitas', 'error');
    }
  };

  const handleAddModule = () => {
    setCurrentStep(3);
  };

  const onSelectModule = async (type) => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    try {
      await FinancialRecordDB.put({
        id: newId,
        respondent_id: respondentId,
        module_type: type,
        module_data: {},
        total_income_monthly: 0,
        total_income_yearly: 0,
        total_expense_monthly: 0,
        total_expense_yearly: 0
      });
      setModuleType(type);
      setActiveRecordId(newId);
      setCurrentStep(4);
    } catch (e) {
      addToast('Gagal memilih modul', 'error');
    }
  };

  const handleEditRecord = (record) => {
    setModuleType(record.module_type);
    setActiveRecordId(record.id);
    setCurrentStep(4);
  };

  const handleDeleteRecord = (id) => {
    const showConfirm = useUIStore.getState().showConfirm;
    showConfirm({
      title: 'Hapus Sektor Usaha',
      message: 'Yakin ingin menghapus sektor usaha ini? Data yang dihapus tidak bisa dikembalikan.',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          await FinancialRecordDB.delete(id);
          const { DeletedRecordDB } = await import('../db/db');
          await DeletedRecordDB.add({ id, type: 'financial_record', created_at: Date.now() });
          
          await loadRecords();
          addToast('Sektor berhasil dihapus', 'success');
        } catch (e) {
          console.error(e);
          addToast('Gagal menghapus sektor', 'error');
        }
      }
    });
  };

  const onFinishModule = async () => {
    setIsDirty(false);
    addToast('Modul Tersimpan', 'success');
    await loadRecords();
    setCurrentStep(2); // Kembali ke Daftar Modul
  };

  const handleCompleteAll = async () => {
    await RespondentDB.update(respondentId, { sync_status: 'pending', updated_at: Date.now() });
    navigate(`/recap/${respondentId}`);
    syncData().catch(e => console.error('Auto-sync failed', e));
  };

  if (loading) return <MainLayout title="Loading..." />;

  const renderContent = () => {
    if (currentStep === 1) {
      return <Step1 respondentId={respondentId} onNext={onNextStep1} setDirty={setIsDirty} isEditMode={isEditMode} />;
    }
    
    if (currentStep === 2) {
      return (
        <div>
          <Card className="mb-6">
            <h4 className="font-['Archivo_Black'] uppercase mb-4 text-xl">Daftar Sektor Usaha</h4>
            <p className="font-['Work_Sans'] mb-4 text-gray-700">Responden ini memiliki catatan keuangan berikut:</p>
            
            {records.length === 0 ? (
              <div className="text-center py-6 border-[3px] border-black border-dashed mb-4 bg-gray-50">
                <p className="font-['Work_Sans'] opacity-60">Belum ada modul ditambahkan</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 mb-6">
                {records.map(r => (
                  <div key={r.id} className="border-[3px] border-black p-3 bg-white flex justify-between items-center">
                    <div>
                      <h5 className="font-['Archivo_Black'] uppercase text-sm">{r.module_type.replace('_', ' ')}</h5>
                      <span className="font-['Space_Mono'] text-xs opacity-60">Pengeluaran: Rp {r.total_expense_monthly.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditRecord(r)} className="p-2 bg-black text-white active:scale-95"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteRecord(r.id)} className="p-2 bg-red-500 text-white active:scale-95"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Button variant="secondary" className="w-full border-dashed mb-6" onClick={handleAddModule}>
              + Tambah Sektor Usaha
            </Button>

            <Button className="w-full" onClick={handleCompleteAll} disabled={records.length === 0}>
              Selesai & Lihat Rekapitulasi
            </Button>
          </Card>
        </div>
      );
    }
    
    if (currentStep === 3) {
      return <ModuleSelector selected={null} onSelect={onSelectModule} />;
    }
    
    if (currentStep === 4) {
      if (moduleType === 'RUMAH_TANGGA') {
        return <ModuleRumahTangga recordId={activeRecordId} onFinish={onFinishModule} setDirty={setIsDirty} />;
      } else if (moduleType === 'PERTANIAN') {
        return <ModulePertanian recordId={activeRecordId} onFinish={onFinishModule} setDirty={setIsDirty} />;
      } else if (moduleType === 'PERDAGANGAN_JASA') {
        return <ModulePerdagangan recordId={activeRecordId} onFinish={onFinishModule} setDirty={setIsDirty} />;
      } else if (moduleType === 'PETERNAKAN') {
        return <ModulePeternakan recordId={activeRecordId} onFinish={onFinishModule} setDirty={setIsDirty} />;
      } else if (moduleType === 'PERIKANAN') {
        return <ModulePerikanan recordId={activeRecordId} onFinish={onFinishModule} setDirty={setIsDirty} />;
      } else if (moduleType === 'INDUSTRI_PENGOLAHAN') {
        return <ModuleIndustri recordId={activeRecordId} onFinish={onFinishModule} setDirty={setIsDirty} />;
      }
      
      return (
        <div className="text-center py-10 font-['Work_Sans']">
          <p className="mb-4">Modul {moduleType} belum diimplementasikan di versi PoC ini.</p>
          <Button onClick={() => setCurrentStep(2)}>Kembali ke Daftar Modul</Button>
        </div>
      );
    }
  };

  const stepTitles = ["Identitas & Anggota", "Daftar Sektor Usaha", "Pilih Sektor", "Pengisian Modul"];
  const progressRatio = currentStep === 1 ? 0.25 : currentStep === 2 ? 0.5 : currentStep === 3 ? 0.75 : 1;

  return (
    <MainLayout 
      title={stepTitles[currentStep-1]} 
      showBack={true} 
      onBack={handleBackNavigation}
    >
      <div className="mb-6 bg-[#F0F0F0] h-3 w-full border-[3px] border-black">
        <div 
          className="bg-black h-full transition-all duration-300" 
          style={{ width: `${progressRatio * 100}%` }}
        />
      </div>

      <div className="mb-8">
        {renderContent()}
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-[5px] border-black p-6 max-w-sm w-full">
            <h2 className="font-['Archivo_Black'] uppercase text-xl mb-4">Peringatan</h2>
            <p className="font-['Work_Sans'] text-[15px] mb-6">
              Data di halaman ini belum disimpan. Tekan 'Lanjut' dulu sebelum keluar, atau data yang baru diisi akan hilang.
            </p>
            <div className="flex flex-col space-y-3">
              <Button onClick={cancelExit}>Lanjut Isi</Button>
              <Button variant="destructive" onClick={confirmExit}>Keluar Tanpa Simpan</Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
