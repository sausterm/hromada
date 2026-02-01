'use client'

import { type Category, CATEGORY_CONFIG } from '@/types'

interface CategoryFilterProps {
  activeCategories: Set<Category>
  onToggle: (category: Category) => void
}

export function CategoryFilter({ activeCategories, onToggle }: CategoryFilterProps) {
  const categories = Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl shadow-lg">
      <span className="text-sm font-medium text-gray-600 mr-2 self-center">Filter:</span>
      {categories.map(([category, config]) => {
        const isActive = activeCategories.has(category)
        return (
          <button
            key={category}
            onClick={() => onToggle(category)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-150 border-2
              ${
                isActive
                  ? 'border-transparent text-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
              }
            `}
            style={{
              backgroundColor: isActive ? config.color : undefined,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              dangerouslySetInnerHTML={{ __html: config.icon }}
            />
            <span>{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}
