import { describe, expect, it } from 'vitest'
import { FLOW_NODES } from '../../data/orchestrationFlow'
import { wrapLabel } from './wrapLabel'

describe('wrapLabel', () => {
  it('leaves a short label on one line', () => {
    expect(wrapLabel('Intent', 140)).toEqual(['Intent'])
  })

  it('breaks a long label on word boundaries', () => {
    expect(wrapLabel('Service chain design', 140)).toEqual(['Service chain', 'design'])
  })

  it('never splits a word', () => {
    for (const line of wrapLabel('Monitoring & management', 140)) {
      expect(line).not.toMatch(/^\s|\s$/)
    }
    expect(wrapLabel('Monitoring & management', 140).join(' ')).toBe('Monitoring & management')
  })

  it('keeps a single over-long word rather than dropping it', () => {
    expect(wrapLabel('Supercalifragilistic', 60)).toEqual(['Supercalifragilistic'])
  })

  it('gives wider boxes more characters per line', () => {
    const narrow = wrapLabel('Design & cost approval', 120)
    const wide = wrapLabel('Design & cost approval', 400)
    expect(wide.length).toBeLessThanOrEqual(narrow.length)
    expect(wide).toEqual(['Design & cost approval'])
  })

  it('preserves every label word for the real nodes', () => {
    for (const node of FLOW_NODES) {
      for (const box of [node.desktop, node.mobile]) {
        expect(wrapLabel(node.label, box.w).join(' ')).toBe(node.label)
      }
    }
  })

  it('keeps every real desktop label within two lines', () => {
    for (const node of FLOW_NODES) {
      expect(wrapLabel(node.label, node.desktop.w).length).toBeLessThanOrEqual(2)
    }
  })
})
