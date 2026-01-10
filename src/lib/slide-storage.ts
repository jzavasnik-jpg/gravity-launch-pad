import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Converts base64 string to Blob
 */
function base64ToBlob(base64: string, contentType: string = 'image/png'): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

/**
 * Saves a generated slide image to Firebase Storage
 * Returns the public download URL
 */
export async function saveSlideImage(
    base64Image: string,
    sceneNumber: number,
    presentationId: string
): Promise<string> {
    // Convert base64 to blob
    const blob = base64ToBlob(base64Image);

    // Create storage path
    const storagePath = `presentations/${presentationId}/slide_${sceneNumber.toString().padStart(2, '0')}.png`;
    const storageRef = ref(storage, storagePath);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);

    // Get and return download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

/**
 * Saves a generic generated asset to Firebase Storage
 * Returns the public download URL
 */
export async function saveGeneratedAsset(
    base64Image: string,
    prefix: string = 'generated'
): Promise<string> {
    const blob = base64ToBlob(base64Image);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const storagePath = `assets/${prefix}_${timestamp}_${randomId}.png`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
}

/**
 * Generated slide data
 */
export interface GeneratedSlide {
    sceneNumber: number;
    imageUrl: string;
    scriptText: string;
    visualDescription: string;
}
