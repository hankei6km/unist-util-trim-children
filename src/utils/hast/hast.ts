import type { TrimChildrenOptions } from '../../trim.ts'
import { convertElement } from 'hast-util-is-element'
import { isTextNode } from '../../lib.ts'

const stopNode = [
    'img', 'code', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'
]
const excludeFromPhrasing = convertElement(stopNode)

//const htmlNode: Pick<Html, 'type'> = {
//    type: 'html',
//}
//const isHtmlNode = convertElement(htmlNode)
export interface Test {
    aa: string
}
const isBreak = convertElement('br')
export function isBreakNode(node: unknown) {
    return isBreak(node)
}

export function isRecursiveNode(node: unknown): boolean {
    return !excludeFromPhrasing(node) && !isBreakNode(node) && !isTextNode(node) //&& phrasing(node) // && isParent(node)
}

export function isStopNode(node: unknown): boolean {
    return excludeFromPhrasing(node) //|| !phrasing(node)
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
            trimTextMatcherOnce: /\s+$/u,
            trimNodeMatcher: isBreakNode,
            stopNodeMatcher: isStopNode,
            recursiveNodeMatcher: isRecursiveNode,
            actions: []
        }
    }
}

