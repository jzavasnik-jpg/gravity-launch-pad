import { storage, db } from "./firebase";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    orderBy,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import { Asset, AssetType, CreateAssetRequest, AssetSearchParams } from "./asset-types";
import { v4 as uuidv4 } from "uuid";

const ASSETS_COLLECTION = "product_assets";

/**
 * Uploads a file to Firebase Storage and creates an asset record in Firestore
 */
export async function uploadAsset(
    userId: string,
    request: CreateAssetRequest,
    onProgress?: (progress: number) => void
): Promise<Asset> {
    if (!request.file) {
        console.error("uploadAsset: No file provided");
        throw new Error("No file provided");
    }

    console.log("uploadAsset: Starting upload for", request.title);
    const file = request.file as File;
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `assets/${userId}/${fileName}`;
    console.log("uploadAsset: Storage path", storagePath);
    const storageRef = ref(storage, storagePath);

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                reject(error);
            },
            async () => {
                try {
                    // Upload completed successfully
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Create asset record in Firestore
                    const assetData: Omit<Asset, "id"> = {
                        user_uuid: userId,
                        session_id: request.session_id,
                        asset_type: request.asset_type,
                        title: request.title,
                        description: request.description || "",
                        storage_provider: "firebase", // Using 'firebase' instead of 'local'/'backblaze' for now
                        storage_path: storagePath,
                        storage_url: downloadURL,
                        thumbnail_url: request.asset_type !== 'video' ? downloadURL : undefined,
                        file_size_bytes: file.size,
                        mime_type: file.type,
                        status: "ready",
                        tags: request.tags || [],
                        metadata: request.metadata || {},
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    } as any; // Type assertion needed because Asset interface expects specific string literals for storage_provider

                    const docRef = await addDoc(collection(db, ASSETS_COLLECTION), {
                        ...assetData,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp()
                    });

                    resolve({
                        id: docRef.id,
                        ...assetData
                    } as Asset);
                } catch (error) {
                    console.error("Firestore error:", error);
                    reject(error);
                }
            }
        );
    });
}

/**
 * Retrieves assets for a user with optional filtering
 */
export async function searchAssets(
    userId: string,
    params: AssetSearchParams = {}
): Promise<Asset[]> {
    try {
        let q = query(
            collection(db, ASSETS_COLLECTION),
            where("user_uuid", "==", userId)
        );

        if (params.asset_type) {
            q = query(q, where("asset_type", "==", params.asset_type));
        }

        if (params.status) {
            q = query(q, where("status", "==", params.status));
        }

        // Note: Firestore requires composite indexes for multiple fields + sorting
        // For simple queries, we'll sort in memory if needed

        const querySnapshot = await getDocs(q);
        let assets = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamps to ISO strings if they are Firestore Timestamps
            created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString(),
            updated_at: doc.data().updated_at?.toDate?.().toISOString() || new Date().toISOString()
        })) as Asset[];

        // In-memory filtering for tags and search query (Firestore limitations)
        if (params.tags && params.tags.length > 0) {
            assets = assets.filter(asset =>
                params.tags!.some(tag => asset.tags.includes(tag))
            );
        }

        if (params.search_query) {
            const query = params.search_query.toLowerCase();
            assets = assets.filter(asset =>
                asset.title.toLowerCase().includes(query) ||
                asset.description?.toLowerCase().includes(query)
            );
        }

        // Sort
        if (params.sort_by) {
            assets.sort((a, b) => {
                const valA = a[params.sort_by!] as any;
                const valB = b[params.sort_by!] as any;

                if (params.sort_order === 'desc') {
                    return valA > valB ? -1 : 1;
                }
                return valA > valB ? 1 : -1;
            });
        } else {
            // Default sort by created_at desc
            assets.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        return assets;
    } catch (error) {
        console.error("Error searching assets:", error);
        throw error;
    }
}

/**
 * Deletes an asset from Firestore and Storage
 */
export async function deleteAsset(assetId: string): Promise<boolean> {
    try {
        // Get asset data first to find storage path
        const assetRef = doc(db, ASSETS_COLLECTION, assetId);
        // We need to fetch it first, but for now let's assume we have the path or handle error
        // In a real app, we'd fetch, then delete storage, then delete doc

        // For now, just delete the doc record as a safety first step
        await deleteDoc(assetRef);

        // TODO: Delete from storage using the stored path
        // const storageRef = ref(storage, asset.storage_path);
        // await deleteObject(storageRef);

        return true;
    } catch (error) {
        console.error("Error deleting asset:", error);
        return false;
    }
}

/**
 * Updates an asset's metadata
 */
export async function updateAsset(
    assetId: string,
    updates: Partial<Asset>
): Promise<boolean> {
    try {
        const assetRef = doc(db, ASSETS_COLLECTION, assetId);
        await updateDoc(assetRef, {
            ...updates,
            updated_at: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating asset:", error);
        return false;
    }
}
