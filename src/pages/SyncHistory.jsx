import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import Chip from '../components/Chip';
import useUIStore from '../stores/uiStore';
import { RespondentDB } from '../db/db';
import { syncData } from '../lib/sync';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';

export default function SyncHistory() {
  const navigate = useNavigate();
  const addToast = useUIStore(state => state.addToast);
  
  const [respondents, setRespondents] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const resList = await RespondentDB.getAll();
    resList.sort((a, b) => b.updated_at - a.updated_at);
    setRespondents(resList);
  };

  const handleSync = async () => {
    if (!navigator.onLine) {
      addToast('Anda sedang offline', 'error');
      return;
    }
    setSyncing(true);
    addToast('Memulai sinkronisasi...', 'success');
    
    const res = await syncData();
    if (res.success) {
      if (res.count > 0) addToast(res.message, 'success');
      loadData();
    } else {
      addToast(res.message, 'error');
    }
    setSyncing(false);
  };

  const pendingCount = respondents.filter(r => r.sync_status === 'pending').length;

  return (
    <MainLayout title="Sinkronisasi" showBack={true} onBack={() => navigate('/dashboard')}>
      <Card className="mb-6 bg-[#F0F0F0]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-['Archivo_Black'] text-xl uppercase mb-1">Status Data</h4>
            <p className="font-['Space_Mono'] text-sm">
              {pendingCount > 0 ? `${pendingCount} Data menunggu sinkronisasi` : 'Semua data sudah tersinkronisasi'}
            </p>
          </div>
          <Button onClick={handleSync} disabled={syncing || pendingCount === 0} className="flex items-center justify-center">
            <RefreshCw size={18} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} /> 
            {syncing ? 'Proses...' : 'Sync Sekarang'}
          </Button>
        </div>
      </Card>

      <div className="flex flex-col space-y-4">
        {respondents.map(res => (
          <Card key={res.id} className="flex justify-between items-center">
            <div>
              <h5 className="font-['Archivo_Black'] text-lg uppercase">{res.nama_kpl_keluarga || 'Tanpa Nama'}</h5>
              <p className="font-['Space_Mono'] text-sm opacity-70">Blok: {res.block_id?.substring(0,6)}... | No: {res.no_urut_kk}</p>
            </div>
            <div>
              {res.sync_status === 'synced' ? (
                <Chip variant="status_active" className="flex items-center">
                  <CheckCircle2 size={12} className="mr-1" strokeWidth={3} /> Synced
                </Chip>
              ) : (
                <Chip variant="status_warning" className="flex items-center">
                  <Clock size={12} className="mr-1" strokeWidth={3} /> Pending
                </Chip>
              )}
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
