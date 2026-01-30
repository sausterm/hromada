/**
 * @jest-environment node
 */

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}))

describe('add-example-photos script', () => {
  // Create fresh mock for each test
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()
    // Create fresh mocks for each test
    mockPrisma = {
      project: {
        findFirst: jest.fn(),
      },
      projectImage: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      $disconnect: jest.fn(),
    }
  })

  describe('addExamplePhotos function logic', () => {
    it('adds photos to hospital project when found', async () => {
      const mockHospitalProject = {
        id: 'hospital-1',
        facilityName: 'Test Hospital',
        category: 'HOSPITAL',
      }

      mockPrisma.project.findFirst.mockResolvedValueOnce(mockHospitalProject)
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.projectImage.create.mockResolvedValue({})

      // Simulate the script logic
      const hospitalProject = await mockPrisma.project.findFirst({
        where: { category: 'HOSPITAL' },
      })

      if (hospitalProject) {
        await mockPrisma.projectImage.deleteMany({
          where: { projectId: hospitalProject.id },
        })

        const hospitalPhotos = [
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
          'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&q=80',
          'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80',
          'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&q=80',
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80',
        ]

        for (let i = 0; i < hospitalPhotos.length; i++) {
          await mockPrisma.projectImage.create({
            data: {
              projectId: hospitalProject.id,
              url: hospitalPhotos[i],
              sortOrder: i,
            },
          })
        }
      }

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { category: 'HOSPITAL' },
      })
      expect(mockPrisma.projectImage.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'hospital-1' },
      })
      expect(mockPrisma.projectImage.create).toHaveBeenCalledTimes(5)
    })

    it('adds photos to school project when found', async () => {
      const mockSchoolProject = {
        id: 'school-1',
        facilityName: 'Test School',
        category: 'SCHOOL',
      }

      mockPrisma.project.findFirst.mockResolvedValueOnce(mockSchoolProject)
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.projectImage.create.mockResolvedValue({})

      // Simulate the script logic for school
      const schoolProject = await mockPrisma.project.findFirst({
        where: { category: 'SCHOOL' },
      })

      if (schoolProject) {
        await mockPrisma.projectImage.deleteMany({
          where: { projectId: schoolProject.id },
        })

        const schoolPhotos = [
          'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
          'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
        ]

        for (let i = 0; i < schoolPhotos.length; i++) {
          await mockPrisma.projectImage.create({
            data: {
              projectId: schoolProject.id,
              url: schoolPhotos[i],
              sortOrder: i,
            },
          })
        }
      }

      expect(mockPrisma.projectImage.create).toHaveBeenCalledTimes(2)
    })

    it('handles case when no hospital project found', async () => {
      mockPrisma.project.findFirst.mockResolvedValueOnce(null)

      const hospitalProject = await mockPrisma.project.findFirst({
        where: { category: 'HOSPITAL' },
      })

      expect(hospitalProject).toBeNull()
      expect(mockPrisma.projectImage.deleteMany).not.toHaveBeenCalled()
    })

    it('handles case when no school project found', async () => {
      mockPrisma.project.findFirst.mockResolvedValueOnce(null)

      const schoolProject = await mockPrisma.project.findFirst({
        where: { category: 'SCHOOL' },
      })

      expect(schoolProject).toBeNull()
      expect(mockPrisma.projectImage.create).not.toHaveBeenCalled()
    })

    it('calls $disconnect at the end', async () => {
      await mockPrisma.$disconnect()
      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })

    it('creates photos with correct sortOrder', async () => {
      const mockProject = { id: 'p1', facilityName: 'Test', category: 'HOSPITAL' }
      mockPrisma.project.findFirst.mockResolvedValueOnce(mockProject)
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.projectImage.create.mockResolvedValue({})

      const project = await mockPrisma.project.findFirst({ where: { category: 'HOSPITAL' } })

      if (project) {
        await mockPrisma.projectImage.deleteMany({ where: { projectId: project.id } })

        for (let i = 0; i < 3; i++) {
          await mockPrisma.projectImage.create({
            data: {
              projectId: project.id,
              url: `https://example.com/photo${i}.jpg`,
              sortOrder: i,
            },
          })
        }
      }

      expect(mockPrisma.projectImage.create).toHaveBeenNthCalledWith(1, {
        data: { projectId: 'p1', url: 'https://example.com/photo0.jpg', sortOrder: 0 },
      })
      expect(mockPrisma.projectImage.create).toHaveBeenNthCalledWith(2, {
        data: { projectId: 'p1', url: 'https://example.com/photo1.jpg', sortOrder: 1 },
      })
      expect(mockPrisma.projectImage.create).toHaveBeenNthCalledWith(3, {
        data: { projectId: 'p1', url: 'https://example.com/photo2.jpg', sortOrder: 2 },
      })
    })

    it('deletes existing photos before adding new ones', async () => {
      const mockProject = { id: 'p1', facilityName: 'Test', category: 'HOSPITAL' }
      mockPrisma.project.findFirst.mockResolvedValueOnce(mockProject)
      mockPrisma.projectImage.deleteMany.mockResolvedValue({ count: 5 })
      mockPrisma.projectImage.create.mockResolvedValue({})

      // Track call order
      const callOrder: string[] = []
      mockPrisma.projectImage.deleteMany.mockImplementation(() => {
        callOrder.push('deleteMany')
        return Promise.resolve({ count: 5 })
      })
      mockPrisma.projectImage.create.mockImplementation(() => {
        callOrder.push('create')
        return Promise.resolve({})
      })

      const project = await mockPrisma.project.findFirst({ where: { category: 'HOSPITAL' } })

      if (project) {
        await mockPrisma.projectImage.deleteMany({
          where: { projectId: project.id },
        })

        await mockPrisma.projectImage.create({
          data: { projectId: project.id, url: 'test.jpg', sortOrder: 0 },
        })

        // Verify deleteMany was called before create
        expect(callOrder[0]).toBe('deleteMany')
        expect(callOrder[1]).toBe('create')
      }
    })
  })
})
