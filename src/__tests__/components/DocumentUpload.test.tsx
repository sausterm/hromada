import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DocumentUpload } from '@/components/admin/DocumentUpload'

// Mock Button
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

describe('DocumentUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('renders the component heading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    })

    render(<DocumentUpload projectId="p1" />)

    expect(screen.getByText('Partner Documents')).toBeInTheDocument()
  })

  it('renders upload area', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    })

    render(<DocumentUpload projectId="p1" />)

    expect(screen.getByText('Drop a PDF here or click to browse')).toBeInTheDocument()
    expect(screen.getByText('PDF only, max 10MB')).toBeInTheDocument()
  })

  it('renders document type selector', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    })

    render(<DocumentUpload projectId="p1" />)

    expect(screen.getByText('Cost Estimate')).toBeInTheDocument()
    expect(screen.getByText('Engineering Assessment')).toBeInTheDocument()
    expect(screen.getByText('Itemized Budget')).toBeInTheDocument()
    expect(screen.getByText('Site Survey')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('renders label input', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    })

    render(<DocumentUpload projectId="p1" />)

    expect(screen.getByPlaceholderText('Label (optional)')).toBeInTheDocument()
  })

  it('fetches existing documents on mount', async () => {
    const mockDocs = [
      {
        id: 'd1',
        filename: 'cost-estimate.pdf',
        documentType: 'COST_ESTIMATE',
        label: 'Budget Q1',
        url: 'http://test.com/doc.pdf',
        fileSize: 1048576,
        extractionStatus: 'translated',
      },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: mockDocs }),
    })

    render(<DocumentUpload projectId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('Budget Q1')).toBeInTheDocument()
      expect(screen.getByText('COST ESTIMATE')).toBeInTheDocument()
      expect(screen.getByText('Translated')).toBeInTheDocument()
    })
  })

  it('shows file size for documents', async () => {
    const mockDocs = [
      {
        id: 'd1',
        filename: 'test.pdf',
        documentType: 'OTHER',
        label: null,
        url: 'http://test.com/doc.pdf',
        fileSize: 2097152, // 2 MB
        extractionStatus: 'extracted',
      },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: mockDocs }),
    })

    render(<DocumentUpload projectId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('2.0 MB')).toBeInTheDocument()
      expect(screen.getByText('Text extracted')).toBeInTheDocument()
    })
  })

  it('shows pending status for processing documents', async () => {
    const mockDocs = [
      {
        id: 'd1',
        filename: 'test.pdf',
        documentType: 'OTHER',
        label: null,
        url: 'http://test.com/doc.pdf',
        fileSize: null,
        extractionStatus: 'pending',
      },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: mockDocs }),
    })

    render(<DocumentUpload projectId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  it('renders view and remove buttons for documents', async () => {
    const mockDocs = [
      {
        id: 'd1',
        filename: 'test.pdf',
        documentType: 'OTHER',
        label: 'Test Doc',
        url: 'http://test.com/doc.pdf',
        fileSize: 512,
        extractionStatus: 'translated',
      },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: mockDocs }),
    })

    render(<DocumentUpload projectId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })
  })

  it('shows error for non-PDF files', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    })

    render(<DocumentUpload projectId="p1" />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Only PDF files are accepted.')).toBeInTheDocument()
    })
  })

  it('shows error for files too large', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    })

    render(<DocumentUpload projectId="p1" />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    // Create a file > 10MB
    const bigContent = new ArrayBuffer(11 * 1024 * 1024)
    const file = new File([bigContent], 'big.pdf', { type: 'application/pdf' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('File too large. Maximum size is 10MB.')).toBeInTheDocument()
    })
  })

  it('calls delete API when remove is clicked', async () => {
    const mockDocs = [
      {
        id: 'd1',
        filename: 'test.pdf',
        documentType: 'OTHER',
        label: 'Test',
        url: 'http://test.com/doc.pdf',
        fileSize: 512,
        extractionStatus: 'translated',
      },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: mockDocs }),
    })

    render(<DocumentUpload projectId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    // Reset fetch to track delete call
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    })

    fireEvent.click(screen.getByText('Remove'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/p1/documents?documentId=d1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
