export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  providerId: string
  /** Input modalities: "text", "image", "video", "audio" */
  inputModalities?: string[]
  /** Output modalities: "text", "image", "audio" */
  outputModalities?: string[]
}
