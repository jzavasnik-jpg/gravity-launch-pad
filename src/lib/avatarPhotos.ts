// Avatar photo library mapping
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
      '/avatars/male/Young_east_asian_man1.jpg',
      '/avatars/male/Young_east_asian_man2.jpg',
      '/avatars/male/Young_south_asian_man1.jpg',
      '/avatars/male/Young_south_asian_man2.jpg',
      '/avatars/male/Young_latinx_man1.jpg',
      '/avatars/male/Young_latinx_man2.jpg',
      '/avatars/male/Young_middle_eastern_man1.jpg',
      '/avatars/male/Young_middle_eastern_man2.jpg'
    ],
    middle_aged: [
      '/avatars/male/Middle_aged_black_man1.jpg',
      '/avatars/male/Middle_aged_black_man2.jpg',
      '/avatars/male/Middle_aged_caucasian_man1.jpg',
      '/avatars/male/Middle_aged_caucasian_man2.jpg',
      '/avatars/male/Middle_aged_east_asian_man1.jpg',
      '/avatars/male/Middle_aged_east_asian_man2.jpg',
      '/avatars/male/Middle_aged_latinx_man1.jpg',
      '/avatars/male/Middle_aged_latinx_man2.jpg',
      '/avatars/male/Middle_aged_south_asian_man1.jpg',
      '/avatars/male/Middle_aged_south_asian_man2.jpg',
      '/avatars/male/Middle_aged_southeast_asian_man1.jpg',
      '/avatars/male/Middle_aged_southeast_asian_man2.jpg'
    ],
    older: [
      '/avatars/male/Older_black_man1.jpg',
      '/avatars/male/Older_black_man2.jpg',
      '/avatars/male/Older_european_man1.jpg',
      '/avatars/male/Older_european_man2.jpg',
      '/avatars/male/Older_latinx_man1.jpg',
      '/avatars/male/Older_south_asian_man1.jpg',
      '/avatars/male/Senior_black_man1.jpg',
      '/avatars/male/Senior_black_man2.jpg',
      '/avatars/male/Senior_european_man1.jpg',
      '/avatars/male/Senior_european_man2.jpg'
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
      '/avatars/female/Young_east_asian_woman1.jpg',
      '/avatars/female/Young_east_asian_woman2.jpg',
      '/avatars/female/Young_latinx_woman1.jpg',
      '/avatars/female/Young_latinx_woman2.jpg',
      '/avatars/female/Young_middle_eastern_woman1.jpg',
      '/avatars/female/Young_middle_eastern_woman2.jpg',
      '/avatars/female/Young_south_asian_woman1.jpg',
      '/avatars/female/Young_south_asian_woman2.jpg'
    ],
    middle_aged: [
      '/avatars/female/Middle_aged_black_woman1.jpg',
      '/avatars/female/Middle_aged_black_woman2.jpg',
      '/avatars/female/Middle_aged_european_woman1.jpg',
      '/avatars/female/Middle_aged_european_woman2.jpg',
      '/avatars/female/Middle_aged_east_asian_woman1.jpg',
      '/avatars/female/Middle_aged_east_asian_woman2.jpg',
      '/avatars/female/Middle_aged_latinx_woman1.jpg',
      '/avatars/female/Middle_aged_latinx_woman2.jpg',
      '/avatars/female/Middle_aged_middle_eastern_woman1.jpg',
      '/avatars/female/Middle_aged_middle_eastern_woman2.jpg',
      '/avatars/female/Middle_aged_south_asian_woman1.jpg',
      '/avatars/female/Middle_aged_south_asian_woman2.jpg',
      '/avatars/female/Middle_aged_southeast_asian_woman1.jpg',
      '/avatars/female/Middle_aged_southeast_asian_woman2.jpg'
    ],
    older: [
      '/avatars/female/Older_black_woman1.jpg',
      '/avatars/female/Older_black_woman2.jpg',
      '/avatars/female/Older_european_woman1.jpg',
      '/avatars/female/Older_european_woman2.jpg',
      '/avatars/female/Older_east_asian_woman1.jpg',
      '/avatars/female/Older_east_asian_woman2.jpg',
      '/avatars/female/Older_latinx_woman1.jpg',
      '/avatars/female/Older_latinx_woman2.jpg',
      '/avatars/female/Senior_black_woman1.jpg',
      '/avatars/female/Senior_black_woman2.jpg',
      '/avatars/female/Senior_european_woman1.jpg',
      '/avatars/female/Senior_european_woman2.jpg'
    ]
  }
};

export function selectAvatarPhoto(age: number, gender: string): string {
  console.log(`Selecting avatar photo for: age=${age}, gender=${gender}`);
  
  // Normalize gender
  const genderKey = gender?.toLowerCase().includes('female') ? 'female' : 'male';
  
  // Determine age category
  let ageCategory: 'young' | 'middle_aged' | 'older' = 'middle_aged';
  if (age < 35) {
    ageCategory = 'young';
  } else if (age > 55) {
    ageCategory = 'older';
  }
  
  console.log(`Photo category: ${genderKey}/${ageCategory}`);
  
  // Get photo array for this category
  const photos = AVATAR_PHOTOS[genderKey][ageCategory];
  
  if (!photos || photos.length === 0) {
    // Fallback to DiceBear for edge cases (very young/old, or missing photos)
    const style = 'avataaars';
    const seed = `${genderKey}-${age}-${Math.random().toString(36).substring(7)}`;
    console.warn(`No photos found for ${genderKey}/${ageCategory}, using DiceBear fallback`);
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  }
  
  // Select random photo from category
  const randomIndex = Math.floor(Math.random() * photos.length);
  const selectedPhoto = photos[randomIndex];
  
  console.log(`Selected avatar photo: ${selectedPhoto}`);
  
  return selectedPhoto;
}
