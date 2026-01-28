
import { GoogleGenAI, Type } from "@google/genai";
import { KtpData } from "../types";

export const extractKtpData = async (base64Image: string): Promise<KtpData> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    throw new Error("KUNCI_TIDAK_ADA: API_KEY belum terdeteksi di Vercel. Silakan tambahkan di Settings > Env Variables, lalu klik REDEPLOY.");
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
            text: `Ekstrak data KTP Indonesia ini ke JSON. Gunakan HURUF KAPITAL. nik 16 digit.`,
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
    console.error("Gemini Error Detail:", error);
    
    // Menangkap error spesifik terkait API Key
    const msg = error.message || "";
    if (msg.includes("403") || msg.includes("401") || msg.includes("API key")) {
      throw new Error("KUNCI_SALAH: API Key Anda tidak valid, kadaluarsa, atau ditolak oleh Google. Pastikan Anda menyalin kunci dengan benar dari Google AI Studio.");
    }
    
    if (msg.includes("429")) {
      throw new Error("LIMIT_AI: Kuota AI gratis Anda habis untuk saat ini. Tunggu beberapa menit lalu coba lagi.");
    }

    throw new Error(msg || "Gagal memproses gambar. Pastikan foto KTP jelas dan tidak buram.");
  }
};
