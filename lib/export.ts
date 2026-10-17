import type { Pin, PinReply } from '@/lib/types'

export function exportPinsToCsv(
  projectTitle: string,
  pins: Pin[],
  replies: PinReply[]
) {
  const replyCount = (pinId: string) =>
    replies.filter((reply) => reply.pin_id === pinId).length

  const rows = [
    [
      'index',
      'author',
      'summary',
      'change_detail',
      'status',
      'x_percent',
      'y_percent',
      'width_percent',
      'height_percent',
      'attachment_url',
      'replies',
      'created_at',
    ],
    ...pins.map((pin, index) => [
      String(index + 1),
      pin.author,
      pin.comment,
      pin.change_detail ?? '',
      pin.status,
      String(pin.x_percent),
      String(pin.y_percent),
      String(pin.width_percent ?? 0),
      String(pin.height_percent ?? 0),
      pin.attachment_url ?? '',
      String(replyCount(pin.id)),
      pin.created_at ?? '',
    ]),
  ]

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase() || 'project'}-pins.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
