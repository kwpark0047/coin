import { describe, it, expect } from 'vitest'
import { formatKRW, cn } from './utils'

describe('formatKRW', () => {
  it('숫자를 원화 형식으로 포맷팅한다', () => {
    expect(formatKRW(1000)).toBe('₩1,000')
    expect(formatKRW(1000000)).toBe('₩1,000,000')
    expect(formatKRW(0)).toBe('₩0')
  })

  it('음수도 올바르게 포맷팅한다', () => {
    const result = formatKRW(-5000)
    expect(result).toContain('5,000')
  })

  it('소수점 이하는 버림 처리한다', () => {
    expect(formatKRW(1500.7)).toBe('₩1,500')
  })
})

describe('cn', () => {
  it('클래스명을 병합한다', () => {
    const result = cn('px-4', 'py-2', 'bg-red-500')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
    expect(result).toContain('bg-red-500')
  })

  it('falsy 값은 무시한다', () => {
    const result = cn('base', false && 'hidden', undefined, null, 'visible')
    expect(result).toBe('base visible')
  })
})
