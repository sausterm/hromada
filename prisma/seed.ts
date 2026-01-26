import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Realistic Ukrainian infrastructure projects
const projects = [
  // HOSPITALS
  {
    municipalityName: 'Kharkiv City',
    facilityName: 'Kharkiv Regional Clinical Hospital',
    category: 'HOSPITAL' as const,
    description: `Critical need for medical equipment after damage from missile strikes.

Required items:
• 10 patient monitoring systems
• 5 portable ventilators
• Surgical instrument sets (orthopedic, general)
• Emergency backup generators (2x 100kW)
• Medical consumables and medications

The hospital serves approximately 1.5 million residents in the Kharkiv region and is the primary trauma center for the area.`,
    address: 'Kharkiv, Kharkiv Oblast, Ukraine',
    latitude: 49.9935,
    longitude: 36.2304,
    contactName: 'Dr. Olena Kovalenko',
    contactEmail: 'hospital@kharkiv.ua',
    contactPhone: '+380577001234',
    urgency: 'CRITICAL' as const,
    status: 'OPEN' as const,
    photos: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    ],
  },
  {
    municipalityName: 'Mykolaiv City',
    facilityName: 'Mykolaiv City Hospital #3',
    category: 'HOSPITAL' as const,
    description: `Pediatric ward needs renovation and equipment after infrastructure damage.

Needs:
• Pediatric ventilators (3 units)
• Incubators for neonatal care (5 units)
• Child-sized hospital beds (20 units)
• Diagnostic ultrasound machine
• Renovation of damaged wing

This hospital serves the pediatric needs of over 200,000 children in the Mykolaiv region.`,
    address: 'Mykolaiv, Mykolaiv Oblast, Ukraine',
    latitude: 46.9659,
    longitude: 31.9974,
    contactName: 'Dr. Ihor Petrenko',
    contactEmail: 'hospital3@mykolaiv.ua',
    urgency: 'HIGH' as const,
    status: 'OPEN' as const,
    photos: [],
  },

  // SCHOOLS
  {
    municipalityName: 'Bucha City',
    facilityName: 'Bucha Gymnasium #3',
    category: 'SCHOOL' as const,
    description: `School rebuilding after occupation. Need to restore learning environment for 650 students.

Required:
• 50 student laptops/tablets
• Interactive whiteboards (15 classrooms)
• Desks and chairs (200 sets)
• Library books (Ukrainian language)
• Art and music supplies
• Heating system repairs

The school was damaged during occupation and students are eager to return to normal education.`,
    address: 'Bucha, Kyiv Oblast, Ukraine',
    latitude: 50.5414,
    longitude: 30.2131,
    contactName: 'Natalia Shevchenko',
    contactEmail: 'gymnasium3@bucha.ua',
    contactPhone: '+380442345678',
    urgency: 'HIGH' as const,
    status: 'OPEN' as const,
    photos: [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800',
    ],
  },
  {
    municipalityName: 'Irpin City',
    facilityName: 'Irpin Secondary School #2',
    category: 'SCHOOL' as const,
    description: `Underground shelter classroom conversion project. Creating safe learning spaces for 400 students.

Needs:
• Air filtration systems
• Emergency lighting
• Furniture for basement classrooms
• Educational materials
• First aid supplies

With ongoing air raid alerts, the school needs proper underground facilities for continued education.`,
    address: 'Irpin, Kyiv Oblast, Ukraine',
    latitude: 50.5218,
    longitude: 30.2507,
    contactName: 'Viktor Kravchuk',
    contactEmail: 'school2@irpin.ua',
    urgency: 'MEDIUM' as const,
    status: 'IN_DISCUSSION' as const,
    photos: [],
  },

  // WATER
  {
    municipalityName: 'Odesa City',
    facilityName: 'Odesa Municipal Water Treatment Plant',
    category: 'WATER' as const,
    description: `Critical water infrastructure serving 1 million residents needs urgent repairs.

Required equipment:
• Water filtration membranes
• Chemical dosing pumps (chlorination)
• Backup generators (3x 200kW)
• SCADA system upgrades
• Pipe repair materials

Recent attacks have damaged the plant's capacity. Clean water supply is essential for the city.`,
    address: 'Odesa, Odesa Oblast, Ukraine',
    latitude: 46.4825,
    longitude: 30.7233,
    contactName: 'Serhiy Bondarenko',
    contactEmail: 'vodokanal@odesa.ua',
    contactPhone: '+380487654321',
    urgency: 'CRITICAL' as const,
    status: 'OPEN' as const,
    photos: [
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    ],
  },
  {
    municipalityName: 'Kramatorsk City',
    facilityName: 'Kramatorsk Water Pumping Station',
    category: 'WATER' as const,
    description: `Pumping station serving 150,000 residents needs rehabilitation.

Needs:
• Industrial water pumps (4 units)
• Electrical switchgear
• Emergency power supply
• Water quality testing equipment

The station is critical for water supply to the city and surrounding villages.`,
    address: 'Kramatorsk, Donetsk Oblast, Ukraine',
    latitude: 48.7305,
    longitude: 37.5556,
    contactName: 'Oleksandr Lysenko',
    contactEmail: 'water@kramatorsk.ua',
    urgency: 'HIGH' as const,
    status: 'OPEN' as const,
    photos: [],
  },

  // ENERGY
  {
    municipalityName: 'Lviv City',
    facilityName: 'Lviv District Heating Plant #2',
    category: 'ENERGY' as const,
    description: `Heating plant serving 50,000 apartments needs winterization upgrades.

Required:
• Industrial boilers (2 units)
• Heat exchangers
• Circulation pumps
• Pipe insulation materials
• Control systems

With displaced persons increasing the population, heating capacity must be expanded before winter.`,
    address: 'Lviv, Lviv Oblast, Ukraine',
    latitude: 49.8397,
    longitude: 24.0297,
    contactName: 'Andriy Melnyk',
    contactEmail: 'lvivteplo@lviv.ua',
    contactPhone: '+380322345678',
    urgency: 'HIGH' as const,
    status: 'OPEN' as const,
    photos: [
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
    ],
  },
  {
    municipalityName: 'Zaporizhzhia City',
    facilityName: 'Zaporizhzhia Power Substation East',
    category: 'ENERGY' as const,
    description: `Electrical substation needs transformer replacement after attack damage.

Needs:
• Power transformers (110kV/10kV)
• Circuit breakers
• Protective relay systems
• Cables and connectors

Currently 15,000 households have unstable power supply. Repairs would restore reliable electricity.`,
    address: 'Zaporizhzhia, Zaporizhzhia Oblast, Ukraine',
    latitude: 47.8388,
    longitude: 35.1396,
    contactName: 'Dmytro Savchenko',
    contactEmail: 'energy@zaporizhzhia.ua',
    urgency: 'CRITICAL' as const,
    status: 'IN_DISCUSSION' as const,
    photos: [],
  },

  // OTHER
  {
    municipalityName: 'Dnipro City',
    facilityName: 'Dnipro Community Shelter Center',
    category: 'OTHER' as const,
    description: `Community center converted to shelter for displaced families needs improvements.

Requirements:
• Bunk beds (100 units)
• Kitchen equipment (industrial)
• Shower facilities renovation
• Heating system upgrade
• Children's play area equipment

Currently housing 200+ displaced persons, the center needs better facilities for long-term stays.`,
    address: 'Dnipro, Dnipropetrovsk Oblast, Ukraine',
    latitude: 48.4647,
    longitude: 35.0462,
    contactName: 'Maria Tkachenko',
    contactEmail: 'shelter@dnipro.ua',
    contactPhone: '+380567890123',
    urgency: 'MEDIUM' as const,
    status: 'OPEN' as const,
    photos: [],
  },
  {
    municipalityName: 'Chernihiv City',
    facilityName: 'Chernihiv Central Bus Station',
    category: 'OTHER' as const,
    description: `Main transportation hub needs reconstruction for evacuation routes.

Needs:
• Roof repairs
• Heating system
• Accessible facilities (ramps, elevators)
• Information display systems
• Backup power

The station is critical for civilian evacuation and humanitarian aid distribution.`,
    address: 'Chernihiv, Chernihiv Oblast, Ukraine',
    latitude: 51.4982,
    longitude: 31.2893,
    contactName: 'Pavlo Ivanchenko',
    contactEmail: 'transport@chernihiv.ua',
    urgency: 'LOW' as const,
    status: 'OPEN' as const,
    photos: [],
  },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.inquiry.deleteMany()
  await prisma.project.deleteMany()

  // Create projects
  console.log('📋 Creating projects...')
  for (const project of projects) {
    const created = await prisma.project.create({
      data: project,
    })
    console.log(`   ✓ ${created.facilityName}`)
  }

  // Create sample inquiries
  console.log('💬 Creating sample inquiries...')
  const hospitalProject = await prisma.project.findFirst({
    where: { category: 'HOSPITAL' },
  })

  const schoolProject = await prisma.project.findFirst({
    where: { category: 'SCHOOL' },
  })

  if (hospitalProject) {
    await prisma.inquiry.create({
      data: {
        projectId: hospitalProject.id,
        name: 'John Smith',
        email: 'john.smith@medicalaid.org',
        organization: 'Medical Aid International',
        message:
          'Our organization has ventilators and patient monitors available for donation. We have experience shipping medical equipment to Ukraine and can coordinate logistics. Please let us know how to proceed.',
      },
    })
    console.log('   ✓ Medical equipment inquiry')
  }

  if (schoolProject) {
    await prisma.inquiry.create({
      data: {
        projectId: schoolProject.id,
        name: 'Sarah Johnson',
        email: 'sarah@educationfirst.org',
        organization: 'Education First Foundation',
        message:
          'We would like to sponsor the laptop program for your school. Our foundation focuses on education technology and we can provide 50 refurbished laptops with educational software pre-installed.',
      },
    })
    console.log('   ✓ Education supplies inquiry')
  }

  console.log('')
  console.log('✅ Seed completed!')
  console.log(`   ${projects.length} projects created`)
  console.log('   2 sample inquiries created')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
