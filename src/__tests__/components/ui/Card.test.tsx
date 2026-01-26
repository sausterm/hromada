import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies variant styles', () => {
    const { rerender, container } = render(<Card variant="default">Default</Card>)
    let cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).toContain('bg-white')
    expect(cardElement.className).toContain('border')

    rerender(<Card variant="elevated">Elevated</Card>)
    cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).toContain('shadow-lg')

    rerender(<Card variant="interactive">Interactive</Card>)
    cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).toContain('hover:shadow-md')
  })

  it('applies padding styles', () => {
    const { rerender, container } = render(<Card padding="none">No padding</Card>)
    let cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).not.toContain('p-4')

    rerender(<Card padding="sm">Small padding</Card>)
    cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).toContain('p-3')

    rerender(<Card padding="lg">Large padding</Card>)
    cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).toContain('p-6')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Custom</Card>)
    const cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).toContain('custom-class')
  })

  it('always has rounded corners', () => {
    const { container } = render(<Card>Test</Card>)
    const cardElement = container.firstChild as HTMLElement
    expect(cardElement.className).toContain('rounded-xl')
  })
})

describe('Card subcomponents', () => {
  it('renders CardHeader correctly', () => {
    render(<CardHeader>Header</CardHeader>)
    const header = screen.getByText('Header')
    expect(header.className).toContain('border-b')
  })

  it('renders CardTitle correctly', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.className).toContain('text-lg')
    expect(title.className).toContain('font-semibold')
  })

  it('renders CardDescription correctly', () => {
    render(<CardDescription>Description</CardDescription>)
    const desc = screen.getByText('Description')
    expect(desc.className).toContain('text-sm')
    expect(desc.className).toContain('text-gray-600')
  })

  it('renders CardContent correctly', () => {
    render(<CardContent>Content</CardContent>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders CardFooter correctly', () => {
    render(<CardFooter>Footer</CardFooter>)
    const footer = screen.getByText('Footer')
    expect(footer.className).toContain('border-t')
  })

  it('renders full card composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>A test description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('A test description')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})
