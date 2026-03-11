import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { DocumentUpload } from '@/components/forms/DocumentUpload'

describe('DocumentUpload (forms)', () => {
  const defaultProps = {
    documents: [] as { key: string; filename: string; size: number }[],
    onChange: jest.fn(),
    partnerOrg: 'EcoAction',
    projectName: 'Test Project',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('renders the Documents label and count', () => {
    render(<DocumentUpload {...defaultProps} />)
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('0/10 documents')).toBeInTheDocument()
  })

  it('renders upload dropzone when under max documents', () => {
    render(<DocumentUpload {...defaultProps} />)
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument()
    expect(screen.getByText('PDF only, up to 20MB per file')).toBeInTheDocument()
  })

  it('renders document list when documents exist', () => {
    const docs = [
      { key: 'doc1', filename: 'report.pdf', size: 2097152 },
      { key: 'doc2', filename: 'budget.pdf', size: 512000 },
    ]
    render(<DocumentUpload {...defaultProps} documents={docs} />)
    expect(screen.getByText('report.pdf')).toBeInTheDocument()
    expect(screen.getByText('budget.pdf')).toBeInTheDocument()
    expect(screen.getByText('2.0 MB')).toBeInTheDocument()
    expect(screen.getByText('500.0 KB')).toBeInTheDocument()
  })

  it('shows max reached message when at limit', () => {
    const docs = Array.from({ length: 10 }, (_, i) => ({
      key: `doc${i}`,
      filename: `file${i}.pdf`,
      size: 1000,
    }))
    render(<DocumentUpload {...defaultProps} documents={docs} />)
    expect(screen.getByText('Maximum 10 documents reached.')).toBeInTheDocument()
    expect(screen.queryByText(/Click to upload/)).not.toBeInTheDocument()
  })

  it('removes a document when remove button is clicked', () => {
    const onChange = jest.fn()
    const docs = [{ key: 'doc1', filename: 'report.pdf', size: 1024 }]
    render(<DocumentUpload {...defaultProps} documents={docs} onChange={onChange} />)

    const removeBtn = screen.getByTitle('Remove document')
    fireEvent.click(removeBtn)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('shows error for non-PDF files', async () => {
    render(<DocumentUpload {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    expect(screen.getByText('Only PDF files are accepted.')).toBeInTheDocument()
  })

  it('shows error for files too large', async () => {
    render(<DocumentUpload {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigContent = new ArrayBuffer(21 * 1024 * 1024)
    const file = new File([bigContent], 'big.pdf', { type: 'application/pdf' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    expect(screen.getByText('File too large. Maximum size is 20MB.')).toBeInTheDocument()
  })

  it('uploads a valid PDF and calls onChange', async () => {
    const onChange = jest.fn()
    const uploadedDoc = { key: 'uploaded1', filename: 'valid.pdf', size: 5000 }
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => uploadedDoc,
    })

    render(<DocumentUpload {...defaultProps} onChange={onChange} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf content'], 'valid.pdf', { type: 'application/pdf' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/upload/document', expect.objectContaining({ method: 'POST' }))
    })

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([uploadedDoc])
    })
  })

  it('shows upload error when API fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })

    render(<DocumentUpload {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf content'], 'valid.pdf', { type: 'application/pdf' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('dismisses upload error when dismiss is clicked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    })

    render(<DocumentUpload {...defaultProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf content'], 'valid.pdf', { type: 'application/pdf' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Dismiss'))
    expect(screen.queryByText('Upload failed')).not.toBeInTheDocument()
  })

  it('respects custom maxDocuments prop', () => {
    render(<DocumentUpload {...defaultProps} maxDocuments={3} />)
    expect(screen.getByText('0/3 documents')).toBeInTheDocument()
  })
})
