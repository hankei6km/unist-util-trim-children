import type {
    FootnoteReference,
    Image,
    ImageReference,
    InlineCode,
    LinkReference,
    Html,
    Break,
    // Text,
} from 'mdast'
import type { TrimChildrenOptions } from '../../trim.ts'
import { convert } from 'unist-util-is'
import { phrasing } from 'mdast-util-phrasing'
import { isTextNode } from '../../lib.ts'

const stopNode: [
    Pick<FootnoteReference, 'type'>,
    Pick<Image, 'type'>,
    Pick<ImageReference, 'type'>,
    Pick<InlineCode, 'type'>,
    Pick<LinkReference, 'type'>,
] = [{
    type: 'footnoteReference',
}, {
    type: 'image',
}, {
    type: 'imageReference',
}, {
    type: 'inlineCode',
}, {
    type: 'linkReference',
}]
const excludeFromPhrasing = convert(stopNode)

const htmlNode: Pick<Html, 'type'> = {
    type: 'html',
}
const isHtmlNode = convert(htmlNode)

const isBreak = convert('break')
export function isBreakNode(node: unknown): node is Break {
    return isBreak(node)
}

export function isRecursiveNode(node: unknown): boolean {
    return !isHtmlNode(node) && !excludeFromPhrasing(node) && !isBreakNode(node) && !isTextNode(node) && phrasing(node) // && isParent(node)
}

export function isStopNode(node: unknown): boolean {
    return isHtmlNode(node) || excludeFromPhrasing(node) || !phrasing(node)
}

export function getDefaultTrimChildrenOptions(): TrimChildrenOptions {
    return {
        trimExistingEmptyText: true,
        trimExistingEmptyNode: true,
        trimBecameEmptyNode: true,
        trimDirection: ['start', 'end'],
        startFilter: {
            trimTextMatcher: /^\s+/u, // `String.prototype.trim' は UTF-16 コードポイント列。'v' フラグは es2024 から。
            trimTextMatcherOnce: /^\s+/u,
            trimNodeMatcher: isBreakNode,
            stopNodeMatcher: isStopNode,
            recursiveNodeMatcher: isRecursiveNode,
            actions: []
        },
        endFilter: {
            trimTextMatcher: /\s+$/u, // `String.prototype.trim' は UTF-16 コードポイント列。'v' フラグは es2024 から。
            trimTextMatcherOnce: /(\s+)$|(\s*\\)$/u, // 末尾にバックスがッシュが残ることがある https://github.github.com/gfm/#example-669
            trimNodeMatcher: isBreakNode,
            stopNodeMatcher: isStopNode,
            recursiveNodeMatcher: isRecursiveNode,
            actions: []
        }
    }
}
