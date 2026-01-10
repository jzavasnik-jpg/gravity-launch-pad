import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { LandingPageRecord, LandingPageFormData, GeneratedLandingPage, ColorPalette } from '@/types/landing-page';

const COLLECTION_NAME = 'landing_pages';

export async function saveLandingPage(
    userId: string,
    name: string,
    formData: LandingPageFormData,
    generatedContent: GeneratedLandingPage,
    colorPalette: ColorPalette
): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            user_id: userId,
            name,
            form_data: formData,
            generated_content: generatedContent,
            color_palette: colorPalette,
            is_published: false,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving landing page:', error);
        throw error;
    }
}

export async function getUserLandingPages(userId: string): Promise<LandingPageRecord[]> {
    try {
        const q = query(collection(db, COLLECTION_NAME), where('user_id', '==', userId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LandingPageRecord));
    } catch (error) {
        console.error('Error fetching landing pages:', error);
        throw error;
    }
}

export async function updateLandingPage(
    id: string,
    updates: Partial<LandingPageRecord>
): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updated_at: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating landing page:', error);
        throw error;
    }
}

export async function deleteLandingPage(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error('Error deleting landing page:', error);
        throw error;
    }
}
