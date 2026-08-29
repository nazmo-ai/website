/**
 * Greedy word wrap for SVG node labels, sized from the box width so labels
 * never overflow their card. SVG text has no automatic wrapping, so the line
 * breaks have to be decided before render.
 */
export function wrapLabel(label: string, width: number, fontSize = 13): string[] {
  const maxChars = Math.max(6, Math.floor((width - 18) / (fontSize * 0.55)))
  const lines: string[] = []
  let current = ''

  for (const word of label.split(' ')) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}
