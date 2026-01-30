import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicImageUpload } from '@/components/forms/PublicImageUpload'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, number>) => {
    const translations: Record<string, string> = {
      'submitProject.photos.label': 'Project Photos',
      'submitProject.photos.images': 'images',
      'submitProject.photos.invalidType': 'Invalid file type. Only JPG, PNG, and WebP are allowed.',
      'submitProject.photos.tooLarge': 'File too large. Maximum size is 5MB.',
      'submitProject.photos.uploadFailed': 'Upload failed',
      'submitProject.photos.imageAlt': 'Project image',
      'submitProject.photos.remove': 'Remove image',
      'submitProject.photos.main': 'Main',
      'submitProject.photos.uploading': 'Uploading...',
      'submitProject.photos.clickToUpload': 'Click to upload',
      'submitProject.photos.orDragDrop': 'or drag and drop',
      'submitProject.photos.fileTypes': 'JPG, PNG, or WebP up to 5MB',
      'submitProject.photos.maxReached': `Maximum of ${params?.max || 5} images reached. Remove an image to upload more.`,
      'submitProject.photos.dismiss': 'Dismiss',
      'submitProject.photos.dragToReorder': 'Drag images to reorder. The first image will be used as the main image.',
    }
    return translations[key] || key
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('PublicImageUpload', () => {
  const mockOnChange = jest.fn()
  const defaultProps = {
    images: [],
    onChange: mockOnChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<PublicImageUpload {...defaultProps} />)
      expect(screen.getByText('Project Photos')).toBeInTheDocument()
    })

    it('shows image count', () => {
      render(<PublicImageUpload {...defaultProps} />)
      expect(screen.getByText(/0\/5/)).toBeInTheDocument()
    })

    it('shows upload instructions', () => {
      render(<PublicImageUpload {...defaultProps} />)
      expect(screen.getByText('Click to upload')).toBeInTheDocument()
      expect(screen.getByText('or drag and drop')).toBeInTheDocument()
    })

    it('shows file type info', () => {
      render(<PublicImageUpload {...defaultProps} />)
      expect(screen.getByText('JPG, PNG, or WebP up to 5MB')).toBeInTheDocument()
    })
  })

  describe('Image display', () => {
    it('displays existing images', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      render(<PublicImageUpload {...defaultProps} images={images} />)

      expect(screen.getByAltText('Project image 1')).toBeInTheDocument()
      expect(screen.getByAltText('Project image 2')).toBeInTheDocument()
    })

    it('marks first image as main', () => {
      const images = ['https://example.com/image1.jpg']
      render(<PublicImageUpload {...defaultProps} images={images} />)

      expect(screen.getByText('Main')).toBeInTheDocument()
    })

    it('shows reorder hint with multiple images', () => {
      const images = ['https://example.com/1.jpg', 'https://example.com/2.jpg']
      render(<PublicImageUpload {...defaultProps} images={images} />)

      expect(screen.getByText(/Drag images to reorder/)).toBeInTheDocument()
    })
  })

  describe('Max images', () => {
    it('hides dropzone at max capacity', () => {
      const images = Array(5).fill(null).map((_, i) => `https://example.com/${i}.jpg`)
      render(<PublicImageUpload {...defaultProps} images={images} />)

      expect(screen.queryByText('Click to upload')).not.toBeInTheDocument()
    })

    it('shows max reached message', () => {
      const images = Array(5).fill(null).map((_, i) => `https://example.com/${i}.jpg`)
      render(<PublicImageUpload {...defaultProps} images={images} />)

      expect(screen.getByText(/Maximum of 5 images reached/)).toBeInTheDocument()
    })

    it('respects custom maxImages', () => {
      const images = Array(3).fill(null).map((_, i) => `https://example.com/${i}.jpg`)
      render(<PublicImageUpload {...defaultProps} images={images} maxImages={3} />)

      expect(screen.getByText(/Maximum of 3 images reached/)).toBeInTheDocument()
    })
  })

  describe('Image removal', () => {
    it('removes image when clicking remove button', async () => {
      const user = userEvent.setup()
      const images = ['https://example.com/1.jpg', 'https://example.com/2.jpg']
      render(<PublicImageUpload {...defaultProps} images={images} />)

      const removeButtons = screen.getAllByTitle('Remove image')
      await user.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/2.jpg'])
    })
  })

  describe('File validation', () => {
    it('shows error for invalid file type', async () => {
      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'test.gif', { type: 'image/gif' })

      Object.defineProperty(input, 'files', { value: [file] })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/)).toBeInTheDocument()
      })
    })

    it('shows error for file too large', async () => {
      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

      Object.defineProperty(input, 'files', { value: [largeFile] })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/File too large/)).toBeInTheDocument()
      })
    })

    it('dismisses error when clicking dismiss', async () => {
      const user = userEvent.setup()
      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'test.gif', { type: 'image/gif' })

      Object.defineProperty(input, 'files', { value: [file] })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/)).toBeInTheDocument()
      })

      await user.click(screen.getByText('Dismiss'))
      expect(screen.queryByText(/Invalid file type/)).not.toBeInTheDocument()
    })
  })

  describe('File upload', () => {
    it('uploads to public endpoint', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://storage.example.com/public.jpg' }),
      })

      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', { value: [file] })
      fireEvent.change(input)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/upload/public', expect.objectContaining({
          method: 'POST',
        }))
      })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['https://storage.example.com/public.jpg'])
      })
    })

    it('shows uploading state', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://example.com/test.jpg' }),
        }), 100))
      )

      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', { value: [file] })
      fireEvent.change(input)

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })

    it('shows error on upload failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload rejected' }),
      })

      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', { value: [file] })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('Upload rejected')).toBeInTheDocument()
      })
    })

    it('handles network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'))

      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', { value: [file] })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('Network failed')).toBeInTheDocument()
      })
    })
  })

  describe('Multiple file upload', () => {
    it('uploads multiple files', async () => {
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: `https://example.com/file${callCount}.jpg` }),
        })
      })

      render(<PublicImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      Object.defineProperty(input, 'files', { value: files })
      fireEvent.change(input)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('respects remaining slots', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://example.com/new.jpg' }),
      })

      const existingImages = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg', 'https://example.com/4.jpg']
      render(<PublicImageUpload {...defaultProps} images={existingImages} maxImages={5} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      Object.defineProperty(input, 'files', { value: files })
      fireEvent.change(input)

      await waitFor(() => {
        // Only 1 slot available
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })
  })
})
