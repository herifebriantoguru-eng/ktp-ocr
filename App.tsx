
import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { KtpForm } from './components/KtpForm';
import { KtpDetailModal } from './components/KtpDetailModal';
import { extractKtpData } from './services/geminiService';
import { AppState, KtpData, ViewMode } from './types';

// GANTI DENGAN URL GOOGLE APPS SCRIPT ANDA
const GAS_URL = 'https://script.google.com/macros/s/AKfycbygPARkgikX9veIV0OCCV6MKnmnU7coFxJuQGd4oNUczrzZEH3BfjlvgfcTbCuWg4Vg/exec';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    image: null,
    extractedData: null,
    status: 'idle',
    errorMessage: null,
    viewMode: 'scanner',
    history: []
  });

  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<KtpData | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS nonaktif.")
      );
    }
    fetchHistory();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${GAS_URL}?t=${Date.now()}`);
      const result = await response.json();
      if (result.status === 'success') {
        setState(prev => ({ ...prev, history: result.data || [] }));
      }
    } catch (err) {
      console.error("Gagal sinkron riwayat.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleCapture = async (base64: string) => {
    setState(prev => ({ ...prev, image: base64, status: 'processing', errorMessage: null }));
    setIsCameraActive(false);
    try {
      const data = await extractKtpData(base64);
      setState(prev => ({ ...prev, extractedData: data, status: 'success' }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: err.message
      }));
    }
  };

  const startManualInput = () => {
    setState(prev => ({
      ...prev,
      image: null,
      extractedData: {
        nik: '', nama: '', tempatLahir: '', tanggalLahir: '', jenisKelamin: '',
        alamat: '', rt: '', rw: '', kelDesa: '', kecamatan: '', kotaKabupaten: '',
        agama: '', statusPerkawinan: '', pekerjaan: '', kewarganegaraan: 'WNI', berlakuHingga: 'SEUMUR HIDUP'
      },
      status: 'success'
    }));
  };

  const handleSaveToSpreadsheet = async () => {
    if (!state.extractedData) return;
    setSaving(true);
    try {
      const payload = {
        ...state.extractedData,
        image: state.image || "", 
        latitude: location?.lat,
        longitude: location?.lng
      };
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });
      setShowToast(true);
      setState(prev => ({ ...prev, status: 'saved' }));
      setTimeout(() => setShowToast(false), 3000);
      fetchHistory();
    } catch (err) {
      alert("Error simpan data.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setState(prev => ({ ...prev, image: null, extractedData: null, status: 'idle', errorMessage: null }));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      <KtpDetailModal data={selectedDetail} onClose={() => setSelectedDetail(null)} />
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-red-100">MBG</div>
             <div>
               <h1 className="text-xl font-black text-slate-900 uppercase">ARSIP <span className="text-red-600">LANSIA</span></h1>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Digital Terpadu</p>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {state.viewMode === 'scanner' ? (
          <div className="space-y-8">
            {state.status === 'idle' && (
              <div className="flex flex-col items-center gap-6 py-10">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-3xl font-black text-slate-900 uppercase">Mulai Scan KTP</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Gunakan kamera untuk deteksi otomatis</p>
                </div>
                <CameraView onCapture={handleCapture} onActiveChange={setIsCameraActive} />
                {!isCameraActive && (
                  <div className="w-full max-w-sm space-y-3">
                    <label className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-red-500 cursor-pointer transition-all shadow-sm">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="font-black text-slate-700 text-xs uppercase tracking-widest">Pilih dari Galeri</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleCapture(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    <button onClick={startManualInput} className="w-full py-5 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest">Ketik Manual</button>
                  </div>
                )}
              </div>
            )}

            {state.status === 'processing' && (
              <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in zoom-in duration-300">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 uppercase">AI SEDANG BEKERJA...</h3>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Mengekstrak data dari gambar</p>
                </div>
              </div>
            )}

            {state.status === 'success' && state.extractedData && (
              <KtpForm 
                data={state.extractedData}
                onChange={(newData) => setState(prev => ({ ...prev, extractedData: newData }))}
                onSubmit={handleSaveToSpreadsheet}
                onReset={reset}
                isLoading={saving}
                history={state.history}
              />
            )}

            {state.status === 'saved' && (
              <div className="max-w-md mx-auto p-12 bg-white rounded-[3.5rem] shadow-2xl border-4 border-emerald-500 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">BERHASIL DISIMPAN</h2>
                <button onClick={reset} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Input Baru</button>
              </div>
            )}

            {state.status === 'error' && (
              <div className="max-w-md mx-auto p-10 bg-white rounded-[2.5rem] shadow-xl border-2 border-red-50 text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div className="space-y-3">
                   <p className="text-red-600 font-black text-lg uppercase leading-tight">Gagal Mendeteksi KTP</p>
                   <p className="text-slate-500 text-[11px] font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">{state.errorMessage}</p>
                   {state.errorMessage?.includes("REDEPLOY") && (
                     <p className="text-emerald-600 text-[10px] font-black uppercase">Solusi: Buka Vercel > Deployments > Klik titik tiga > Redeploy</p>
                   )}
                </div>
                <button onClick={reset} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Coba Lagi</button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-1">Database Cloud</h3>
                <h2 className="text-3xl font-black uppercase tracking-tighter">DAFTAR <span className="text-red-500">ARSIP</span></h2>
              </div>
              <div className="text-right">
                <span className="text-5xl font-black text-red-600 leading-none">{state.history.length}</span>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total Lansia</p>
              </div>
            </div>

            <div className="space-y-4">
              {state.history.length > 0 ? (
                state.history.map((item, idx) => (
                  <button key={idx} onClick={() => setSelectedDetail(item)} className="w-full text-left bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-300 group-hover:bg-red-50 group-hover:text-red-400">
                        {state.history.length - idx}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{item.nama}</h4>
                        <p className="text-[10px] font-bold text-red-600 tracking-widest uppercase">{item.nik}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 group-hover:bg-red-500 group-hover:text-white rounded-2xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                   <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Belum ada data masuk</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/95 backdrop-blur-2xl p-2.5 rounded-full shadow-2xl flex gap-2 z-[60]">
        <button onClick={() => setState(prev => ({ ...prev, viewMode: 'scanner' }))} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full transition-all ${state.viewMode === 'scanner' ? 'bg-red-600 text-white font-black' : 'text-slate-400 font-bold'}`}>
          <span className="text-[10px] uppercase tracking-widest">Scanner</span>
        </button>
        <button onClick={() => setState(prev => ({ ...prev, viewMode: 'history' }))} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full transition-all ${state.viewMode === 'history' ? 'bg-red-600 text-white font-black' : 'text-slate-400 font-bold'}`}>
          <span className="text-[10px] uppercase tracking-widest">Riwayat</span>
        </button>
      </nav>

      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-12 duration-500">
           <div className="bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest">Data Tersimpan ke Cloud!</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
