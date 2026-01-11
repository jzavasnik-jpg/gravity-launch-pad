const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// All AI calls go through Supabase Edge Functions (no frontend API keys needed)

export async function generateICPSuggestions(
  questionIndex: number,
  previousAnswers: string[]
): Promise<string[]> {
  try {
    console.log(`[API] Fetching ICP suggestions for question ${questionIndex} via Supabase Edge Function...`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-icp-suggestions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionIndex,
          previousAnswers: previousAnswers || []
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase Edge Function error: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle response format from edge function
    if (Array.isArray(data)) {
      console.log(`[API] Received ${data.length} suggestions from Supabase`);
      return data;
    } else if (data.suggestions && Array.isArray(data.suggestions)) {
      console.log(`[API] Received ${data.suggestions.length} suggestions from Supabase`);
      return data.suggestions;
    }

    throw new Error('Invalid response format from Supabase');
  } catch (error) {
    console.error('[API] Error fetching ICP suggestions:', error);

    // Fallback suggestions
    return [
      "They are looking for a comprehensive solution to their challenges",
      "They have tried multiple approaches without lasting success",
      "They are ready to invest in their growth and transformation",
      "They value proven frameworks over unstructured advice",
      "They need guidance that respects their time and expertise"
    ];
  }
}

// Avatar photo library - matches public/avatars structure
export const AVATAR_PHOTOS = {
  male: {
    young: [
      '/avatars/male/young_black_man1.jpg',
      '/avatars/male/young_black_man2.jpg',
      '/avatars/male/young_black_man3.jpg',
      '/avatars/male/young_black_man4.jpg',
      '/avatars/male/Young_caucasian_man1.jpg',
      '/avatars/male/Young_caucasian_man2.jpg',
      '/avatars/male/Young_caucasian_man3.jpg',
      '/avatars/male/Young_caucasian_man4.jpg',
      '/avatars/male/Young_east _asian_man1.jpg',
      '/avatars/male/Young_east _asian_man2.jpg',
      '/avatars/male/Young_east _asian_man3.jpg',
      '/avatars/male/Young_east _asian_man4.jpg',
      '/avatars/male/Young _latinx_man1.jpg',
      '/avatars/male/Young _latinx_man2.jpg',
      '/avatars/male/Young _latinx_man3.jpg',
      '/avatars/male/Young _latinx_man4.jpg',
      '/avatars/male/Young _middle_eastern_man1.jpg',
      '/avatars/male/Young _middle_eastern_man2.jpg',
      '/avatars/male/Young _middle_eastern_man3.jpg',
      '/avatars/male/Young _middle_eastern_man4.jpg',
      '/avatars/male/Young_south_asian_man1.jpg',
      '/avatars/male/Young_south_asian_man2.jpg',
      '/avatars/male/Young_south_asian_man3.jpg',
      '/avatars/male/Young_south_asian_man4.jpg'
    ],
    middle_aged: [
      '/avatars/male/Middle_aged_black_man1.jpg',
      '/avatars/male/Middle_aged_black_man2.jpg',
      '/avatars/male/Middle_aged_black_man3.jpg',
      '/avatars/male/Middle_aged_black_man4.jpg',
      '/avatars/male/Middle_aged_caucasian_man1.jpg',
      '/avatars/male/Middle_aged_caucasian_man2.jpg',
      '/avatars/male/Middle_aged_caucasian_man3.jpg',
      '/avatars/male/Middle_aged_caucasian_man4.jpg',
      '/avatars/male/Middle_aged_east_asian_man1.jpg',
      '/avatars/male/Middle_aged_east_asian_man2.jpg',
      '/avatars/male/Middle_aged_east_asian_man3.jpg',
      '/avatars/male/Middle_aged_east_asian_man4.jpg',
      '/avatars/male/Middle_aged_latinx_man1.jpg',
      '/avatars/male/Middle_aged_latinx_man2.jpg',
      '/avatars/male/Middle_aged_latinx_man3.jpg',
      '/avatars/male/Middle_aged_latinx_man4.jpg',
      '/avatars/male/Middle_aged_south_asian_man1.jpg',
      '/avatars/male/Middle_aged_south_asian_man2.jpg',
      '/avatars/male/Middle_aged_south_asian_man3.jpg',
      '/avatars/male/Middle_aged_south_asian_man4.jpg',
      '/avatars/male/Middle_aged_southeast_asian_man1.jpg',
      '/avatars/male/Middle_aged_southeast_asian_man2.jpg',
      '/avatars/male/Middle_aged_southeast_asian_man3.jpg',
      '/avatars/male/Middle_aged_southeast_asian_man4.jpg'
    ],
    older: [
      '/avatars/male/Older_black_man1.jpg',
      '/avatars/male/Older_black_man2.jpg',
      '/avatars/male/Older_black_man3.jpg',
      '/avatars/male/Older_black_man4.jpg',
      '/avatars/male/Older_european_man1.jpg',
      '/avatars/male/Older_european_man2.jpg',
      '/avatars/male/Older_european_man3.jpg',
      '/avatars/male/Older_european_man4.jpg',
      '/avatars/male/Older_latinx_man1.jpg',
      '/avatars/male/Older_latinx_man2.jpg',
      '/avatars/male/Older_latinx_man3.jpg',
      '/avatars/male/Older_latinx_man4.jpg',
      '/avatars/male/Older_south_asian_man1.jpg',
      '/avatars/male/Older_south_asian_man2.jpg',
      '/avatars/male/Older_south_asian_man3.jpg',
      '/avatars/male/Older_south_asian_man4.jpg',
      '/avatars/male/Senior_black_man1.jpg',
      '/avatars/male/Senior_black_man2.jpg',
      '/avatars/male/Senior_black_man3.jpg',
      '/avatars/male/Senior_black_man4.jpg',
      '/avatars/male/Senior_european_man1.jpg',
      '/avatars/male/Senior_european_man2.jpg',
      '/avatars/male/Senior_european_man3.jpg',
      '/avatars/male/Senior_european_man4.jpg'
    ]
  },
  female: {
    young: [
      '/avatars/female/Young_black_woman1.jpg',
      '/avatars/female/Young_black_woman2.jpg',
      '/avatars/female/Young_black_woman3.jpg',
      '/avatars/female/Young_black_woman4.jpg',
      '/avatars/female/Young_european_woman1.jpg',
      '/avatars/female/Young_european_woman2.jpg',
      '/avatars/female/Young_european_woman3.jpg',
      '/avatars/female/Young_european_woman4.jpg',
      '/avatars/female/Young_east_asian_woman1.jpg',
      '/avatars/female/Young_east_asian_woman2.jpg',
      '/avatars/female/Young_east_asian_woman3.jpg',
      '/avatars/female/Young_east_asian_woman4.jpg',
      '/avatars/female/Young_latinx_woman1.jpg',
      '/avatars/female/Young_latinx_woman2.jpg',
      '/avatars/female/Young_latinx_woman3.jpg',
      '/avatars/female/Young_latinx_woman4.jpg',
      '/avatars/female/Young_middle_eastern_woman1.jpg',
      '/avatars/female/Young_middle_eastern_woman2.jpg',
      '/avatars/female/Young_middle_eastern_woman3.jpg',
      '/avatars/female/Young_middle_eastern_woman4.jpg',
      '/avatars/female/Young_south_asian_woman1.jpg',
      '/avatars/female/Young_south_asian_woman2.jpg',
      '/avatars/female/Young_south_asian_woman3.jpg',
      '/avatars/female/Young_south_asian_woman4.jpg'
    ],
    middle_aged: [
      '/avatars/female/Middle_aged_black_woman1.jpg',
      '/avatars/female/Middle_aged_black_woman2.jpg',
      '/avatars/female/Middle_aged_black_woman3.jpg',
      '/avatars/female/Middle_aged_black_woman4.jpg',
      '/avatars/female/Middle_aged_european_woman1.jpg',
      '/avatars/female/Middle_aged_european_woman2.jpg',
      '/avatars/female/Middle_aged_european_woman3.jpg',
      '/avatars/female/Middle_aged_european_woman4.jpg',
      '/avatars/female/Middle_aged_east_asian_woman1.jpg',
      '/avatars/female/Middle_aged_east_asian_woman2.jpg',
      '/avatars/female/Middle_aged_east_asian_woman3.jpg',
      '/avatars/female/Middle_aged_east_asian_woman4.jpg',
      '/avatars/female/Middle_aged_latinx_woman1.jpg',
      '/avatars/female/Middle_aged_latinx_woman2.jpg',
      '/avatars/female/Middle_aged_latinx_woman3.jpg',
      '/avatars/female/Middle_aged_latinx_woman4.jpg',
      '/avatars/female/Middle_aged_middle_eastern_woman1.jpg',
      '/avatars/female/Middle_aged_middle_eastern_woman2.jpg',
      '/avatars/female/Middle_aged_middle_eastern_woman3.jpg',
      '/avatars/female/Middle_aged_middle_eastern_woman4.jpg',
      '/avatars/female/Middle_aged_south_asian_woman1.jpg',
      '/avatars/female/Middle_aged_south_asian_woman2.jpg',
      '/avatars/female/Middle_aged_south_asian_woman3.jpg',
      '/avatars/female/Middle_aged_south_asian_woman4.jpg',
      '/avatars/female/Middle_aged_southeast_asian_woman1.jpg',
      '/avatars/female/Middle_aged_southeast_asian_woman2.jpg',
      '/avatars/female/Middle_aged_southeast_asian_woman3.jpg',
      '/avatars/female/Middle_aged_southeast_asian_woman4.jpg'
    ],
    older: [
      '/avatars/female/Older_black_woman1.jpg',
      '/avatars/female/Older_black_woman2.jpg',
      '/avatars/female/Older_black_woman3.jpg',
      '/avatars/female/Older_black_woman4.jpg',
      '/avatars/female/Older_european_woman1.jpg',
      '/avatars/female/Older_european_woman2.jpg',
      '/avatars/female/Older_european_woman3.jpg',
      '/avatars/female/Older_european_woman4.jpg',
      '/avatars/female/Older_latinx_woman1.jpg',
      '/avatars/female/Older_latinx_woman2.jpg',
      '/avatars/female/Older_latinx_woman3.jpg',
      '/avatars/female/Older_latinx_woman4.jpg',
      '/avatars/female/Older_east_asian_woman1.jpg',
      '/avatars/female/Older_east_asian_woman2.jpg',
      '/avatars/female/Older_east_asian_woman3.jpg',
      '/avatars/female/Older_east_asian_woman4.jpg',
      '/avatars/female/Senior_black_woman1.jpg',
      '/avatars/female/Senior_black_woman2.jpg',
      '/avatars/female/Senior_black_woman3.jpg',
      '/avatars/female/Senior_black_woman4.jpg',
      '/avatars/female/Senior_european_woman1.jpg',
      '/avatars/female/Senior_european_woman2.jpg',
      '/avatars/female/Senior_european_woman3.jpg',
      '/avatars/female/Senior_european_woman4.jpg'
    ]
  }
};

export function selectAvatarPhoto(age: number, gender: string, requiredEthnicity?: string): { photoUrl: string; ethnicity: string } {
  const genderKey = gender?.toLowerCase().includes('female') ? 'female' : 'male';
  let ageCategory: 'young' | 'middle_aged' | 'older' = 'middle_aged';

  if (age < 35) ageCategory = 'young';
  else if (age > 55) ageCategory = 'older';

  let photos = AVATAR_PHOTOS[genderKey][ageCategory];
  if (!photos || photos.length === 0) {
    console.log(`No photos available for ${genderKey} age ${age}`);
    return {
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${genderKey}-${age}`,
      ethnicity: 'diverse'
    };
  }

  // Filter by ethnicity if specified
  if (requiredEthnicity) {
    const filteredPhotos = photos.filter(photo => {
      const photoEthnicity = inferEthnicityFromPhoto(photo);
      return photoEthnicity === requiredEthnicity;
    });

    if (filteredPhotos.length > 0) {
      photos = filteredPhotos;
      console.log(`Filtered to ${photos.length} photos matching ethnicity: ${requiredEthnicity}`);
    } else {
      console.warn(`No photos found for ethnicity ${requiredEthnicity}, using all photos`);
    }
  }

  const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
  console.log(`Selected photo: ${randomPhoto} for ${genderKey} age ${age}`);

  // Infer ethnicity from photo filename
  const ethnicity = inferEthnicityFromPhoto(randomPhoto);

  return {
    photoUrl: randomPhoto,
    ethnicity
  };
}

function inferEthnicityFromPhoto(photoPath: string): string {
  const filename = photoPath.toLowerCase();

  // Map filename patterns to ethnicity descriptions
  if (filename.includes('black')) return 'African or African American';
  if (filename.includes('caucasian') || filename.includes('european')) return 'European or Caucasian';
  if (filename.includes('east_asian') || filename.includes('east asian')) return 'East Asian';
  if (filename.includes('south_asian') || filename.includes('south asian')) return 'South Asian';
  if (filename.includes('southeast_asian') || filename.includes('southeast asian')) return 'Southeast Asian';
  if (filename.includes('latinx') || filename.includes('latin')) return 'Hispanic or Latino';
  if (filename.includes('middle_eastern') || filename.includes('middle eastern')) return 'Middle Eastern';

  return 'diverse background';
}

export async function generateAvatar(
  icpAnswers: string[],
  coreDesire: any,
  sixS: any,
  gender?: 'male' | 'female',
  optionalDemographics?: string,
  icpSessionId?: string
) {
  console.log('[API] Generating avatar via Supabase Edge Function...', { gender, icpSessionId });

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-avatar`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          icpAnswers,
          coreDesire,
          sixS,
          gender,
          optionalDemographics,
          icpSessionId
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Supabase Edge Function error:', errorText);
      throw new Error(`Supabase Edge Function error: ${response.statusText}`);
    }

    const avatarData = await response.json();
    console.log(`[API] Generated avatar: ${avatarData.name} (${avatarData.gender})`);

    // Map 'photo' to 'photo_url' for consistency with frontend expectations
    if (avatarData.photo && !avatarData.photo_url) {
      avatarData.photo_url = avatarData.photo;
    }

    // Add core desire and primary Six S for Market Radar integration
    if (coreDesire) {
      avatarData.core_desire = coreDesire.name;
      avatarData.core_desire_description = coreDesire.description;
    }
    if (sixS) {
      avatarData.primary_six_s = sixS.name;
      avatarData.primary_six_s_description = sixS.description;
    }

    return avatarData;
  } catch (error) {
    console.error('[API] generate-avatar exception:', error);
    throw error;
  }
}

export async function generateMarketingStatements(
  icpAnswers: string[],
  coreDesire: any,
  sixS: any,
  avatarData: any,
  avatarId?: string
) {
  console.log('[API] Generating marketing statements via Supabase Edge Function...', { avatarId });

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-marketing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          icpAnswers,
          coreDesire,
          sixS,
          avatarData,
          avatarId
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Supabase Edge Function error:', errorText);
      throw new Error(`Supabase Edge Function error: ${response.statusText}`);
    }

    const statements = await response.json();
    console.log('[API] Generated marketing statements:', statements);

    // Extract product name from icpAnswers[9] and ensure it's in the response
    const productName = icpAnswers[9] || "your product";
    if (!statements.product_name) {
      statements.product_name = productName;
    }

    return statements;
  } catch (error) {
    console.error('[API] generate-marketing exception:', error);
    throw error;
  }
}
