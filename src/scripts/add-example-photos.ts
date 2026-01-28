import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local BEFORE importing prisma
config({ path: resolve(process.cwd(), '.env.local') });

async function addExamplePhotos() {
  // Dynamic import to ensure env vars are loaded first
  const { prisma } = await import('../lib/prisma');

  // Find a hospital project and add 5 photos
  const hospitalProject = await prisma.project.findFirst({
    where: { category: 'HOSPITAL' }
  });

  if (hospitalProject) {
    // Delete existing photos first (if any)
    await prisma.projectImage.deleteMany({
      where: { projectId: hospitalProject.id }
    });

    // Add 5 hospital photos
    const hospitalPhotos = [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
      'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&q=80',
      'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80'
    ];

    for (let i = 0; i < hospitalPhotos.length; i++) {
      await prisma.projectImage.create({
        data: {
          projectId: hospitalProject.id,
          url: hospitalPhotos[i],
          sortOrder: i
        }
      });
    }

    console.log(`✅ Added 5 photos to hospital project: ${hospitalProject.facilityName} (ID: ${hospitalProject.id})`);
  } else {
    console.log('❌ No hospital project found');
  }

  // Find a school project and add 2 photos
  const schoolProject = await prisma.project.findFirst({
    where: { category: 'SCHOOL' }
  });

  if (schoolProject) {
    // Delete existing photos first (if any)
    await prisma.projectImage.deleteMany({
      where: { projectId: schoolProject.id }
    });

    // Add 2 school photos
    const schoolPhotos = [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80'
    ];

    for (let i = 0; i < schoolPhotos.length; i++) {
      await prisma.projectImage.create({
        data: {
          projectId: schoolProject.id,
          url: schoolPhotos[i],
          sortOrder: i
        }
      });
    }

    console.log(`✅ Added 2 photos to school project: ${schoolProject.facilityName} (ID: ${schoolProject.id})`);
  } else {
    console.log('❌ No school project found');
  }

  console.log('\n📸 Photo addition complete!');
  console.log('Check the homepage and project detail pages to see the photos.');

  await prisma.$disconnect();
}

addExamplePhotos()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
