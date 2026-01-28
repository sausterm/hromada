import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryFilter } from '@/components/map/CategoryFilter'
import { type Category, CATEGORY_CONFIG } from '@/types'

describe('CategoryFilter', () => {
  const mockOnToggle = jest.fn()
  const allCategories = new Set(Object.keys(CATEGORY_CONFIG) as Category[])

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('renders all category buttons', () => {
    render(
      <CategoryFilter
        activeCategories={allCategories}
        onToggle={mockOnToggle}
      />
    )

    // Check that all category labels are rendered
    Object.values(CATEGORY_CONFIG).forEach((config) => {
      expect(screen.getByText(config.label)).toBeInTheDocument()
    })
  })

  it('renders filter label', () => {
    render(
      <CategoryFilter
        activeCategories={allCategories}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Filter:')).toBeInTheDocument()
  })

  it('calls onToggle when category button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CategoryFilter
        activeCategories={allCategories}
        onToggle={mockOnToggle}
      />
    )

    await user.click(screen.getByText('Hospital / Medical'))
    expect(mockOnToggle).toHaveBeenCalledWith('HOSPITAL')
  })

  it('shows active state for active categories', () => {
    render(
      <CategoryFilter
        activeCategories={new Set(['HOSPITAL'] as Category[])}
        onToggle={mockOnToggle}
      />
    )

    // Active category should have text-white class
    const hospitalButton = screen.getByText('Hospital / Medical').parentElement
    expect(hospitalButton?.className).toContain('text-white')

    // Inactive category should have text-gray-500 class
    const schoolButton = screen.getByText('School / Education').parentElement
    expect(schoolButton?.className).toContain('text-gray-500')
  })

  it('shows inactive state for inactive categories', () => {
    render(
      <CategoryFilter
        activeCategories={new Set<Category>()}
        onToggle={mockOnToggle}
      />
    )

    // All buttons should be inactive
    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button.className).toContain('text-gray-500')
    })
  })

  it('renders icons for each category', () => {
    render(
      <CategoryFilter
        activeCategories={allCategories}
        onToggle={mockOnToggle}
      />
    )

    // Check for emoji icons
    Object.values(CATEGORY_CONFIG).forEach((config) => {
      expect(screen.getByText(config.icon)).toBeInTheDocument()
    })
  })

  it('toggles different categories', async () => {
    const user = userEvent.setup()
    render(
      <CategoryFilter
        activeCategories={allCategories}
        onToggle={mockOnToggle}
      />
    )

    await user.click(screen.getByText('School / Education'))
    expect(mockOnToggle).toHaveBeenCalledWith('SCHOOL')

    await user.click(screen.getByText('Water Utility'))
    expect(mockOnToggle).toHaveBeenCalledWith('WATER')

    await user.click(screen.getByText('Energy Infrastructure'))
    expect(mockOnToggle).toHaveBeenCalledWith('ENERGY')

    await user.click(screen.getByText('Other Infrastructure'))
    expect(mockOnToggle).toHaveBeenCalledWith('OTHER')
  })
})
