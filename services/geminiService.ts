
import { GoogleGenAI, Type } from "@google/genai";
import { KtpData } from "../types";

export const extractKtpData = async (base64Image: string): Promise<KtpData> => {
  /**
   * PENTING UNTUK VERCEL:
   * Nilai process.env.API_KEY akan diisi otomatis oleh Vercel saat proses Build.
   * Jika error "API_KEY belum terdeteksi" muncul, berarti Anda belum klik 'Redeploy' 
   * di dashboard Vercel setelah memasukkan Environment Variable.
   */
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY belum terdeteksi di aplikasi. Silakan masuk ke Dashboard Vercel > Deployments > Klik titik tiga (...) > Redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Menghapus header base64 jika ada
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
            text: `Ekstrak data dari KTP ini ke JSON. 
            Aturan: 
            - nik: 16 digit angka.
            - tempatLahir: Nama kota saja.
            - tanggalLahir: Format YYYY-MM-DD.
            - rt/rw: angka saja (misal 001).
            - Huruf kapital semua untuk teks.
            - Jika tidak terbaca, beri string kosong "".`,
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
    if (!jsonStr) throw new Error("AI tidak memberikan respon teks.");
    
    return JSON.parse(jsonStr) as KtpData;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("403") || error.message?.includes("API key")) {
      throw new Error("Kunci API (API_KEY) tidak valid atau ditolak oleh Google. Cek kembali di Google AI Studio.");
    }
    throw new Error(error.message || "Gagal memproses KTP. Pastikan gambar jelas dan tidak terpotong.");
  }
};
