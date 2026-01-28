import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local BEFORE importing prisma
config({ path: resolve(process.cwd(), '.env.local') });

// Stock photos by category from Unsplash
const stockPhotos: Record<string, string[]> = {
  HOSPITAL: [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&q=80',
    'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&q=80',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80',
    'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&q=80',
  ],
  SCHOOL: [
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&q=80',
  ],
  WATER: [
    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80',
    'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?w=1200&q=80',
    'https://images.unsplash.com/photo-1562016600-ece13e8ba570?w=1200&q=80',
    'https://images.unsplash.com/photo-1532188978303-4bfaccc429d2?w=1200&q=80',
    'https://images.unsplash.com/photo-1519455953755-af066f52f1a6?w=1200&q=80',
  ],
  ENERGY: [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80',
    'https://images.unsplash.com/photo-1548337138-e87d889cc369?w=1200&q=80',
    'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=1200&q=80',
  ],
  OTHER: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
    'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?w=1200&q=80',
  ],
};

async function addStockPhotosToAll() {
  // Dynamic import to ensure env vars are loaded first
  const { prisma } = await import('../lib/prisma');

  // Find all projects that don't have any photos
  const projectsWithoutPhotos = await prisma.project.findMany({
    where: {
      photos: {
        none: {},
      },
    },
    select: {
      id: true,
      facilityName: true,
      category: true,
    },
  });

  console.log(`Found ${projectsWithoutPhotos.length} projects without photos\n`);

  let addedCount = 0;
  let photoIndex: Record<string, number> = {
    HOSPITAL: 0,
    SCHOOL: 0,
    WATER: 0,
    ENERGY: 0,
    OTHER: 0,
  };

  for (const project of projectsWithoutPhotos) {
    const category = project.category;
    const photos = stockPhotos[category] || stockPhotos.OTHER;

    // Get 2-4 random photos for this project, cycling through available photos
    const numPhotos = 2 + Math.floor(Math.random() * 3); // 2-4 photos
    const projectPhotos: string[] = [];

    for (let i = 0; i < numPhotos; i++) {
      const idx = (photoIndex[category] + i) % photos.length;
      projectPhotos.push(photos[idx]);
    }

    // Update the index for next project of same category
    photoIndex[category] = (photoIndex[category] + numPhotos) % photos.length;

    // Add photos to project
    for (let i = 0; i < projectPhotos.length; i++) {
      await prisma.projectImage.create({
        data: {
          projectId: project.id,
          url: projectPhotos[i],
          sortOrder: i,
        },
      });
    }

    console.log(
      `✅ Added ${projectPhotos.length} photos to ${category} project: ${project.facilityName} (ID: ${project.id})`
    );
    addedCount++;
  }

  console.log(`\n📸 Added photos to ${addedCount} projects!`);

  await prisma.$disconnect();
}

addStockPhotosToAll()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
