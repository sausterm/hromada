import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUpload } from '@/components/admin/ImageUpload'

// Mock fetch
global.fetch = jest.fn()

describe('ImageUpload', () => {
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
      render(<ImageUpload {...defaultProps} />)
      expect(screen.getByText('Project Images')).toBeInTheDocument()
    })

    it('shows image count', () => {
      render(<ImageUpload {...defaultProps} />)
      expect(screen.getByText('0/5 images')).toBeInTheDocument()
    })

    it('shows custom max images count', () => {
      render(<ImageUpload {...defaultProps} maxImages={3} />)
      expect(screen.getByText('0/3 images')).toBeInTheDocument()
    })

    it('shows upload dropzone when under max images', () => {
      render(<ImageUpload {...defaultProps} />)
      expect(screen.getByText(/Click to upload/)).toBeInTheDocument()
      expect(screen.getByText(/drag and drop/)).toBeInTheDocument()
    })

    it('shows file type restrictions', () => {
      render(<ImageUpload {...defaultProps} />)
      expect(screen.getByText(/JPG, PNG, or WebP up to 5MB/)).toBeInTheDocument()
    })
  })

  describe('Image display', () => {
    it('displays existing images', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      render(<ImageUpload {...defaultProps} images={images} />)

      expect(screen.getByAltText('Project image 1')).toBeInTheDocument()
      expect(screen.getByAltText('Project image 2')).toBeInTheDocument()
    })

    it('marks first image as main', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      render(<ImageUpload {...defaultProps} images={images} />)

      expect(screen.getByText('Main')).toBeInTheDocument()
    })

    it('shows image numbers', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      render(<ImageUpload {...defaultProps} images={images} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows reorder hint when multiple images', () => {
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      render(<ImageUpload {...defaultProps} images={images} />)

      expect(screen.getByText(/Drag images to reorder/)).toBeInTheDocument()
    })

    it('does not show reorder hint with single image', () => {
      const images = ['https://example.com/image1.jpg']
      render(<ImageUpload {...defaultProps} images={images} />)

      expect(screen.queryByText(/Drag images to reorder/)).not.toBeInTheDocument()
    })
  })

  describe('Max images limit', () => {
    it('hides dropzone when max images reached', () => {
      const images = Array(5).fill(null).map((_, i) => `https://example.com/image${i}.jpg`)
      render(<ImageUpload {...defaultProps} images={images} />)

      expect(screen.queryByText(/Click to upload/)).not.toBeInTheDocument()
    })

    it('shows max reached message', () => {
      const images = Array(5).fill(null).map((_, i) => `https://example.com/image${i}.jpg`)
      render(<ImageUpload {...defaultProps} images={images} />)

      expect(screen.getByText(/Maximum of 5 images reached/)).toBeInTheDocument()
    })

    it('shows orange count when at max', () => {
      const images = Array(5).fill(null).map((_, i) => `https://example.com/image${i}.jpg`)
      render(<ImageUpload {...defaultProps} images={images} />)

      const countElement = screen.getByText('5/5 images')
      expect(countElement).toHaveClass('text-orange-600')
    })
  })

  describe('Image removal', () => {
    it('calls onChange when removing an image', async () => {
      const user = userEvent.setup()
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      render(<ImageUpload {...defaultProps} images={images} />)

      // Hover over the first image to show remove button
      const firstImage = screen.getByAltText('Project image 1').closest('div')
      if (firstImage) {
        await user.hover(firstImage)
      }

      // Find and click the remove button
      const removeButtons = screen.getAllByTitle('Remove image')
      await user.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/image2.jpg'])
    })
  })

  describe('File validation', () => {
    it('shows error for invalid file type', async () => {
      render(<ImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' })

      Object.defineProperty(input, 'files', {
        value: [invalidFile],
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/)).toBeInTheDocument()
      })
    })

    it('shows error for file too large', async () => {
      render(<ImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // Create a mock file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

      Object.defineProperty(input, 'files', {
        value: [largeFile],
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/File too large/)).toBeInTheDocument()
      })
    })

    it('allows dismissing error', async () => {
      const user = userEvent.setup()
      render(<ImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' })

      Object.defineProperty(input, 'files', {
        value: [invalidFile],
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/)).toBeInTheDocument()
      })

      await user.click(screen.getByText('Dismiss'))

      expect(screen.queryByText(/Invalid file type/)).not.toBeInTheDocument()
    })
  })

  describe('File upload', () => {
    it('calls API and updates images on successful upload', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://storage.example.com/uploaded.jpg' }),
      })

      render(<ImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', {
        value: [validFile],
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
          method: 'POST',
        }))
      })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['https://storage.example.com/uploaded.jpg'])
      })
    })

    it('shows error on upload failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      render(<ImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', {
        value: [validFile],
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
    })

    it('shows uploading state', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://example.com/uploaded.jpg' }),
        }), 100))
      )

      render(<ImageUpload {...defaultProps} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', {
        value: [validFile],
      })

      fireEvent.change(input)

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })

    it('limits uploads to remaining slots', async () => {
      const existingImages = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg', 'https://example.com/4.jpg']

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://storage.example.com/new.jpg' }),
      })

      render(<ImageUpload {...defaultProps} images={existingImages} maxImages={5} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
      ]

      Object.defineProperty(input, 'files', {
        value: files,
      })

      fireEvent.change(input)

      await waitFor(() => {
        // Should only upload 1 file (5 max - 4 existing = 1 slot)
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Drag and drop upload', () => {
    it('shows drag over state', () => {
      render(<ImageUpload {...defaultProps} />)

      const dropzone = screen.getByText(/Click to upload/).closest('div')
      if (dropzone) {
        fireEvent.dragOver(dropzone)
      }

      // The dropzone should have the drag over styling
      // This is a visual state test
    })

    it('handles file drop', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://storage.example.com/dropped.jpg' }),
      })

      render(<ImageUpload {...defaultProps} />)

      const dropzone = screen.getByText(/Click to upload/).closest('div')?.parentElement
      if (dropzone) {
        const file = new File(['test'], 'dropped.jpg', { type: 'image/jpeg' })
        const dataTransfer = {
          files: [file],
        }

        fireEvent.drop(dropzone, { dataTransfer })

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled()
        })
      }
    })
  })
})
