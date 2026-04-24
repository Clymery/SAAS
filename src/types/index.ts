export interface User {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
  role: string
}

export interface Project {
  id: string
  name: string
  description?: string | null
  coverImage?: string | null
  status: string
  width: number
  height: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Asset {
  id: string
  name: string
  type: string
  url: string
  thumbnail?: string | null
  tags?: string | null
  createdAt: string
}

export interface Generation {
  id: string
  type: string
  status: string
  prompt?: string | null
  resultUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  category: string
  scene?: string | null
  thumbnail: string
  width: number
  height: number
}

export interface CanvasLayer {
  id: string
  type: 'image' | 'text' | 'background' | 'shape'
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  data: Record<string, unknown>
}
