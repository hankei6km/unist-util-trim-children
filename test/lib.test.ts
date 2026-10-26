import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isCommentNode, isParent, isTextNode } from '../src/lib.ts'

describe('isParent()', () => {
    it('should correctly identify parent nodes', () => {
        assert.strictEqual(isParent({ type: 'paragraph', children: [] }), true)
        assert.strictEqual(isParent({ type: 'paragraph' }), false)
        assert.strictEqual(isParent({ type: 'text', value: 'Hello' }), false)
        assert.strictEqual(isParent({ type: 'root', children: [{ type: 'paragraph', children: [] }] }), true)
    })
})

describe('isTextNode()', () => {
    it('should correctly identify text nodes', () => {
        assert.strictEqual(isTextNode({ type: 'text', value: 'Hello' }), true)
        assert.strictEqual(isTextNode({ type: 'text', value: 123 }), false)
        assert.strictEqual(isTextNode({ type: 'paragraph', children: [] }), false)
    })
})

describe('isCommentNode()', () => {
    it('should correctly identify comment nodes', () => {
        assert.strictEqual(isCommentNode({ type: 'comment', value: 'This is a comment' }), true)
        assert.strictEqual(isCommentNode({ type: 'comment', value: 123 }), false)
        assert.strictEqual(isCommentNode({ type: 'paragraph', children: [] }), false)
    })
})
