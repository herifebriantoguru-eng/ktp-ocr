
import React from 'react';
import { KtpData } from '../types';

interface KtpFormProps {
  data: KtpData;
  onChange: (newData: KtpData) => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading: boolean;
  history: KtpData[];
}

export const KtpForm: React.FC<KtpFormProps> = ({ data, onChange, onSubmit, onReset, isLoading, history }) => {
  const isNikValid = data.nik.length === 16;
  const isDuplicate = history.some(item => item.nik === data.nik && data.nik !== "");
  
  const requiredFields: (keyof KtpData)[] = [
    'nik', 'nama', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 
    'alamat', 'rt', 'rw', 'kelDesa', 'kecamatan', 'kotaKabupaten', 
    'agama', 'statusPerkawinan', 'pekerjaan', 'kewarganegaraan', 'berlakuHingga'
  ];

  const isFormComplete = requiredFields.every(field => {
    const value = data[field];
    return value !== undefined && value.toString().trim() !== '';
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'nik') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (e.target.type !== 'date') {
      formattedValue = value.toUpperCase();
    }
    
    onChange({ ...data, [name]: formattedValue });
  };

  const fieldConfigs = [
    { label: 'NIK (16 Digit)', name: 'nik', type: 'text', placeholder: '16 angka NIK' },
    { label: 'Nama Lengkap', name: 'nama', type: 'text' },
    { label: 'Tempat Lahir', name: 'tempatLahir', type: 'text' },
    { label: 'Tanggal Lahir', name: 'tanggalLahir', type: 'date' },
    { label: 'Jenis Kelamin', name: 'jenisKelamin', type: 'select', options: ['', 'LAKI-LAKI', 'PEREMPUAN'] },
    { label: 'Alamat', name: 'alamat', type: 'text' },
    { label: 'RT', name: 'rt', type: 'text', placeholder: '000' },
    { label: 'RW', name: 'rw', type: 'text', placeholder: '000' },
    { label: 'Kel/Desa', name: 'kelDesa', type: 'text' },
    { label: 'Kecamatan', name: 'kecamatan', type: 'text' },
    { label: 'Kota/Kabupaten', name: 'kotaKabupaten', type: 'text' },
    { label: 'Agama', name: 'agama', type: 'text' },
    { label: 'Status Perkawinan', name: 'statusPerkawinan', type: 'text' },
    { label: 'Pekerjaan', name: 'pekerjaan', type: 'text' },
    { label: 'Kewarganegaraan', name: 'kewarganegaraan', type: 'text' },
    { label: 'Berlaku Hingga', name: 'berlakuHingga', type: 'text' },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full border border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            Verifikasi & Lengkapi Data
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-12">Semua kolom bertanda wajib diisi</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {!isNikValid && data.nik.length > 0 && (
            <span className="bg-red-50 text-red-600 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-red-100 animate-pulse">
              NIK HARUS 16 DIGIT
            </span>
          )}
          {isDuplicate && (
            <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-amber-100">
              ⚠️ NIK SUDAH ADA DI RIWAYAT
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {fieldConfigs.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
              <span>{field.label}</span>
              <span className="text-red-400">*</span>
            </label>
            
            {field.type === 'select' ? (
              <select
                name={field.name}
                value={(data as any)[field.name] || ''}
                onChange={handleChange}
                className={`px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all font-bold text-gray-800 appearance-none cursor-pointer ${
                  isDuplicate && field.name === 'nik' ? 'border-amber-400' : ''
                }`}
                disabled={isLoading}
              >
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt === '' ? '-- PILIH --' : opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={(data as any)[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder || "Isi data..."}
                className={`px-4 py-3.5 bg-gray-50 border-2 rounded-2xl focus:bg-white outline-none transition-all font-bold text-gray-800 ${
                  (data as any)[field.name]?.toString().trim() === '' 
                    ? 'border-gray-50' 
                    : 'border-gray-100 focus:border-red-500'
                } ${
                  field.name === 'nik' && !isNikValid && data.nik.length > 0 ? 'border-red-200 focus:border-red-500' : ''
                } ${
                  field.name === 'nik' && isDuplicate ? 'border-amber-400 ring-2 ring-amber-100' : ''
                }`}
                disabled={isLoading}
                required
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onReset}
          className="flex-1 py-5 px-6 border-2 border-gray-100 rounded-2xl text-gray-400 font-black hover:bg-gray-50 transition active:scale-95 uppercase tracking-widest text-xs"
          disabled={isLoading}
        >
          Batal / Reset
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading || !isNikValid || !isFormComplete || isDuplicate}
          className={`flex-[2] py-5 px-6 rounded-2xl font-black transition shadow-xl flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest text-xs ${
            !isNikValid || !isFormComplete || isDuplicate
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' 
              : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isDuplicate ? (
                <span>NIK Sudah Ada</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isFormComplete ? 'Simpan Data Sekarang' : 'Lengkapi Semua Kolom'}
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
