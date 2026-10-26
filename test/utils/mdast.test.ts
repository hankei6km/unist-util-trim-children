import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { u } from 'unist-builder'
import type { TrimChildrenOptions } from '../../src/index.ts'
import { isBreakNode, isRecursiveNode, isStopNode } from '../../src/utils/mdast/mdast.ts'
import * as  mdast from '../../src/utils/mdast/index.ts'
import { trimChildren } from '../../src/trim.ts'

describe('isBreakNode()', () => {
    it('should correctly identify break nodes', () => {
        assert.strictEqual(isBreakNode({ type: 'html' }), false)
        assert.strictEqual(isBreakNode({ type: 'paragraph' }), false)
        assert.strictEqual(isBreakNode({ type: 'break' }), true)
        assert.strictEqual(isBreakNode({ type: 'delete' }), false)
        assert.strictEqual(isBreakNode({ type: 'emphasis' }), false)
        assert.strictEqual(isBreakNode({ type: 'footnoteReference' }), false)
        assert.strictEqual(isBreakNode({ type: 'image' }), false)
        assert.strictEqual(isBreakNode({ type: 'imageReference' }), false)
        assert.strictEqual(isBreakNode({ type: 'inlineCode' }), false)
        assert.strictEqual(isBreakNode({ type: 'link' }), false)
        assert.strictEqual(isBreakNode({ type: 'linkReference' }), false)
        assert.strictEqual(isBreakNode({ type: 'strong' }), false)
        assert.strictEqual(isBreakNode({ type: 'text', value: 'Hello' }), false)
    })
})

describe('isRecursiveNode()', () => {
    it('should correctly identify recursive nodes', () => {
        assert.strictEqual(isRecursiveNode({ type: 'html' }), false)
        assert.strictEqual(isRecursiveNode({ type: 'paragraph' }), false) // phrasing でない
        assert.strictEqual(isRecursiveNode({ type: 'break' }), false)
        assert.strictEqual(isRecursiveNode({ type: 'delete' }), true)
        assert.strictEqual(isRecursiveNode({ type: 'emphasis' }), true)
        assert.strictEqual(isRecursiveNode({ type: 'footnoteReference' }), false)
        assert.strictEqual(isRecursiveNode({ type: 'image' }), false)
        assert.strictEqual(isRecursiveNode({ type: 'imageReference' }), false)
        assert.strictEqual(isRecursiveNode({ type: 'inlineCode' }), false)
        assert.strictEqual(isRecursiveNode({ type: 'link' }), true)
        assert.strictEqual(isRecursiveNode({ type: 'linkReference' }), false)
        assert.strictEqual(isRecursiveNode({ type: 'strong' }), true)
        assert.strictEqual(isRecursiveNode({ type: 'text', value: 'Hello' }), false)
    })
})

describe('isStopNode()', () => {
    it('should correctly identify stop nodes', () => {
        assert.strictEqual(isStopNode({ type: 'html' }), true)
        assert.strictEqual(isStopNode({ type: 'paragraph' }), true)
        assert.strictEqual(isStopNode({ type: 'break' }), false)
        assert.strictEqual(isStopNode({ type: 'delete' }), false)
        assert.strictEqual(isStopNode({ type: 'emphasis' }), false)
        assert.strictEqual(isStopNode({ type: 'footnoteReference' }), true)
        assert.strictEqual(isStopNode({ type: 'image' }), true)
        assert.strictEqual(isStopNode({ type: 'imageReference' }), true)
        assert.strictEqual(isStopNode({ type: 'inlineCode' }), true)
        assert.strictEqual(isStopNode({ type: 'link' }), false)
        assert.strictEqual(isStopNode({ type: 'linkReference' }), true)
        assert.strictEqual(isStopNode({ type: 'strong' }), false)
        assert.strictEqual(isStopNode({ type: 'text', value: 'Hello' }), false)
    })
})

describe('getDefaultTrimChildrenOptions()', () => {
    it('should return default options', () => {
        const options: TrimChildrenOptions = mdast.getDefaultTrimChildrenOptions()
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
                trimTextMatcherOnce: /(\s+)$|(\s*\\)$/u,
                trimNodeMatcher: isBreakNode,
                stopNodeMatcher: isStopNode,
                recursiveNodeMatcher: isRecursiveNode,
                actions: []
            }
        })
    })
})

