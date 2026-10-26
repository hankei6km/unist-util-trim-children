import type { Node, Parent } from 'unist'
import type { Check } from 'unist-util-is'
import { isCommentNode, isParent, isTextNode } from './lib.ts'

export type TextMatcher = RegExp
export type NodeMatcher = Check

export type TrimDirectionStart = 'start'
export type TrimDirectionEnd = 'end'
export type TrimDirection =
    | [TrimDirectionStart, TrimDirectionEnd]
    | [TrimDirectionStart]
    | [TrimDirectionEnd]
    | [TrimDirectionEnd, TrimDirectionStart]


type FilterState =
    | 'trim' // 対象の node を trim (子要素から取り除く)、処理は継続する
    | 'pass' // 対象の node を通過、処理は継続する(対象の node の内容は変更されているときもある)
    | 'recursive' // 対象の node の子要素に対して再帰的に処理を行う
    | 'stop' // filter 処理自体を停止する(対象の node の内容は変更されているときもある)

export type FilterAction = {
    do: (node: unknown, index: number | null, parent: Parent | null, options: FilterOptions) => [true, FilterState] | [false]
}

export type Filter = {
    trimTextMatcher: TextMatcher | null
    trimTextMatcherOnce: TextMatcher | null
    trimNodeMatcher: NodeMatcher | null
    stopNodeMatcher: NodeMatcher | null
    recursiveNodeMatcher: NodeMatcher | null
    actions: FilterAction[]
}

export type TrimChildrenOptions = {
    trimExistingEmptyText: boolean
    trimExistingEmptyNode: boolean
    trimBecameEmptyNode: boolean
    trimDirection: TrimDirection
    startFilter: Filter
    endFilter: Filter
}

type FilterOptions = {
    filter: Required<Filter>
} & Required<Omit<TrimChildrenOptions, 'startFilter' | 'endFilter'>>

export function getStartFilterOptions(options: TrimChildrenOptions): FilterOptions {
    return {
        filter: {
            trimTextMatcher: options.startFilter.trimTextMatcher,
            trimTextMatcherOnce: options.startFilter.trimTextMatcherOnce,
            trimNodeMatcher: options.startFilter.trimNodeMatcher,
            stopNodeMatcher: options.startFilter.stopNodeMatcher,
            recursiveNodeMatcher: options.startFilter.recursiveNodeMatcher,
            actions: options.startFilter.actions
        },
        trimExistingEmptyText: options.trimExistingEmptyText,
        trimExistingEmptyNode: options.trimExistingEmptyNode,
        trimBecameEmptyNode: options.trimBecameEmptyNode,
        trimDirection: options.trimDirection
    }
}
export function getEndFilterOptions(options: TrimChildrenOptions): FilterOptions {
    return {
        filter: {
            trimTextMatcher: options.endFilter.trimTextMatcher,
            trimTextMatcherOnce: options.endFilter.trimTextMatcherOnce,
            trimNodeMatcher: options.endFilter.trimNodeMatcher,
            stopNodeMatcher: options.endFilter.stopNodeMatcher,
            recursiveNodeMatcher: options.endFilter.recursiveNodeMatcher,
            actions: options.endFilter.actions
        },
        trimExistingEmptyText: options.trimExistingEmptyText,
        trimExistingEmptyNode: options.trimExistingEmptyNode,
        trimBecameEmptyNode: options.trimBecameEmptyNode,
        trimDirection: options.trimDirection
    }
}

function isMatcherMatch(matcher: NodeMatcher | null, value: unknown, index: number | null, parent: Parent | null): boolean {
    if (matcher === null) {
        return false
    }
    return matcher(value, parent !== null ? index : null, parent)
}

function filterNode<TNode extends Node>(n: TNode, index: number | null, parent: Parent | null, options: FilterOptions, once: boolean): FilterState {
    for (const action of options.filter.actions) {
        const [match, state] = action.do(n, index !== null ? index : null, parent, options)
        if (match) {
            return state
        }
    }
    let filterState: FilterState = 'stop'
    if (isTextNode(n)) {
        if (n.value.length === 0) {  // value が 0 は fromHtml などでは存在しなさそうだが、手動で作ることはできる。
            if (options.trimExistingEmptyText) {
                // 空の text node は trim する。
                filterState = 'trim'
            }
        } else {
            const trimTextMatcher = once ? options.filter.trimTextMatcherOnce : options.filter.trimTextMatcher
            if (trimTextMatcher instanceof RegExp) {
                const v = n.value.replace(trimTextMatcher, '')
                if (v.length === 0) {
                    // value が置き換わるが trim されるで変更はしない。
                    // (新しい children でこの element はなくなる)
                    filterState = 'trim'
                } else if (v.length !== n.value.length) {
                    // element 自体は trim されないが、value は置き換わる。
                    // なお、children 操作のループを抜けるとき、この element は変更された状態で残す。
                    filterState = 'stop'
                    n.value = v
                }
            }
        }
    } else if (isCommentNode(n)) {
        // コメントは trim しない、pass で残して継続する(doctypeは？)
        filterState = 'pass'
    } else {
        if (!(isMatcherMatch(options.filter.stopNodeMatcher, n, index, parent))) {
            if (isMatcherMatch(options.filter.trimNodeMatcher, n, index, parent)) {
                filterState = 'trim'
            }
            if (filterState === 'stop' && isParent(n)) {
                if (n.children.length === 0) {
                    if (options.trimExistingEmptyNode) {
                        // 空の element は trim する。
                        filterState = 'trim'
                    } else {
                        // 空の element は trim しない、pass で残して継続する
                        filterState = 'pass'
                    }
                } else if (n.children.length > 0 && isMatcherMatch(options.filter.recursiveNodeMatcher, n, index, parent)) {
                    // 再帰的に trim するが、lead/trail で処理が異なる(再帰に利用する関数が異なる)ため、呼び出しもとにまかせる。
                    filterState = 'recursive'
                }
            }
        }
    }
    return filterState
}

