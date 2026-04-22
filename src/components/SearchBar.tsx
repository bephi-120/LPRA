'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Loader2, Disc3, X } from 'lucide-react'
import type { YTMusicSearchResult } from '@/types'

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YTMusicSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce: espera 400ms después de que el usuario deja de escribir
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results || [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  // Cerrar el dropdown si se hace click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(browseId: string) {
    setOpen(false)
    setQuery('')
    router.push(`/album/${browseId}`)
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscá un álbum o artista..."
          className="input pl-10 pr-10"
          autoComplete="off"
        />
        {/* Loader o botón X */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
          ) : query ? (
            <button onClick={clearSearch} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 card overflow-hidden shadow-2xl shadow-black/50 z-50">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No se encontraron álbumes para "{query}"
            </div>
          ) : (
            <ul className="divide-y divide-gray-800/50 max-h-80 overflow-y-auto">
              {results.map((result) => {
                const thumb = result.thumbnails?.[0]?.url
                return (
                  <li key={result.browseId}>
                    <button
                      onClick={() => handleSelect(result.browseId)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left"
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-800 shrink-0">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={result.title}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc3 className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-100 truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {result.artist}
                          {result.year && <span className="text-gray-600"> · {result.year}</span>}
                        </p>
                      </div>

                      {/* Tipo */}
                      <span className="text-xs text-gray-600 uppercase tracking-wide shrink-0">
                        {result.type === 'SINGLE' ? 'Single' : result.type === 'EP' ? 'EP' : 'Álbum'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
