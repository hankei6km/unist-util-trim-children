import type { Literal, Parent } from 'unist'
import { convert } from 'unist-util-is'

export function isParent(node: unknown): node is Parent {
    return typeof node === 'object' && node !== null && 'children' in node && Array.isArray((node as Parent).children)
}

const isText = convert('text')
export function isTextNode(node: unknown): node is Literal & Text & { value: string } {
    if (isText(node)) {
        return typeof (node as Literal).value === 'string'
    }
    return false
}

const isComment = convert('comment')
export function isCommentNode(node: unknown): node is Literal & { type: 'comment', value: string } {
    if (isComment(node)) {
        return typeof (node as Literal).value === 'string'
    }
    return false
}
