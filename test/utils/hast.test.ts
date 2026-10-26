import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { h } from 'hastscript'
import type { TrimChildrenOptions } from '../../src/trim.ts'
import { isBreakNode, isRecursiveNode, isStopNode } from '../../src/utils/hast/hast.ts'
import * as hast from '../../src/utils/hast/index.ts'
import { trimChildren } from '../../src/trim.ts'

describe('isBreakNode()', () => {
    it('should correctly identify break element', () => {
        assert.strictEqual(isBreakNode(h('html')), false)
        assert.strictEqual(isBreakNode(h('p')), false)
        assert.strictEqual(isBreakNode(h('span')), false)
        assert.strictEqual(isBreakNode(h('br')), true)
        assert.strictEqual(isBreakNode(h('img')), false)
        assert.strictEqual(isBreakNode(h('hr')), false)
        assert.strictEqual(isBreakNode(h('input')), false)
        assert.strictEqual(isBreakNode(h('meta')), false)
        assert.strictEqual(isBreakNode(h('link')), false)
        assert.strictEqual(isBreakNode(h('area')), false)
        assert.strictEqual(isBreakNode(h('base')), false)
        assert.strictEqual(isBreakNode(h('col')), false)
        assert.strictEqual(isBreakNode(h('embed')), false)
        assert.strictEqual(isBreakNode(h('source')), false)
        assert.strictEqual(isBreakNode(h('track')), false)
        assert.strictEqual(isBreakNode(h('wbr')), false)
        assert.strictEqual(isBreakNode({ type: 'text', value: 'Hello' }), false)
    })
})

describe('isRecursiveNode()', () => {
    it('should correctly identify recursive nodes', () => {
        assert.strictEqual(isRecursiveNode(h('html')), true)
        assert.strictEqual(isRecursiveNode(h('p')), true)
        assert.strictEqual(isRecursiveNode(h('span')), true)
        assert.strictEqual(isRecursiveNode(h('br')), false)
        assert.strictEqual(isRecursiveNode(h('img')), false)
        assert.strictEqual(isRecursiveNode(h('hr')), false)
        assert.strictEqual(isRecursiveNode(h('input')), false)
        assert.strictEqual(isRecursiveNode(h('meta')), false)
        assert.strictEqual(isRecursiveNode(h('link')), false)
        assert.strictEqual(isRecursiveNode(h('area')), false)
        assert.strictEqual(isRecursiveNode(h('base')), false)
        assert.strictEqual(isRecursiveNode(h('col')), false)
        assert.strictEqual(isRecursiveNode(h('embed')), false)
        assert.strictEqual(isRecursiveNode(h('source')), false)
        assert.strictEqual(isRecursiveNode(h('track')), false)
        assert.strictEqual(isRecursiveNode(h('wbr')), false)
        assert.strictEqual(isRecursiveNode({ type: 'text', value: 'Hello' }), false)
    })
})

describe('isStopNode()', () => {
    it('should correctly identify stop element', () => {
        assert.strictEqual(isStopNode(h('html')), false)
        assert.strictEqual(isStopNode(h('p')), false)
        assert.strictEqual(isStopNode(h('span')), false)
        assert.strictEqual(isStopNode(h('br')), false)
        assert.strictEqual(isStopNode(h('img')), true)
        assert.strictEqual(isStopNode(h('hr')), true)
        assert.strictEqual(isStopNode(h('input')), true)
        assert.strictEqual(isStopNode(h('meta')), true)
        assert.strictEqual(isStopNode(h('link')), true)
        assert.strictEqual(isStopNode(h('area')), true)
        assert.strictEqual(isStopNode(h('base')), true)
        assert.strictEqual(isStopNode(h('col')), true)
        assert.strictEqual(isStopNode(h('embed')), true)
        assert.strictEqual(isStopNode(h('source')), true)
        assert.strictEqual(isStopNode(h('track')), true)
        assert.strictEqual(isStopNode(h('wbr')), true)
        assert.strictEqual(isStopNode({ type: 'text', value: 'Hello' }), false)
    })
})

describe('getDefaultTrimChildrenOptions()', () => {
    it('should return default options', () => {
        const options: TrimChildrenOptions = hast.getDefaultTrimChildrenOptions()
        assert.deepStrictEqual(options, {
            trimExistingEmptyText: true,
            trimExistingEmptyNode: true,
            trimBecameEmptyNode: true,
            trimDirection: ['start', 'end'],
            startFilter: {
                trimTextMatcher: /^\s+/u,
                trimTextMatcherOnce: /^\s+/u,
                trimNodeMatcher: isBreakNode,
                stopNodeMatcher: isStopNode,
                recursiveNodeMatcher: isRecursiveNode,
                actions: []
            },
            endFilter: {
                trimTextMatcher: /\s+$/u,
                trimTextMatcherOnce: /\s+$/u,
                trimNodeMatcher: isBreakNode,
                stopNodeMatcher: isStopNode,
                recursiveNodeMatcher: isRecursiveNode,
                actions: []
            }
        })
    })
})