describe('trimChildren() with Mdast utilities', () => {
    const defaultTrimChildrenOptions: TrimChildrenOptions = mdast.getDefaultTrimChildrenOptions()
    it('should trim break nodes', () => {
        {
            const e = u('paragraph', [u('break')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', []))
        } {
            const e = u('paragraph', [u('text', 'test-test'), u('break')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        }
    })
    it('should trim multiple break nodes', () => {
        // これは  'mdast-util-from-markdown' で `\\n\` のとき同じはず
        const e = u('paragraph', [u('text', 'test-test'), u('break'), u('break')])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
    })
    it('should trim leading break nodes', () => {
        const e = u('paragraph', [u('break'), u('text', 'test-test')])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
    })
    it('should trim multiple leading break nodes', () => {
        const e = u('paragraph', [u('break'), u('break'), u('text', 'test-test')])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
    })
    it('should trim surrounding break nodes', () => {
        const e = u('paragraph', [u('break'), u('text', 'test-test'), u('break')])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
    })
    it('should trim empty text nodes', () => {
        {
            const e = u('paragraph', [u('text', 'test-test'), u('text', '     ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        }
        {
            const e = u('paragraph', [u('text', 'test-test'), u('text', 'TEST  ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test'), u('text', 'TEST')]))
        }
    })
    it('should trim leading empty text nodes', () => {
        {
            const e = u('paragraph', [u('text', '     '), u('text', 'test-test')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        }
        {
            const e = u('paragraph', [u('text', '  TEST'), u('text', 'test-test')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'TEST'), u('text', 'test-test')]))
        }
    })
    it('should trim surrounding empty text nodes', () => {
        {
            const e = u('paragraph', [u('text', '     '), u('text', 'test-test'), u('text', '     ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        }
        {
            const e = u('paragraph', [u('text', '  TEST'), u('text', 'test-test'), u('text', 'TEST  ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'TEST'), u('text', 'test-test'), u('text', 'TEST')]))
        }
    })
    it('should trim surrounding empty text nodes with emphasis', () => {
        // mdast-util-from-markdown ではおそらく `*   test-test   *` のようにしても empasis のノードにはならない(`\\*   test-test   \\*`のテキスト扱いだと思う)
        {
            const e = u('paragraph', [u('emphasis', [u('text', '     ')]), u('text', 'test-test'), u('emphasis', [u('text', '     ')])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        }
        {
            const e = u('paragraph', [u('emphasis', [u('text', '  TEST')]), u('text', 'test-test'), u('emphasis', [u('text', 'TEST  ')])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('emphasis', [u('text', 'TEST')]), u('text', 'test-test'), u('emphasis', [u('text', 'TEST')])]))
        }
    })
    it('should not trim inlineCode nodes', () => {
        {
            const e = u('paragraph', [u('inlineCode', [u('text', '  TEST')])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('inlineCode', [u('text', '  TEST')])]))
        }
        {
            const e = u('paragraph', [u('inlineCode', [u('text', '  TEST')]), u('text', 'test-test'), u('inlineCode', [u('text', 'TEST  ')])])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('inlineCode', [u('text', '  TEST')]), u('text', 'test-test'), u('inlineCode', [u('text', 'TEST  ')])]))
        }
        {
            const e = u('paragraph', [u('text', '  '), u('inlineCode', [u('text', '  TEST')]), u('text', 'test-test'), u('inlineCode', [u('text', 'TEST  ')]), u('text', '  ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('inlineCode', [u('text', '  TEST')]), u('text', 'test-test'), u('inlineCode', [u('text', 'TEST  ')])]))
        }
    })
    it('should trim empty text', () => {
        const e = u('paragraph', [u('text', ''), u('break'), u('emphasis', [u('text', ' '), u('break'), u('text', 'test2')]), u('text', ' test0 test1 '), u('emphasis', [u('text', 'test3'), u('break'), u('text', ' ')]), u('break'), u('text', '')])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, u('paragraph', [u('emphasis', [u('text', 'test2')]), u('text', ' test0 test1 '), u('emphasis', [u('text', 'test3')])]))

    })
    it('should not trim existing empty text', () => {
        const e = u('paragraph', [u('text', ''), u('break'), u('emphasis', [u('text', ' '), u('break'), u('text', 'test2')]), u('text', ' test0 test1 '), u('emphasis', [u('text', 'test3'), u('break'), u('text', ' ')]), u('break'), u('text', '')])
        trimChildren(e, {
            ...mdast.getDefaultTrimChildrenOptions(),
            trimExistingEmptyText: false,
        })
        assert.deepStrictEqual(e, u('paragraph', [u('text', ''), u('break'), u('emphasis', [u('text', ' '), u('break'), u('text', 'test2')]), u('text', ' test0 test1 '), u('emphasis', [u('text', 'test3'), u('break'), u('text', ' ')]), u('break'), u('text', '')]))
    })
    it('should trim empty node', () => {
        const e = u('paragraph', [u('emphasis', []), u('text', ' test0 test1 '), u('emphasis', [])])
        trimChildren(e, defaultTrimChildrenOptions)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test0 test1')]))

    })
    it('should not trim empty node', () => {
        const e = u('paragraph', [u('emphasis', []), u('text', ' test0 test1 '), u('emphasis', [])])
        trimChildren(e, {
            ...mdast.getDefaultTrimChildrenOptions(),
            trimExistingEmptyNode: false,
        })
        // node を取り除かないだけで、trim は継続される。
        assert.deepStrictEqual(e, u('paragraph', [u('emphasis', []), u('text', 'test0 test1'), u('emphasis', [])]))
    })
    it('should not trim became empty node', () => {
        const e = u('paragraph', [u('emphasis', [u('text', '  ')]), u('text', ' test0 test1 '), u('emphasis', [u('text', '  ')])])
        trimChildren(e, {
            ...mdast.getDefaultTrimChildrenOptions(),
            trimBecameEmptyNode: false,
        })
        // node を取り除かないだけで、trim は継続される。
        assert.deepStrictEqual(e, u('paragraph', [u('emphasis', []), u('text', 'test0 test1'), u('emphasis', [])]))
    })
    it('should trim break nodes and whitespace', () => {
        {
            const e = u('paragraph', [u('text', '   '), u('break'), u('emphasis', [u('text', ' '), u('break'), u('text', 'test2')]), u('text', ' test0 test1 '), u('emphasis', [u('text', 'test3'), u('break'), u('text', ' ')]), u('break'), u('text', '   ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('emphasis', [u('text', 'test2')]), u('text', ' test0 test1 '), u('emphasis', [u('text', 'test3')])]))
        }
        {
            // trimEndChildren() のループで、childrenをすべて処理した場合の確認(i が -1 になる)
            const e = u('paragraph', [u('text', '   '), u('break'), u('emphasis', [u('text', ' '), u('break')]), u('text', ' test0 test1 '), u('emphasis', [u('break'), u('text', ' ')]), u('break'), u('text', '   ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test0 test1')]))
        }
    })
    it('should trim backslashes at the end', () => {
        {
            const e = u('paragraph', [u('text', 'test-test\\')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        }
        {
            const e = u('paragraph', [u('text', 'test-test'), u('emphasis', [u('text', 'test-test\\')]), u('text', '  ')])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test'), u('emphasis', [u('text', 'test-test\\')])]))
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
            const e = u('paragraph', [u('text', ` ${s[i].ch}`), u('emphasis', [u('text', ` ${s[i].ch}`)]), u('text', ' test0 test1 '), u('emphasis', [u('text', `${s[i].ch} `)]), u('text', `${s[i].ch} `)])
            trimChildren(e, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test0 test1')]), s[i].comment)
        }
    })
    it('should trim children directly', () => {
        {
            const e = u('paragraph', [u('emphasis', [u('text', '     ')]), u('text', 'test-test'), u('emphasis', [u('text', '     ')])])
            trimChildren(e.children, defaultTrimChildrenOptions)
            assert.deepStrictEqual(e.children, [u('text', 'test-test')])
        }
    })
})
