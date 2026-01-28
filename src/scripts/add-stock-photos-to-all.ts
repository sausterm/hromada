import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local BEFORE importing prisma
config({ path: resolve(process.cwd(), '.env.local') });

// Stock photos by category from Unsplash - curated for Ukrainian infrastructure
const stockPhotos: Record<string, string[]> = {
  HOSPITAL: [
    // Hospital buildings and medical facilities
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&q=80', // Hospital building exterior
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80', // Hospital corridor
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80', // Hospital room
    'https://images.unsplash.com/photo-1581595220892-4ef7c392de07?w=1200&q=80', // Medical equipment
    'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=1200&q=80', // Hospital ward
    'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&q=80', // Medical facility
    'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=1200&q=80', // Hospital exterior
  ],
  SCHOOL: [
    // Schools and educational facilities
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80', // Empty classroom
    'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80', // School building
    'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1200&q=80', // Classroom desks
    'https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&q=80', // School hallway
    'https://images.unsplash.com/photo-1613896527026-f195d5c818ed?w=1200&q=80', // Classroom interior
    'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=1200&q=80', // School exterior
  ],
  WATER: [
    // Water infrastructure and treatment
    'https://images.unsplash.com/photo-1597931752949-98c74b5b159f?w=1200&q=80', // Water treatment facility
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=1200&q=80', // Water pipes infrastructure
    'https://images.unsplash.com/photo-1585918749741-68e0d55e2ad1?w=1200&q=80', // Water pumping station
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&q=80', // Industrial water system
    'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?w=1200&q=80', // Water treatment tanks
    'https://images.unsplash.com/photo-1606937295547-bc0f668595b3?w=1200&q=80', // Water facility
  ],
  ENERGY: [
    // Solar, electrical, and energy infrastructure
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80', // Solar panels on roof
    'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=1200&q=80', // Solar panel installation
    'https://images.unsplash.com/photo-1595437193398-f24279553f4f?w=1200&q=80', // Solar farm
    'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=1200&q=80', // Electrical infrastructure
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80', // Power lines
    'https://images.unsplash.com/photo-1591964006776-90d33e597179?w=1200&q=80', // Generator/power equipment
  ],
  OTHER: [
    // Community buildings, admin centers, cultural facilities
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&q=80', // Government building
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80', // Community center interior
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80', // Modern office building
    'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=1200&q=80', // Sports facility
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1200&q=80', // Administrative building
    'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=1200&q=80', // Cultural center
  ],
};

async function addStockPhotosToAll() {
  // Dynamic import to ensure env vars are loaded first
  const { prisma } = await import('../lib/prisma');

  // Find all projects
  const allProjects = await prisma.project.findMany({
    select: {
      id: true,
      facilityName: true,
      category: true,
    },
  });

  console.log(`Found ${allProjects.length} projects to update\n`);

  // Delete all existing photos first
  await prisma.projectImage.deleteMany({});
  console.log('Cleared existing photos\n');

  let addedCount = 0;
  let photoIndex: Record<string, number> = {
    HOSPITAL: 0,
    SCHOOL: 0,
    WATER: 0,
    ENERGY: 0,
    OTHER: 0,
  };

  for (const project of allProjects) {
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
