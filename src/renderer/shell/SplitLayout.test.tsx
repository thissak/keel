// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { SplitLayout } from './SplitLayout.js'

describe('SplitLayout', () => {
  it('renders leaves through renderGroup and one handle per split', () => {
    const node = { type: 'split' as const, direction: 'horizontal' as const, ratio: 0.3, first: { type: 'leaf' as const, groupId: 'a' }, second: { type: 'split' as const, direction: 'vertical' as const, ratio: 0.5, first: { type: 'leaf' as const, groupId: 'b' }, second: { type: 'leaf' as const, groupId: 'c' } } }
    const { container, getByText } = render(<SplitLayout node={node} path={[]} renderGroup={id => <span>group:{id}</span>} onRatio={() => {}} />)
    expect(getByText('group:a')).toBeTruthy()
    expect(getByText('group:c')).toBeTruthy()
    expect(container.querySelectorAll('[data-split-handle]').length).toBe(2)
    const first = container.querySelector('[data-split-first]') as HTMLElement
    expect(first.style.flex).toBe('0.3 1 0%')
  })
})
