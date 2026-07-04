import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import { BlockDB, RespondentDB } from '../db/db';

export default function Dashboard() {
  const [blocks, setBlocks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [counts, setCounts] = useState({});
  const { user, signOut } = useAuthStore();
  const addToast = useUIStore(state => state.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    loadBlocks();
  }, [user]);

  const loadBlocks = async () => {
    if (!user) return;
    try {
      const data = await BlockDB.getAllByUser(user.id);
      data.sort((a, b) => b.created_at - a.created_at);
      setBlocks(data);
      
      const newCounts = {};
      for (const b of data) {
        const respondents = await RespondentDB.getAllByBlock(b.id);
        newCounts[b.id] = respondents.length;
      }
      setCounts(newCounts);
    } catch (e) {
      console.error(e);
      addToast('Gagal memuat daftar blok', 'error');
    }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!newBlockName.trim()) return;
    
    try {
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      await BlockDB.add({
        id,
        user_id: user.id,
        nama_blok: newBlockName,
        created_at: Date.now()
      });
      addToast('Blok berhasil ditambahkan', 'success');
      setNewBlockName('');
      setShowAdd(false);
      loadBlocks();
    } catch (e) {
      addToast('Gagal menambah blok', 'error');
    }
  };

  return (
    <MainLayout title="Daftar Blok" className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-['Archivo_Black'] text-xl md:text-2xl uppercase">Blok Sensus</h3>
        <Button size="small" onClick={() => signOut()}>Logout</Button>
      </div>

      {!showAdd ? (
        <Button className="w-full mb-6" onClick={() => setShowAdd(true)}>
          + Tambah Blok Baru
        </Button>
      ) : (
        <Card className="mb-6 bg-[#F0F0F0]">
          <form onSubmit={handleAddBlock}>
            <Input 
              label="Nama/Kode Blok Sensus" 
              value={newBlockName}
              onChange={(e) => setNewBlockName(e.target.value)}
              placeholder="Contoh: 001A"
              autoFocus
            />
            <div className="flex space-x-3 mt-4">
              <Button type="submit" className="flex-1">Simpan</Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Batal</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-col space-y-4">
        {blocks.length === 0 && !showAdd && (
          <div className="text-center py-10 font-['Work_Sans'] text-gray-500">
            Belum ada blok. Klik "Tambah Blok Baru" untuk memulai.
          </div>
        )}
        
        {blocks.map(block => (
          <Card 
            key={block.id} 
            className="cursor-pointer hover:bg-black hover:text-white transition-colors group"
            onClick={() => navigate(`/block/${block.id}`)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-['Archivo_Black'] text-xl uppercase group-hover:text-white">{block.nama_blok}</h4>
                <p className="font-['Space_Mono'] text-sm mt-1 text-gray-600 group-hover:text-gray-300">
                  {counts[block.id] || 0} Responden
                </p>
              </div>
              <div className="text-2xl font-['Space_Mono'] opacity-50 group-hover:text-white group-hover:opacity-100">
                →
              </div>
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
