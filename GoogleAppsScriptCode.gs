
/**
 * PANDUAN DEPLOY:
 * 1. ID SPREADSHEET: 1cbFUwktz2rV1L6X7x-iLXpTeIhIPhhaCCCr-R1HwawI
 * 2. ID FOLDER FOTO: 1NsfPsXjc5ErtlzfLHAf7qHXJ4Aq5iVWc
 * 3. Deploy sebagai 'Web App' -> 'Anyone' can access.
 */

const ID_SHEET = '1cbFUwktz2rV1L6X7x-iLXpTeIhIPhhaCCCr-R1HwawI';
const NAMA_SHEET = 'Sheet1';
const ID_FOLDER_FOTO = '1NsfPsXjc5ErtlzfLHAf7qHXJ4Aq5iVWc';

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(ID_SHEET);
    const sheet = ss.getSheetByName(NAMA_SHEET) || ss.getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    
    if (rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'success', 
        data: [] 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Ambil data dari baris ke-2 sampai akhir, urutkan dari yang terbaru (reverse)
    const dataRows = rows.slice(1).reverse().slice(0, 200);
    
    const data = dataRows.map(row => ({
      waktuInput: row[0],
      nik: row[1]?.toString().replace(/'/g, ""), 
      nama: row[2],
      tempatLahir: row[3],
      tanggalLahir: row[4] instanceof Date ? row[4].toISOString().split('T')[0] : row[4],
      jenisKelamin: row[5],
      alamat: row[6],
      rt: row[7]?.toString().replace(/'/g, ""),
      rw: row[8]?.toString().replace(/'/g, ""),
      kelDesa: row[9],
      kecamatan: row[10],
      kotaKabupaten: row[11],
      agama: row[12],
      statusPerkawinan: row[13],
      pekerjaan: row[14],
      kewarganegaraan: row[15],
      berlakuHingga: row[16],
      linkFoto: row[17],
      latitude: row[18],
      longitude: row[19]
    }));

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      data: data 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(ID_SHEET);
    const sheet = ss.getSheetByName(NAMA_SHEET) || ss.getSheets()[0];
    
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const nikColumnValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
      const incomingNik = data.nik?.toString().trim();
      const isDuplicate = nikColumnValues.some(val => val.toString().replace(/'/g, "").trim() === incomingNik);
      
      if (isDuplicate) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: 'error', 
          message: 'NIK sudah terdaftar sebelumnya' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (sheet.getLastRow() === 0) {
      const headers = [
        'Waktu Input', 'NIK', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 
        'Alamat', 'RT', 'RW', 'Kel/Desa', 'Kecamatan', 'Kota/Kabupaten', 'Agama', 
        'Status Perkawinan', 'Pekerjaan', 'Kewarganegaraan', 'Berlaku Hingga', 'Link Foto KTP',
        'Latitude', 'Longitude', 'Link Maps'
      ];
      sheet.appendRow(headers);
    }

    let fotoUrl = "Tidak Ada";
    if (data.image && ID_FOLDER_FOTO && data.image.length > 100) {
      try {
        const folder = DriveApp.getFolderById(ID_FOLDER_FOTO);
        const fileName = "KTP_" + (data.nik || "TMP") + "_" + new Date().getTime() + ".jpg";
        const base64Data = data.image.split(',')[1] || data.image;
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/jpeg", fileName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fotoUrl = file.getUrl();
      } catch (fError) {
        fotoUrl = "Gagal simpan foto";
      }
    }

    const mapsUrl = (data.latitude && data.longitude) 
      ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` 
      : "";

    sheet.appendRow([
      new Date(),
      "'" + (data.nik || ""),
      data.nama || "",
      data.tempatLahir || "",
      data.tanggalLahir || "",
      data.jenisKelamin || "",
      data.alamat || "",
      "'" + (data.rt || ""),
      "'" + (data.rw || ""),
      data.kelDesa || "",
      data.kecamatan || "",
      data.kotaKabupaten || "",
      data.agama || "",
      data.statusPerkawinan || "",
      data.pekerjaan || "",
      data.kewarganegaraan || "",
      data.berlakuHingga || "",
      fotoUrl,
      data.latitude || "",
      data.longitude || "",
      mapsUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
