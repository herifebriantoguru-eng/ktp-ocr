
import { GoogleGenAI, Type } from "@google/genai";
import { KtpData } from "../types";

export const extractKtpData = async (base64Image: string): Promise<KtpData> => {
  // Initializing the GoogleGenAI client with the API key from environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageData = base64Image.split(',')[1] || base64Image;

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
          text: `Extract data from this Indonesian KTP image for a senior citizen database (MBG). 
          STRICT RULES:
          1. SPLIT "Tempat/Tgl Lahir" into "tempatLahir" (the city name) and "tanggalLahir" (the date in YYYY-MM-DD format).
          2. SPLIT "RT/RW" into "rt" and "rw" (just the 3 numbers, e.g. "003").
          3. For "Alamat", take ONLY the street name or neighborhood block.
          4. "kelDesa" should contain the village/neighborhood.
          5. "kotaKabupaten" is usually prefixed with "KABUPATEN" or "KOTA". Include that prefix.
          6. "jenisKelamin" must be exactly "LAKI-LAKI" or "PEREMPUAN".
          7. Output MUST be valid JSON. No markdown blocks.`,
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

  try {
    // Accessing the response text property directly as per the latest SDK guidelines.
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");
    return JSON.parse(jsonStr) as KtpData;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Sistem gagal mendeteksi teks. Pastikan KTP berada di posisi yang benar dan pencahayaan cukup.");
  }
};