describe('trimChildren() with Hast utilities', () => {
    const defaultTrimChildrenOptions: TrimChildrenOptions = hast.getDefaultTrimChildrenOptions()
    it('should trim break element', () => {
        {
            const e = h('p', [h('br')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', []))
        } {
            const e = h('p', ['test-test', h('br')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', ['test-test']))
        }
    })
    it('should trim multiple break elements', () => {
        const e = h('p', ['test-test', h('br'), h('br')])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, h('p', ['test-test']))
    })
    it('should trim leading break elements', () => {
        const e = h('p', [h('br'), 'test-test'])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, h('p', ['test-test']))
    })
    it('should trim multiple leading break elements', () => {
        const e = h('p', [h('br'), h('br'), 'test-test'])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, h('p', ['test-test']))
    })
    it('should trim surrounding break elements', () => {
        const e = h('p', [h('br'), 'test-test', h('br')])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, h('p', ['test-test']))
    })
    it('should trim empty text nodes', () => {
        {
            const e = h('p', [h('span', ['test-test']), '     '])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('span', ['test-test'])]))
        }
        {
            const e = h('p', [h('span', ['test-test']), 'TEST  '])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('span', ['test-test']), 'TEST']))
        }
    })
    it('should trim leading empty text nodes', () => {
        {
            const e = h('p', ['     ', h('span', ['test-test'])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('span', ['test-test'])]))
        }
        {
            const e = h('p', ['  TEST', h('span', ['test-test'])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', ['TEST', h('span', ['test-test'])]))
        }
    })
    it('should trim surrounding empty text nodes', () => {
        {
            const e = h('p', ['     ', h('span', ['test-test']), '     '])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('span', ['test-test'])]))
        }
        {
            const e = h('p', ['  TEST', h('span', ['test-test']), 'TEST  '])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', ['TEST', h('span', ['test-test']), 'TEST']))
        }
    })
    it('should trim surrounding empty text nodes with em element', () => {
        {
            const e = h('p', [h('em', ['     ']), h('text', 'test-test'), h('em', ['     '])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('text', 'test-test')]))
        }
        {
            const e = h('p', [h('em', ['  TEST']), h('text', 'test-test'), h('em', ['TEST  '])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('em', ['TEST']), h('text', 'test-test'), h('em', ['TEST'])]))
        }
    })
    it('should not trim code elements', () => {
        {
            const e = h('p', [h('code', ['  TEST'])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('code', ['  TEST'])]))
        }
        {
            const e = h('p', [h('code', ['  TEST']), 'test-test', h('code', ['TEST  '])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('code', ['  TEST']), 'test-test', h('code', ['TEST  '])]))
        }
        {
            const e = h('p', ['  ', h('code', ['  TEST']), 'test-test', h('code', ['TEST  ']), '  '])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('code', ['  TEST']), 'test-test', h('code', ['TEST  '])]))
        }
    })
    it('should trim empty text', () => {
        const e = h('p', ['', h('br'), h('em', [' ', h('br'), 'test2']), ' test0 test1 ', h('em', ['test3', h('br'), ' ']), h('br'), ''])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, h('p', [h('em', ['test2']), ' test0 test1 ', h('em', ['test3'])]))

    })
    it('should not trim existing empty text', () => {
        const e = h('p', ['', h('br'), h('em', [' ', h('br'), 'test2']), ' test0 test1 ', h('em', ['test3', h('br'), ' ']), h('br'), ''])
        trimChildren(e, {
            ...hast.getDefaultTrimChildrenOptions(),
            trimExistingEmptyText: false,
        })
        assert.deepStrictEqual(e, h('p', ['', h('br'), h('em', [' ', h('br'), 'test2']), ' test0 test1 ', h('em', ['test3', h('br'), ' ']), h('br'), '']))
    })
    it('should trim empty elements', () => {
        const e = h('p', [h('em', []), ' test0 test1 ', h('em', [])])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, h('p', ['test0 test1']))

    })
    it('should not trim empty elements', () => {
        const e = h('p', [h('em', []), ' test0 test1 ', h('em', [])])
        trimChildren(e, {
            ...hast.getDefaultTrimChildrenOptions(),
            trimExistingEmptyNode: false,
        })
        // node を取り除かないだけで、trim は継続される。
        assert.deepStrictEqual(e, h('p', [h('em', []), 'test0 test1', h('em', [])]))
    })
    it('should not trim became empty elements', () => {
        const e = h('p', [h('em', ['  ']), ' test0 test1 ', h('em', ['  '])])
        trimChildren(e, {
            ...hast.getDefaultTrimChildrenOptions(),
            trimBecameEmptyNode: false,
        })
        // node を取り除かないだけで、trim は継続される。
        assert.deepStrictEqual(e, h('p', [h('em', []), 'test0 test1', h('em', [])]))
    })
    it('should trim break elements and whitespace', () => {
        {
            const e = h('p', ['   ', h('br'), h('em', [' ', h('br'), 'test2']), ' test0 test1 ', h('em', ['test3', h('br'), ' ']), h('br'), '   '])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', [h('em', ['test2']), ' test0 test1 ', h('em', ['test3'])]))
        }
        {
            // trimEndChildren() のループで、childrenをすべて処理した場合の確認(i が -1 になる)
            const e = h('p', ['   ', h('br'), h('em', [' ', h('br')]), ' test0 test1 ', h('em', [h('br'), ' ']), h('br'), '   '])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', ['test0 test1']))
        }
    })
    it('should trim various whitespace', () => {
        // https://ja.wikipedia.org/wiki/%E7%A9%BA%E7%99%BD%E6%96%87%E5%AD%97
        const s: { ch: string, comment: string }[] = [
            // { ch: '　', comment: 'U+3000 (全角スペース)' },
            { ch: '\u0009', comment: 'U+0009 (character tabulation)' },
            { ch: '\u000A', comment: 'U+000A (line feed)' },
            { ch: '\u000B', comment: 'U+000B (line tabulation)' },
            { ch: '\u000C', comment: 'U+000C (form feed)' },
            { ch: '\u000D', comment: 'U+000D (carriage return)' },
            { ch: '\u0020', comment: 'U+0020 (space)' },
            // { ch: '\u0085', comment: 'U+0085 (next line)' }, // https://en.wikipedia.org/wiki/C0_and_C1_control_codes#NEL  // EBICDIC 用
            { ch: '\u00A0', comment: 'U+00A0 (no-break space)' },
            { ch: '\u1680', comment: 'U+1680 (ogham space mark)' },
            { ch: '\u2000', comment: 'U+2000 (en quad)' },
            { ch: '\u2001', comment: 'U+2001 (em quad)' },
            { ch: '\u2002', comment: 'U+2002 (en space)' },
            { ch: '\u2003', comment: 'U+2003 (em space)' },
            { ch: '\u2004', comment: 'U+2004 (three-per-em space)' },
            { ch: '\u2005', comment: 'U+2005 (four-per-em space)' },
            { ch: '\u2006', comment: 'U+2006 (six-per-em space)' },
            { ch: '\u2007', comment: 'U+2007 (figure space)' },
            { ch: '\u2008', comment: 'U+2008 (punctuation space)' },
            { ch: '\u2009', comment: 'U+2009 (thin space)' },
            { ch: '\u200A', comment: 'U+200A (hair space)' },
            { ch: '\u2028', comment: 'U+2028 (line separator)' },
            { ch: '\u2029', comment: 'U+2029 (paragraph separator)' },
            { ch: '\u202F', comment: 'U+202F (narrow no-break space)' },
            { ch: '\u205F', comment: 'U+205F (medium mathematical space)' },
            { ch: '\u3000', comment: 'U+3000 (ideographic space)' }
        ]
        for (let i = 0; i < s.length; i++) {
            const e = h('p', [` ${s[i].ch}`, h('em', [` ${s[i].ch}`]), ' test0 test1 ', h('em', [`${s[i].ch} `]), `${s[i].ch} `])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, h('p', ['test0 test1']), s[i].comment)
        }
    })
    it('should trim children directly', () => {
        {
            const e = h('p', [h('em', ['     ']), 'test-test', h('em', ['     '])])
            trimChildren(e.children, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e.children, h('p', ['test-test']).children)
        }
    })
    it('should not trim comment nodes', () => {
        const e = h('p', [{ type: 'comment', value: ' comment1 ' }, ' test-test ', { type: 'comment', value: ' comment2 ' }])
        trimChildren(e, {
            ...hast.getDefaultTrimChildrenOptions(),
        })
        // node を取り除かないだけで、trim は継続される。
        assert.deepStrictEqual(e, h('p', [{ type: 'comment', value: ' comment1 ' }, 'test-test', { type: 'comment', value: ' comment2 ' }]))
    })
})
