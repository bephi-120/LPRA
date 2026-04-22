'use client'

import { useState } from 'react'
import { getRatingColor } from '@/lib/utils'

type RatingInputProps = {
  value: number | null
  onChange: (rating: number) => void
  disabled?: boolean
}

// Los 11 valores posibles: 0.0, 0.5, 1.0 ... 10.0
// Para simplificar usamos enteros 0-10
const RATINGS = [0,1,2,3,4,5,6,7,8,9,10]

export default function RatingInput({ value, onChange, disabled }: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {RATINGS.map(n => (
        <button
          key={n}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className={`
            w-7 h-7 rounded text-xs font-bold transition-all
            ${display === n
              ? `${getRatingColor(n)} bg-gray-700 ring-1 ring-current`
              : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          {n}
        </button>
      ))}
      {value !== null && (
        <button
          onClick={() => onChange(-1)}
          disabled={disabled}
          className="text-xs text-gray-600 hover:text-red-400 ml-1 transition-colors"
          title="Quitar rating"
        >
          ✕
        </button>
      )}
    </div>
  )
}
