
import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { KtpForm } from './components/KtpForm';
import { KtpDetailModal } from './components/KtpDetailModal';
import { extractKtpData } from './services/geminiService';
import { AppState, KtpData, ViewMode } from './types';

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
        (err) => console.warn("Geolocation access denied", err)
      );
    }
    fetchHistory();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${GAS_URL}?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setState(prev => ({ ...prev, history: result.data || [] }));
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleCapture = async (base64: string) => {
    setState(prev => ({ ...prev, image: base64, status: 'processing', errorMessage: null }));
    setIsCameraActive(false);
    try {
      const data = await extractKtpData(base64);
      // Clean up extracted data (Uppercase all except dates)
      const formattedData: KtpData = Object.keys(data).reduce((acc, key) => {
        const val = (data as any)[key];
        (acc as any)[key] = (typeof val === 'string' && key !== 'tanggalLahir') ? val.toUpperCase() : val;
        return acc;
      }, {} as KtpData);

      setState(prev => ({ ...prev, extractedData: formattedData, status: 'success' }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: err.message || "Gagal memproses gambar." 
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setShowToast(true);
      setState(prev => ({ ...prev, status: 'saved' }));
      setTimeout(() => setShowToast(false), 3000);
      fetchHistory();
    } catch (err) {
      console.error("Save error:", err);
      alert("Terjadi kesalahan teknis. Mohon periksa koneksi internet.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setState(prev => ({
      ...prev,
      image: null,
      extractedData: null,
      status: 'idle',
      errorMessage: null,
    }));
  };

  // Function to change the current view mode between 'scanner' and 'history'
  const changeView = (mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      <KtpDetailModal data={selectedDetail} onClose={() => setSelectedDetail(null)} />
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-red-100">MBG</div>
             <div>
               <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">ARSIP <span className="text-red-600">LANSIA</span></h1>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Pendataan Terpadu</p>
             </div>
          </div>
          {location && (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest">GPS Active</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {state.viewMode === 'scanner' ? (
          <div className="space-y-8">
            {state.status === 'idle' && (
              <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500 py-10">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Mulai Pendataan</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Pilih metode pengambilan data KTP</p>
                </div>
                
                <CameraView onCapture={handleCapture} onActiveChange={setIsCameraActive} />
                
                {!isCameraActive && (
                  <div className="w-full max-w-sm space-y-3">
                    <label className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-red-500 transition-all cursor-pointer group shadow-sm">
                      <svg className="w-6 h-6 text-slate-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="font-black text-slate-700 group-hover:text-red-600 text-xs uppercase tracking-[0.2em]">Upload dari Galeri</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleCapture(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>

                    <button 
                      onClick={startManualInput}
                      className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-3xl hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <span className="font-black text-xs uppercase tracking-[0.2em]">Input Data Manual</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {state.status === 'processing' && (
              <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in zoom-in duration-300">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 w-24 h-24 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-600 rounded-full animate-ping"></div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI MENGANALISA...</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Mohon tunggu sebentar</p>
                </div>
              </div>
            )}

            {state.status === 'success' && state.extractedData && (
              <div className="animate-in slide-in-from-bottom-6 duration-500">
                <KtpForm 
                  data={state.extractedData}
                  onChange={(newData) => setState(prev => ({ ...prev, extractedData: newData }))}
                  onSubmit={handleSaveToSpreadsheet}
                  onReset={reset}
                  isLoading={saving}
                  history={state.history}
                />
              </div>
            )}

            {state.status === 'saved' && (
              <div className="max-w-md mx-auto p-12 bg-white rounded-[3.5rem] shadow-2xl border-4 border-emerald-500 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">DATA TERSIMPAN</h2>
                  <p className="text-slate-400 font-bold text-xs mt-2">Data lansia berhasil masuk database.</p>
                </div>
                <button onClick={reset} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-200">Input Baru</button>
              </div>
            )}

            {state.status === 'error' && (
              <div className="max-w-md mx-auto p-10 bg-white rounded-[2.5rem] shadow-xl border-2 border-red-50 text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-red-600 font-black text-lg uppercase tracking-tight leading-tight">{state.errorMessage}</p>
                <button onClick={reset} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-100">Coba Lagi</button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/20 blur-[80px] rounded-full group-hover:bg-red-600/30 transition-all duration-700"></div>
              <div className="relative flex justify-between items-center">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-1">Status Database</h3>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">RIWAYAT <span className="text-red-500">ARSIP</span></h2>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-red-600 leading-none">{state.history.length}</span>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total Terdaftar</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Data Terakhir</h2>
                 <button onClick={fetchHistory} className={`p-3 bg-white text-slate-400 hover:text-red-600 rounded-2xl shadow-sm border border-slate-100 transition-all ${loadingHistory ? 'animate-spin' : ''}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>
              </div>

              {state.history.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {state.history.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedDetail(item)}
                      className="w-full text-left bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:border-red-100 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-50 group-hover:bg-red-50 rounded-2xl flex items-center justify-center font-black text-slate-300 group-hover:text-red-400 transition-colors">
                          {state.history.length - idx}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{item.nama}</h4>
                          <p className="text-[10px] font-bold text-red-600 tracking-widest uppercase mb-1">{item.nik}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[8px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase text-slate-400 tracking-widest">{item.kelDesa || 'N/A'}</span>
                             {item.latitude && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">📍 Berlokasi</span>}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 group-hover:bg-red-500 group-hover:text-white rounded-2xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                   <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Belum Ada Data</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/95 backdrop-blur-2xl p-2.5 rounded-full shadow-2xl flex gap-2 z-[60] border border-white/10">
        <button 
          onClick={() => changeView('scanner')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-full transition-all ${state.viewMode === 'scanner' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20 font-black' : 'text-slate-400 hover:text-white font-bold'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
          <span className="text-[10px] uppercase tracking-widest">Scanner</span>
        </button>
        <button 
          onClick={() => changeView('history')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-full transition-all ${state.viewMode === 'history' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20 font-black' : 'text-slate-400 hover:text-white font-bold'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span className="text-[10px] uppercase tracking-widest">Riwayat</span>
        </button>
      </nav>

      {/* TOAST SUCCESS */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-12 duration-500">
           <div className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-emerald-400">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi Berhasil!</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
