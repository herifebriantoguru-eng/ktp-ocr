
import { GoogleGenAI, Type } from "@google/genai";
import { KtpData } from "../types";

/**
 * Fungsi deteksi kunci yang aman dari crash browser
 */
const getApiKey = () => {
  try {
    // 1. Cek process.env secara aman
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
    // 2. Cek window.process (beberapa environment preview)
    const win = window as any;
    if (win.process?.env?.API_KEY) {
      return win.process.env.API_KEY;
    }
    // 3. Cek variabel global cadangan
    if (win.API_KEY) return win.API_KEY;
  } catch (e) {
    console.warn("Gagal mengakses environment variables:", e);
  }
  return null;
};

export const extractKtpData = async (base64Image: string): Promise<KtpData> => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === "undefined" || apiKey === "null") {
    throw new Error("KUNCI_TIDAK_TERDETEKSI: API_KEY masih kosong di aplikasi. \n\nLangkah Wajib: \n1. Pastikan sudah klik 'Save' di Vercel Settings. \n2. Buka tab 'Deployments' di Vercel. \n3. Klik titik tiga (...) pada baris teratas, lalu klik 'REDEPLOY'.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData,
            },
          },
          {
            text: `Ekstrak data KTP Indonesia ini ke JSON. Gunakan HURUF KAPITAL. NIK harus 16 digit.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nik: { type: Type.STRING },
            nama: { type: Type.STRING },
            tempatLahir: { type: Type.STRING },
            tanggalLahir: { type: Type.STRING },
            jenisKelamin: { type: Type.STRING },
            alamat: { type: Type.STRING },
            rt: { type: Type.STRING },
            rw: { type: Type.STRING },
            kelDesa: { type: Type.STRING },
            kecamatan: { type: Type.STRING },
            kotaKabupaten: { type: Type.STRING },
            agama: { type: Type.STRING },
            statusPerkawinan: { type: Type.STRING },
            pekerjaan: { type: Type.STRING },
            kewarganegaraan: { type: Type.STRING },
            berlakuHingga: { type: Type.STRING },
          },
          required: ["nik", "nama"],
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Gagal mengambil teks dari AI.");
    
    return JSON.parse(jsonStr) as KtpData;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    if (error.message?.includes("API key not valid")) {
      throw new Error("KUNCI_TIDAK_VALID: Kunci API salah. Salin ulang dari Google AI Studio.");
    }
    
    throw new Error(error.message || "Gagal memproses gambar.");
  }
};
