
import { GoogleGenAI, Type } from "@google/genai";
import { KtpData } from "../types";

/**
 * Fungsi deteksi kunci yang lebih kuat
 */
const getApiKey = () => {
  // Cek berbagai kemungkinan lokasi penyimpanan variable di browser
  const key = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  
  if (!key || key === "undefined" || key === "null" || key.trim() === "") {
    return null;
  }
  return key;
};

export const extractKtpData = async (base64Image: string): Promise<KtpData> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("KUNCI_TIDAK_TERDETEKSI: Aplikasi tidak bisa menemukan API_KEY. \n\nCara memperbaiki: \n1. Buka Dashboard Vercel \n2. Ke Settings > Environment Variables \n3. Pastikan namanya tepat: API_KEY \n4. Pastikan nilainya diawali 'AIza...' \n5. WAJIB KLIK REDEPLOY di tab Deployments.");
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
      throw new Error("KUNCI_SALAH: Kunci yang Anda masukkan ke Vercel tidak valid atau ada karakter yang terpotong saat copy-paste.");
    }
    
    throw new Error(error.message || "Gagal memproses gambar.");
  }
};
