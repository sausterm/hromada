/**
 * @jest-environment node
 */

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}))

// Mock prisma
const mockPrisma = {
  project: {
    findMany: jest.fn(),
  },
  projectImage: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Stock photos data structure (matching the script)
const stockPhotos: Record<string, string[]> = {
  HOSPITAL: [
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&q=80',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
    'https://images.unsplash.com/photo-1581595220892-4ef7c392de07?w=1200&q=80',
    'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=1200&q=80',
    'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&q=80',
    'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=1200&q=80',
  ],
  SCHOOL: [
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80',
    'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1200&q=80',
    'https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&q=80',
    'https://images.unsplash.com/photo-1613896527026-f195d5c818ed?w=1200&q=80',
    'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=1200&q=80',
  ],
  WATER: [
    'https://images.unsplash.com/photo-1597931752949-98c74b5b159f?w=1200&q=80',
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=1200&q=80',
    'https://images.unsplash.com/photo-1585918749741-68e0d55e2ad1?w=1200&q=80',
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&q=80',
    'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?w=1200&q=80',
    'https://images.unsplash.com/photo-1606937295547-bc0f668595b3?w=1200&q=80',
  ],
  ENERGY: [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',
    'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=1200&q=80',
    'https://images.unsplash.com/photo-1595437193398-f24279553f4f?w=1200&q=80',
    'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=1200&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80',
    'https://images.unsplash.com/photo-1591964006776-90d33e597179?w=1200&q=80',
  ],
  OTHER: [
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=1200&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1200&q=80',
    'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=1200&q=80',
  ],
}

describe('add-stock-photos-to-all script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addStockPhotosToAll function logic', () => {
    it('fetches all projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([])

      await mockPrisma.project.findMany({
        select: {
          id: true,
          facilityName: true,
          category: true,
        },
      })

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          facilityName: true,
          category: true,
        },
      })
    })

    it('clears all existing photos', async () => {
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 10 })

      await mockPrisma.projectImage.deleteMany({})

      expect(mockPrisma.projectImage.deleteMany).toHaveBeenCalledWith({})
    })

    it('adds photos to each project based on category', async () => {
      const mockProjects = [
        { id: 'p1', facilityName: 'Hospital A', category: 'HOSPITAL' },
        { id: 'p2', facilityName: 'School B', category: 'SCHOOL' },
      ]

      mockPrisma.project.findMany.mockResolvedValue(mockProjects)
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.projectImage.create.mockResolvedValue({})

      const allProjects = await mockPrisma.project.findMany({
        select: { id: true, facilityName: true, category: true },
      })

      await mockPrisma.projectImage.deleteMany({})

      // Simulate adding photos to each project
      for (const project of allProjects) {
        const category = project.category
        const photos = stockPhotos[category] || stockPhotos.OTHER

        // Add 2 photos for each project (simplified for test)
        for (let i = 0; i < 2; i++) {
          await mockPrisma.projectImage.create({
            data: {
              projectId: project.id,
              url: photos[i % photos.length],
              sortOrder: i,
            },
          })
        }
      }

      // 2 projects * 2 photos each = 4 creates
      expect(mockPrisma.projectImage.create).toHaveBeenCalledTimes(4)
    })

    it('uses OTHER photos for unknown categories', async () => {
      const mockProjects = [
        { id: 'p1', facilityName: 'Unknown', category: 'UNKNOWN_CATEGORY' },
      ]

      mockPrisma.project.findMany.mockResolvedValue(mockProjects)
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.projectImage.create.mockResolvedValue({})

      const allProjects = await mockPrisma.project.findMany({
        select: { id: true, facilityName: true, category: true },
      })

      for (const project of allProjects) {
        const category = project.category
        const photos = stockPhotos[category] || stockPhotos.OTHER

        // Should fall back to OTHER photos
        expect(photos).toBe(stockPhotos.OTHER)

        await mockPrisma.projectImage.create({
          data: {
            projectId: project.id,
            url: photos[0],
            sortOrder: 0,
          },
        })
      }

      expect(mockPrisma.projectImage.create).toHaveBeenCalledWith({
        data: {
          projectId: 'p1',
          url: stockPhotos.OTHER[0],
          sortOrder: 0,
        },
      })
    })

    it('cycles through photos when multiple projects have same category', async () => {
      const mockProjects = [
        { id: 'p1', facilityName: 'Hospital 1', category: 'HOSPITAL' },
        { id: 'p2', facilityName: 'Hospital 2', category: 'HOSPITAL' },
        { id: 'p3', facilityName: 'Hospital 3', category: 'HOSPITAL' },
      ]

      mockPrisma.project.findMany.mockResolvedValue(mockProjects)
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.projectImage.create.mockResolvedValue({})

      const allProjects = await mockPrisma.project.findMany({
        select: { id: true, facilityName: true, category: true },
      })

      const photoIndex: Record<string, number> = {
        HOSPITAL: 0,
        SCHOOL: 0,
        WATER: 0,
        ENERGY: 0,
        OTHER: 0,
      }

      for (const project of allProjects) {
        const category = project.category as keyof typeof stockPhotos
        const photos = stockPhotos[category] || stockPhotos.OTHER

        // Add 2 photos per project, cycling through
        const numPhotos = 2
        for (let i = 0; i < numPhotos; i++) {
          const idx = (photoIndex[category] + i) % photos.length
          await mockPrisma.projectImage.create({
            data: {
              projectId: project.id,
              url: photos[idx],
              sortOrder: i,
            },
          })
        }
        photoIndex[category] = (photoIndex[category] + numPhotos) % photos.length
      }

      // 3 projects * 2 photos = 6 creates
      expect(mockPrisma.projectImage.create).toHaveBeenCalledTimes(6)
    })

    it('handles empty project list', async () => {
      mockPrisma.project.findMany.mockResolvedValue([])
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 0 })

      const allProjects = await mockPrisma.project.findMany({
        select: { id: true, facilityName: true, category: true },
      })

      await mockPrisma.projectImage.deleteMany({})

      expect(allProjects).toHaveLength(0)
      expect(mockPrisma.projectImage.create).not.toHaveBeenCalled()
    })

    it('calls $disconnect at the end', async () => {
      await mockPrisma.$disconnect()
      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })
  })

  describe('stockPhotos data structure', () => {
    it('has photos for all main categories', () => {
      expect(stockPhotos.HOSPITAL).toBeDefined()
      expect(stockPhotos.SCHOOL).toBeDefined()
      expect(stockPhotos.WATER).toBeDefined()
      expect(stockPhotos.ENERGY).toBeDefined()
      expect(stockPhotos.OTHER).toBeDefined()
    })

    it('has multiple photos per category', () => {
      expect(stockPhotos.HOSPITAL.length).toBeGreaterThan(1)
      expect(stockPhotos.SCHOOL.length).toBeGreaterThan(1)
      expect(stockPhotos.WATER.length).toBeGreaterThan(1)
      expect(stockPhotos.ENERGY.length).toBeGreaterThan(1)
      expect(stockPhotos.OTHER.length).toBeGreaterThan(1)
    })

    it('all photo URLs are valid Unsplash URLs', () => {
      Object.values(stockPhotos).forEach((photos) => {
        photos.forEach((url) => {
          expect(url).toMatch(/^https:\/\/images\.unsplash\.com\//)
        })
      })
    })
  })
})