function trimStartChildren(children: Node[], node: Node | null, options: FilterOptions, first: boolean): void {
    if (node === null || isParent(node)) {
        const once = first
        const trimmedChildren: Node[] = []
        let filterState: FilterState = 'trim'
        let i = 0
        for (; i < children.length; i++) {
            const n = children[i]
            filterState = filterNode(n, i, node, options, once)
            if (filterState === 'recursive' && isParent(n)) { // 'recursive' は parent の場合のみだが、型ガードのため再判定(冗長)
                filterState = 'stop'
                trimStartChildren(n.children, n, options, false)
                if (n.children.length === 0) {
                    if (options.trimBecameEmptyNode) {
                        // 再帰的に trim された結果、子要素が空になった場合、要素も trim する。
                        filterState = 'trim'
                    } else {
                        // 要素は trim しない、pass で残して継続する
                        filterState = 'pass'
                    }
                }
            }
            if (filterState === 'pass') {
                trimmedChildren.push(n)
            } else if (filterState === 'stop') {
                trimmedChildren.push(n)
                break
            }
        }
        //children = [...trimmedChildren, ...children.slice(i + 1)]
        children.splice(0, i + 1 < children.length ? i + 1 : children.length, ...trimmedChildren)
    }
    return
}

function trimEndChildren(children: Node[], node: Node | null, options: FilterOptions, first: boolean): void {
    if (node === null || isParent(node)) {
        const once = first
        const trimmedChildren: Node[] = []
        let filterState: FilterState = 'trim'
        let i = children.length - 1
        for (; i >= 0; i--) {
            const n = children[i]
            filterState = filterNode(n, i, node, options, once)
            if (filterState === 'recursive' && isParent(n)) {
                filterState = 'stop'
                trimEndChildren(n.children, n, options, false)
                if (n.children.length === 0) {
                    if (options.trimBecameEmptyNode) {
                        // 再帰的に trim された結果、子要素が空になった場合、要素も trim する。
                        filterState = 'trim'
                    } else {
                        // 要素は trim しない、pass で残して継続する
                        filterState = 'pass'
                    }
                }
            }
            if (filterState === 'pass') {
                trimmedChildren.push(n)
            } else if (filterState === 'stop') {
                trimmedChildren.push(n)
                break
            }
        }
        //children = [...children.slice(0, i < 0 ? 0 : i), ...trimmedChildren.reverse()]
        //children.splice(0, children.length, ...[...children.slice(0, i < 0 ? 0 : i), ...trimmedChildren.reverse()])
        children.splice(i < 0 ? 0 : i, children.length - (i < 0 ? 0 : i), ...trimmedChildren.reverse())
    }
    return
}
function trimChidrenDirection(children: Node[], node: Node | null, trimDirection: TrimDirection, startFilter: FilterOptions, endFilter: FilterOptions): void {
    if (trimDirection.length === 2) {
        if (trimDirection[0] === 'start' && trimDirection[1] === 'end') {
            trimStartChildren(
                children,
                node,
                startFilter,
                true
            )
            trimEndChildren(
                children,
                node,
                endFilter,
                true
            )
        } else if (trimDirection[0] === 'end' && trimDirection[1] === 'start') {
            trimEndChildren(
                children,
                node,
                endFilter,
                true
            )
            trimStartChildren(
                children,
                node,
                startFilter,
                true
            )
        }
    } else if (trimDirection.length === 1) {
        if (trimDirection[0] === 'start') {
            trimStartChildren(
                children,
                node,
                startFilter,
                true
            )
        } else if (trimDirection[0] === 'end') {
            trimEndChildren(
                children,
                node,
                endFilter,
                true
            )
        }
    }
}
export function trimChildren<TNode extends Parent | Parent['children']>(node: TNode, options: TrimChildrenOptions): void {
    if (isParent(node)) {
        trimChidrenDirection(
            node.children,
            node,
            options.trimDirection,
            getStartFilterOptions(options),
            getEndFilterOptions(options)
        )
    } else if (Array.isArray(node)) {
        trimChidrenDirection(
            node,
            null,
            options.trimDirection,
            getStartFilterOptions(options),
            getEndFilterOptions(options)
        )
    } else {
        throw new Error('Invalid node type. Expected Parent or array of children.')
    }
}
