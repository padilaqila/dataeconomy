import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import useUIStore from '../stores/uiStore';
import { RespondentDB } from '../db/db';
import { syncData } from '../lib/sync';

import Step1 from './wizard/Step1';
import Step2 from './wizard/Step2';
import Step3 from './wizard/Step3';
import Step4 from './wizard/Step4';
import Step5 from './wizard/Step5';
import Step6 from './wizard/Step6';

export default function FormWizard() {
  const { respondentId } = useParams();
  const navigate = useNavigate();
  const addToast = useUIStore(state => state.addToast);
  const [searchParams] = useSearchParams();
  const stepParam = parseInt(searchParams.get('step'));
  const isEditMode = searchParams.get('mode') === 'edit';
  const entryStep = stepParam && stepParam >= 1 && stepParam <= 6 ? stepParam : 1;
  
  const [currentStep, setCurrentStep] = useState(entryStep);
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
      setLoading(false);
    } catch (e) {
      addToast('Gagal memuat data', 'error');
      navigate('/dashboard');
    }
  };

  const handleBackNavigation = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      if (isEditMode || currentStep <= entryStep) {
        navigate(-1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setIsDirty(false);
    if (isEditMode || currentStep <= entryStep) {
      navigate(-1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const onNext = async (dataToSave, saveFunction) => {
    try {
      if (saveFunction) {
        await saveFunction(dataToSave);
      }
      
      setIsDirty(false);
      addToast('Tersimpan', 'success');
      
      if (isEditMode) {
        await RespondentDB.update(respondentId, { sync_status: 'pending', updated_at: Date.now() });
        navigate(`/recap/${respondentId}`);
        syncData().catch(e => console.error('Auto-sync failed', e));
        return;
      }

      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        await RespondentDB.update(respondentId, { sync_status: 'pending', updated_at: Date.now() });
        navigate(`/recap/${respondentId}`);
        syncData().catch(e => console.error('Auto-sync failed', e));
      }
    } catch (e) {
      addToast('Gagal menyimpan data', 'error');
      console.error(e);
    }
  };

  if (loading) return <MainLayout title="Loading..." />;

  const stepTitles = [
    "Identitas & Anggota",
    "Profil & Pengeluaran Usaha",
    "Pendapatan & Aset",
    "Pengeluaran Makan",
    "Pengeluaran Non-Makan",
    "Aset & Hunian"
  ];

  return (
    <MainLayout 
      title={`Step ${currentStep}: ${stepTitles[currentStep-1]}`} 
      showBack={true} 
      onBack={handleBackNavigation}
    >
      <div className="mb-6 bg-[#F0F0F0] h-3 w-full border-[3px] border-black">
        <div 
          className="bg-black h-full transition-all duration-300" 
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      <div className="mb-8">
        {currentStep === 1 && <Step1 respondentId={respondentId} onNext={onNext} setDirty={setIsDirty} isEditMode={isEditMode} />}
        {currentStep === 2 && <Step2 respondentId={respondentId} onNext={onNext} setDirty={setIsDirty} isEditMode={isEditMode} />}
        {currentStep === 3 && <Step3 respondentId={respondentId} onNext={onNext} setDirty={setIsDirty} isEditMode={isEditMode} />}
        {currentStep === 4 && <Step4 respondentId={respondentId} onNext={onNext} setDirty={setIsDirty} isEditMode={isEditMode} />}
        {currentStep === 5 && <Step5 respondentId={respondentId} onNext={onNext} setDirty={setIsDirty} isEditMode={isEditMode} />}
        {currentStep === 6 && <Step6 respondentId={respondentId} onNext={onNext} setDirty={setIsDirty} isEditMode={isEditMode} />}
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-[5px] border-black p-6 max-w-sm w-full">
            <h2 className="font-['Archivo_Black'] uppercase text-xl mb-4">Peringatan</h2>
            <p className="font-['Work_Sans'] text-[15px] mb-6">
              Data di halaman ini belum disimpan. Tekan 'Lanjut' dulu sebelum keluar, atau data yang baru diisi akan hilang.
            </p>
            <div className="flex flex-col space-y-3">
              <Button onClick={cancelExit}>
                Lanjut Isi
              </Button>
              <Button variant="destructive" onClick={confirmExit}>
                Keluar Tanpa Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
