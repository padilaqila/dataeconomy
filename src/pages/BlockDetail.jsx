import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import Chip from '../components/Chip';
import useUIStore from '../stores/uiStore';
import { BlockDB, RespondentDB } from '../db/db';
import { Clock, CheckCircle2 } from 'lucide-react';

export default function BlockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);
  const [respondents, setRespondents] = useState([]);
  const addToast = useUIStore(state => state.addToast);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const b = await BlockDB.getById(id);
      if (b) setBlock(b);
      
      const resList = await RespondentDB.getAllByBlock(id);
      resList.sort((a, b) => b.updated_at - a.updated_at);
      setRespondents(resList);
    } catch (e) {
      addToast('Gagal memuat data responden', 'error');
    }
  };

  const handleAddRespondent = async () => {
    const respondentId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    
    try {
      await RespondentDB.add({
        id: respondentId,
        block_id: id,
        no_bangunan: '',
        no_urut_kk: '',
        nomor_kk: '',
        nama_kpl_keluarga: 'Draft Baru',
        sync_status: 'pending',
        updated_at: Date.now()
      });
      navigate(`/wizard/${respondentId}`);
    } catch (e) {
      addToast('Gagal membuat draft', 'error');
    }
  };

  return (
    <MainLayout title={block ? `BLOK ${block.nama_blok}` : 'Detail Blok'} showBack={true} onBack={() => navigate('/dashboard')}>
      <Button className="w-full mb-6" onClick={handleAddRespondent}>
        + Tambah Responden
      </Button>

      <div className="flex flex-col space-y-4">
        {respondents.length === 0 ? (
          <div className="text-center py-10 font-['Work_Sans'] text-gray-500">
            Belum ada responden di blok ini.
          </div>
        ) : (
          respondents.map((res, idx) => (
            <Card 
              key={res.id} 
              className="cursor-pointer hover:border-[5px] transition-all"
              onClick={() => navigate(`/recap/${res.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-['Space_Mono'] text-sm font-bold bg-black text-white px-2 py-1">
                      {res.no_urut_kk || '??'}
                    </span>
                    <h4 className="font-['Archivo_Black'] text-lg uppercase truncate">
                      {res.nama_kpl_keluarga || 'Tanpa Nama'}
                    </h4>
                  </div>
                  <p className="font-['Space_Mono'] text-sm text-gray-600 mb-3">
                    KK: {res.nomor_kk || '-'}
                  </p>
                  
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
              </div>
            </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
}
