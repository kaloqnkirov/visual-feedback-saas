export type ShareMode = 'comment' | 'view'

export type Project = {
  id: string
  title: string
  asset_url: string
  created_at: string
  owner_id?: string | null
  share_mode?: ShareMode | null
}

export type Pin = {
  id: string
  project_id: string
  x_percent: number
  y_percent: number
  width_percent?: number | null
  height_percent?: number | null
  author: string
  comment: string
  change_detail?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  status: 'open' | 'resolved'
  created_at?: string
}

export type PinReply = {
  id: string
  pin_id: string
  author: string
  body: string
  created_at: string
}

export type ProjectVersion = {
  id: string
  project_id: string
  asset_url: string
  label: string
  created_at: string
}

export type AppNotification = {
  id: string
  user_id: string | null
  project_id: string | null
  message: string
  read: boolean
  created_at: string
}
