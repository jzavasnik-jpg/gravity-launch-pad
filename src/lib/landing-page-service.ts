'use client';

import { supabase } from '@/lib/supabase';
import { LandingPageRecord, LandingPageFormData, GeneratedLandingPage, ColorPalette } from '@/types/landing-page';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = 'landing_pages';

export async function saveLandingPage(
  userId: string,
  name: string,
  formData: LandingPageFormData,
  generatedContent: GeneratedLandingPage,
  colorPalette: ColorPalette
): Promise<string> {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from(TABLE_NAME)
      .insert({
        id,
        user_id: userId,
        name,
        form_data: formData,
        generated_content: generatedContent,
        color_palette: colorPalette,
        is_published: false,
        created_at: now,
        updated_at: now
      });

    if (error) {
      console.error('Error saving landing page:', error);
      throw error;
    }

    return id;
  } catch (error) {
    console.error('Error saving landing page:', error);
    throw error;
  }
}

export async function getUserLandingPages(userId: string): Promise<LandingPageRecord[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching landing pages:', error);
      throw error;
    }

    return data as LandingPageRecord[];
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    throw error;
  }
}

export async function getLandingPage(id: string): Promise<LandingPageRecord | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching landing page:', error);
      return null;
    }

    return data as LandingPageRecord;
  } catch (error) {
    console.error('Error fetching landing page:', error);
    return null;
  }
}

export async function updateLandingPage(
  id: string,
  updates: Partial<LandingPageRecord>
): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating landing page:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating landing page:', error);
    throw error;
  }
}

export async function deleteLandingPage(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting landing page:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting landing page:', error);
    throw error;
  }
}

export async function publishLandingPage(id: string): Promise<void> {
  await updateLandingPage(id, { is_published: true });
}

export async function unpublishLandingPage(id: string): Promise<void> {
  await updateLandingPage(id, { is_published: false });
}
