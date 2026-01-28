
import React, { useState, useEffect } from 'react';
import { KtpData } from '../types';

interface KtpDetailModalProps {
  data: KtpData | null;
  onClose: () => void;
}

export const KtpDetailModal: React.FC<KtpDetailModalProps> = ({ data, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string>('');

  useEffect(() => {
    setImageError(false);
    if (data?.linkFoto) {
      let url = data.linkFoto;
      
      // Handle Google Drive links to make them direct image links
      // Format: https://drive.google.com/file/d/ID/view?usp=sharing 
      // OR https://drive.google.com/open?id=ID
      const driveIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      
      if (driveIdMatch && driveIdMatch[1]) {
        // use googleusercontent for direct image embedding
        url = `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
      }
      
      setDisplayUrl(url);
    }
  }, [data]);

  if (!data) return null;

  const detailGroups = [
    {
      title: "Identitas Utama",
      fields: [
        { label: "NIK", value: data.nik },
        { label: "Nama Lengkap", value: data.nama },
        { label: "Tempat Lahir", value: data.tempatLahir },
        { label: "Tanggal Lahir", value: data.tanggalLahir },
        { label: "Jenis Kelamin", value: data.jenisKelamin },
      ]
    },
    {
      title: "Alamat & Lokasi",
      fields: [
        { label: "Alamat", value: data.alamat },
        { label: "RT/RW", value: `${data.rt}/${data.rw}` },
        { label: "Kel/Desa", value: data.kelDesa },
        { label: "Kecamatan", value: data.kecamatan },
        { label: "Kota/Kabupaten", value: data.kotaKabupaten },
      ]
    },
    {
      title: "Informasi Tambahan",
      fields: [
        { label: "Agama", value: data.agama },
        { label: "Status Perkawinan", value: data.statusPerkawinan },
        { label: "Pekerjaan", value: data.pekerjaan },
        { label: "Kewarganegaraan", value: data.kewarganegaraan },
        { label: "Berlaku Hingga", value: data.berlakuHingga },
      ]
    }
  ];

  const hasValidPhoto = data.linkFoto && 
    data.linkFoto.startsWith('http') && 
    !data.linkFoto.includes('Tidak Ada') && 
    !data.linkFoto.includes('Gagal');

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 p-6 flex justify-between items-center border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black italic">MBG</div>
            <div>
              <h2 className="text-white text-lg font-black uppercase tracking-tight">Detail Data KTP</h2>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">VERIFIED ARCHIVE SYSTEM</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8 pb-12">
          {/* Photo Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-red-600 rounded-full"></div>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Foto KTP Terlampir</h3>
            </div>
            
            {hasValidPhoto && !imageError ? (
              <div className="group relative rounded-3xl overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-inner transition-all hover:border-red-100">
                <img 
                  src={displayUrl} 
                  alt="KTP Original" 
                  className="w-full h-auto max-h-[320px] object-contain mx-auto"
                  onError={() => {
                    console.error("Image load failed for URL:", displayUrl);
                    setImageError(true);
                  }}
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <a 
                  href={data.linkFoto} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95"
                >
                  Buka Full Resolution
                </a>
              </div>
            ) : (
              <div className="w-full py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">
                    {imageError ? 'Gagal Memuat Foto' : 'Foto Tidak Tersedia'}
                  </p>
                  <p className="text-gray-400 font-bold text-[9px] mt-1 max-w-[200px] mx-auto">
                    {imageError ? 'Server menolak akses gambar atau URL tidak valid.' : 'Data ini diinput tanpa lampiran foto.'}
                  </p>
                </div>
                {hasValidPhoto && imageError && (
                  <a href={data.linkFoto} target="_blank" rel="noopener noreferrer" className="text-red-600 text-[10px] font-black underline uppercase tracking-widest mt-2">Coba Buka Langsung</a>
                )}
              </div>
            )}
          </div>

          {detailGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4 bg-red-600 rounded-full"></div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{group.title}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map((field, fIdx) => (
                  <div key={fIdx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:bg-white hover:border-red-100 hover:shadow-sm transition-all">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-red-600 transition-colors">{field.label}</p>
                    <p className="text-gray-900 font-bold uppercase tracking-tight break-words">{field.value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {data.latitude && data.longitude && (
            <div className="pt-4">
              <a 
                href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-6 bg-green-50 text-green-700 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-green-100 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-xl shadow-green-100 active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Lihat Lokasi Penginputan (Google Maps)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
