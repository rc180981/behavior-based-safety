import { Injectable, inject } from '@angular/core';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private fb = inject(FirebaseService);

  /**
   * Mengompres berkas gambar di sisi klien sebelum diunggah
   */
  async compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Canvas 2D context not available'));
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Gagal mengompres gambar'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  /**
   * Mengunggah foto bukti ke Firebase Cloud Storage
   */
  async uploadFindingPhoto(
    projectId: string,
    findingTempId: string,
    file: File
  ): Promise<string> {
    const compressedBlob = await this.compressImage(file);
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `evidence/${projectId}/${findingTempId}/${timestamp}_${cleanFileName}`;

    const storageRef = ref(this.fb.storage, storagePath);
    await uploadBytes(storageRef, compressedBlob, {
      contentType: 'image/jpeg',
    });

    return await getDownloadURL(storageRef);
  }
}
