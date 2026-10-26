import type { Literal, Parent } from 'unist'
import { describe, it, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { u } from 'unist-builder'
import type { Check } from 'unist-util-is'
import { convert } from 'unist-util-is'
import type { FilterAction, TrimChildrenOptions } from '../src/trim.ts'
import { getEndFilterOptions, getStartFilterOptions, trimChildren } from '../src/trim.ts'

describe('trimChildren()', () => {
    afterEach(() => {
        mock.reset()
    })
    const options: TrimChildrenOptions = {
        trimExistingEmptyText: true,
        trimExistingEmptyNode: true,
        trimBecameEmptyNode: true,
        trimDirection: ['start', 'end'],
        startFilter: {
            trimTextMatcher: /^\s+/u, // `String.prototype.trim' は UTF-16 コードポイント列。'v' フラグは es2024 から。
            trimTextMatcherOnce: /^\s+/u,
            trimNodeMatcher: convert('break'),
            stopNodeMatcher: convert('image'),
            recursiveNodeMatcher: convert('delete'),
            actions: []
        },
        endFilter: {
            trimTextMatcher: /^\s+/u, // `String.prototype.trim' は UTF-16 コードポイント列。'v' フラグは es2024 から。
            trimTextMatcherOnce: /^\s+/u,
            trimNodeMatcher: convert('break'),
            stopNodeMatcher: convert('image'),
            recursiveNodeMatcher: convert('delete'),
            actions: []
        }
    }
    it('should trim break nodes', () => {
        const e = u('paragraph', [u('delete', [u('text', '  ')]), u('text', 'test-test'), u('break')])
        trimChildren(e, options)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
    })
    it('should ', () => {
        const e = u('paragraph', [u('delete', [u('text', '  ')]), u('text', 'test-test'), u('break')])
        trimChildren(e, {
            ...options,
            startFilter: {
                ...options.startFilter,
                trimNodeMatcher: null,
                stopNodeMatcher: null,
                recursiveNodeMatcher: null
            },
            endFilter: {
                ...options.endFilter,
                trimNodeMatcher: null,
                stopNodeMatcher: null,
                recursiveNodeMatcher: null
            }
        })
        assert.deepStrictEqual(e, u('paragraph', [u('delete', [u('text', '  ')]), u('text', 'test-test'), u('break')]))
    })
    it('should trim children directly', () => {
        const e = u('paragraph', [u('delete', [u('text', '  ')]), u('text', 'test-test'), u('break')])
        trimChildren(e.children, options)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
    })
    it('should pass parent node to matchers', () => {
        {
            const e = u('paragraph', [u('text', '  '), u('break'), u('break'), u('text', 'test-test'), u('break'), u('break'), u('text', '  ')])
            const startFilter = {
                ...options.startFilter,
                trimNodeMatcher: mock.fn(options.startFilter.trimNodeMatcher as unknown as Check),
                stopNodeMatcher: mock.fn(options.startFilter.stopNodeMatcher as unknown as Check)
            }
            const endFilter = {
                ...options.endFilter,
                trimNodeMatcher: mock.fn(options.endFilter.trimNodeMatcher as unknown as Check),
                stopNodeMatcher: mock.fn(options.endFilter.stopNodeMatcher as unknown as Check)
            }
            trimChildren(e, {
                ...options,
                startFilter,
                endFilter
            })
            assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
            assert.deepStrictEqual(startFilter.trimNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 1, e], // mock.call が保持している引数は浅いコピーなので、trim された parent( chidlren) が返される。
                [{ type: 'break' }, 2, e],
            ])
            assert.deepStrictEqual(startFilter.stopNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 1, e],
                [{ type: 'break' }, 2, e],
            ])
            assert.deepStrictEqual(endFilter.trimNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 2, e], // start(childrenの先頭側)で trim された結果の childrenでの index になる。
                [{ type: 'break' }, 1, e], // endは後ろから処理するため、index は小さくなっていく。
            ])
            assert.deepStrictEqual(endFilter.stopNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 2, e],
                [{ type: 'break' }, 1, e],
            ])
        }
        {
            const e = u('paragraph', [u('text', '  '), u('break'), u('image'), u('break'), u('text', 'test-test'), u('break'), u('image'), u('break'), u('text', '  ')])
            const startFilter = {
                ...options.startFilter,
                trimNodeMatcher: mock.fn(options.startFilter.trimNodeMatcher as unknown as Check),
                stopNodeMatcher: mock.fn(options.startFilter.stopNodeMatcher as unknown as Check)
            }
            const endFilter = {
                ...options.endFilter,
                trimNodeMatcher: mock.fn(options.endFilter.trimNodeMatcher as unknown as Check),
                stopNodeMatcher: mock.fn(options.endFilter.stopNodeMatcher as unknown as Check)
            }
            trimChildren(e, {
                ...options,
                startFilter,
                endFilter
            })
            assert.deepStrictEqual(e, u('paragraph', [u('image'), u('break'), u('text', 'test-test'), u('break'), u('image')]))
            assert.deepStrictEqual(startFilter.trimNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 1, e], // stopNodeMatcher が先に呼ばれるため trimNodeMatcher に対して image node の確認は行なわれない。
            ])
            assert.deepStrictEqual(startFilter.stopNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 1, e],
                [{ type: 'image' }, 2, e],
            ])
            assert.deepStrictEqual(endFilter.trimNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 5, e],
            ])
            assert.deepStrictEqual(endFilter.stopNodeMatcher.mock.calls.map(call => call.arguments), [
                [{ type: 'break' }, 5, e],
                [{ type: 'image' }, 4, e],
            ])
        }
    })
    it('should pass parent node to recursiveNodeMatcher', () => {
        const e = u('paragraph', [
            u('text', '  '),
            u('break'),
            u('delete', [u('break'), u('text', '  '), u('image')]),
            u('break'),
            u('text', 'test-test'),
            u('break'),
            u('delete', [u('image'), u('text', '  '), u('break')]),
            u('break'),
            u('text', '  ')
        ])
        const startFilter = {
            ...options.startFilter,
            trimNodeMatcher: mock.fn(options.startFilter.trimNodeMatcher as unknown as Check),
            stopNodeMatcher: mock.fn(options.startFilter.stopNodeMatcher as unknown as Check),
            recursiveNodeMatcher: mock.fn(options.startFilter.recursiveNodeMatcher as unknown as Check)
        }
        const endFilter = {
            ...options.endFilter,
            trimNodeMatcher: mock.fn(options.endFilter.trimNodeMatcher as unknown as Check),
            stopNodeMatcher: mock.fn(options.endFilter.stopNodeMatcher as unknown as Check),
            recursiveNodeMatcher: mock.fn(options.endFilter.recursiveNodeMatcher as unknown as Check)
        }
        trimChildren(e, {
            ...options,
            startFilter,
            endFilter,
        })
        assert.deepStrictEqual(e, u('paragraph', [u('delete', [u('image')]), u('break'), u('text', 'test-test'), u('break'), u('delete', [u('image')])]))
        {
            const args = startFilter.trimNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 3)
            assert.deepStrictEqual(args[0], [u('break'), 1, e])
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), 2, e])
            assert.deepStrictEqual(args[2], [u('break'), 0, u('delete', [u('image')])]) // 再帰的な処理で parent が変更されている
        }
        {
            const args = startFilter.stopNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 4)
            assert.deepStrictEqual(args[0], [u('break'), 1, e])
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), 2, e])
            assert.deepStrictEqual(args[2], [u('break'), 0, u('delete', [u('image')])])
            assert.deepStrictEqual(args[3], [u('image'), 2, u('delete', [u('image')])])
        }
        {
            const args = startFilter.recursiveNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 1)
            assert.deepStrictEqual(args[0], [u('delete', [u('image')]), 2, e]) // mock.call が保持している引数は浅いコピーなので、trim された delete(children) が返される。実際の call 時は trim されていない
        }
        {
            const args = endFilter.trimNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 3)
            assert.deepStrictEqual(args[0], [u('break'), 5, e])
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), 4, e])
            assert.deepStrictEqual(args[2], [u('break'), 2, u('delete', [u('image')])])
        }
        {
            const args = endFilter.stopNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 4)
            assert.deepStrictEqual(args[0], [u('break'), 5, e])
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), 4, e])
            assert.deepStrictEqual(args[2], [u('break'), 2, u('delete', [u('image')])])
            assert.deepStrictEqual(args[3], [u('image'), 0, u('delete', [u('image')])])
        } {
            const args = endFilter.recursiveNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 1)
            assert.deepStrictEqual(args[0], [u('delete', [u('image')]), 4, e]) // mock.call が保持している引数は浅いコピーなので、trim された delete(children) が返される。実際の call 時は start 側が trim された状態
        }
    })
    it('should pass null to matchers when trimming children directly', () => {
        const e = u('paragraph', [
            u('text', '  '),
            u('break'),
            u('delete', [u('break'), u('text', '  '), u('image')]),
            u('break'),
            u('text', 'test-test'),
            u('break'),
            u('delete', [u('image'), u('text', '  '), u('break')]),
            u('break'),
            u('text', '  ')
        ])
        const startFilter = {
            ...options.startFilter,
            trimNodeMatcher: mock.fn(options.startFilter.trimNodeMatcher as unknown as Check),
            stopNodeMatcher: mock.fn(options.startFilter.stopNodeMatcher as unknown as Check),
            recursiveNodeMatcher: mock.fn(options.startFilter.recursiveNodeMatcher as unknown as Check)
        }
        const endFilter = {
            ...options.endFilter,
            trimNodeMatcher: mock.fn(options.endFilter.trimNodeMatcher as unknown as Check),
            stopNodeMatcher: mock.fn(options.endFilter.stopNodeMatcher as unknown as Check),
            recursiveNodeMatcher: mock.fn(options.endFilter.recursiveNodeMatcher as unknown as Check)
        }
        trimChildren(e.children, {
            ...options,
            startFilter,
            endFilter,
        })
        assert.deepStrictEqual(e, u('paragraph', [u('delete', [u('image')]), u('break'), u('text', 'test-test'), u('break'), u('delete', [u('image')])]))
        {
            const args = startFilter.trimNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 3)
            assert.deepStrictEqual(args[0], [u('break'), null, null]) // parent がない場合は null が渡される
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), null, null])
            assert.deepStrictEqual(args[2], [u('break'), 0, u('delete', [u('image')])]) // 再帰的な処理で parent が変更されている
        }
        {
            const args = startFilter.stopNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 4)
            assert.deepStrictEqual(args[0], [u('break'), null, null])
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), null, null])
            assert.deepStrictEqual(args[2], [u('break'), 0, u('delete', [u('image')])])
            assert.deepStrictEqual(args[3], [u('image'), 2, u('delete', [u('image')])])
        }
        {
            const args = startFilter.recursiveNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 1)
            assert.deepStrictEqual(args[0], [u('delete', [u('image')]), null, null]) // parent がない場合は null が渡される
        }
        {
            const args = endFilter.trimNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 3)
            assert.deepStrictEqual(args[0], [u('break'), null, null])
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), null, null])
            assert.deepStrictEqual(args[2], [u('break'), 2, u('delete', [u('image')])])
        }
        {
            const args = endFilter.stopNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 4)
            assert.deepStrictEqual(args[0], [u('break'), null, null])
            assert.deepStrictEqual(args[1], [u('delete', [u('image')]), null, null])
            assert.deepStrictEqual(args[2], [u('break'), 2, u('delete', [u('image')])])
            assert.deepStrictEqual(args[3], [u('image'), 0, u('delete', [u('image')])])
        }
        {
            const args = endFilter.recursiveNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 1)
            assert.deepStrictEqual(args[0], [u('delete', [u('image')]), null, null])
        }
    })
    it('should trim only the start when trimDirection is ["start"]', () => {
        const e = u('paragraph', [u('break'), u('text', 'test-test'), u('break')])
        trimChildren(e, {
            ...options,
            trimDirection: ['start'] // end 側の trim を行わない場合、end の break は trim されない。
        })
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test'), u('break')]))
    })
    it('should trim only the end when trimDirection is ["end"]', () => {
        const e = u('paragraph', [u('break'), u('text', 'test-test'), u('break')])
        trimChildren(e, {
            ...options,
            trimDirection: ['end'] // start 側の trim を行わない場合、start の break は trim されない。
        })
        assert.deepStrictEqual(e, u('paragraph', [u('break'), u('text', 'test-test')]))
    })
    it('should trim end to start when trimDirection is ["end", "start"]', () => {
        const e = u('paragraph', [u('break'), u('text', 'test-test'), u('break')])
        const startFilter = {
            ...options.startFilter,
            trimNodeMatcher: mock.fn(options.startFilter.trimNodeMatcher as unknown as Check),
        }
        const endFilter = {
            ...options.endFilter,
            trimNodeMatcher: mock.fn(options.endFilter.trimNodeMatcher as unknown as Check),
        }
        trimChildren(e, {
            ...options,
            trimDirection: ['end', 'start'],
            startFilter,
            endFilter,
        })
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        {
            const args = startFilter.trimNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 1)
            assert.deepStrictEqual(args[0], [u('break'), 0, e])
        }
        {
            const args = endFilter.trimNodeMatcher.mock.calls.map(call => call.arguments)
            assert.deepEqual(args.length, 1)
            assert.deepStrictEqual(args[0], [u('break'), 2, e]) // endから処理するため、この時点でchildrenのstart側は trim されていない(通常は trime されているので index は 1 になる)
        }
    })
    it('should call custom actions with correct arguments', () => {
        const e = u('paragraph', [u('text', '  '), u('text', 'test-test'), u('text', '  ')])
        const startDo = mock.fn<FilterAction['do']>(() => [false])
        const endDo = mock.fn<FilterAction['do']>(() => [false])
        const opts: TrimChildrenOptions = {
            ...options,
            startFilter: {
                ...options.startFilter,
                actions: [{
                    do: startDo
                }]
            },
            endFilter: {
                ...options.endFilter,
                actions: [{
                    do: endDo
                }]
            }
        }
        trimChildren(e, opts)
        assert.deepStrictEqual(e, u('paragraph', [u('text', 'test-test')]))
        assert.deepStrictEqual(startDo.mock.calls.map(call => call.arguments), [
            [u('text', '  '), 0, e, getStartFilterOptions(opts)],
            [u('text', 'test-test'), 1, e, getStartFilterOptions(opts)],
        ])
        assert.deepStrictEqual(endDo.mock.calls.map(call => call.arguments), [
            [u('text', '  '), 1, e, getEndFilterOptions(opts)],
            [u('text', 'test-test'), 0, e, getEndFilterOptions(opts)],
        ])
    })
    it('should trim custom nodes with start and end filters', () => {
        const nodeMatcher = convert({ type: 'foo' } as Literal & { type: 'foo', value: string })
        {
            const e = u('paragraph', [u('foo', '==='), u('break'), u('text', 'test-test'), u('break'), u('foo', '===')])
            trimChildren(e, {
                ...options,
                startFilter: {
                    ...options.startFilter,
                    actions: [{
                        do: (node) => {
                            if (nodeMatcher(node)) {
                                node.value = '='
                                return [true, 'stop']
                            }
                            return [false]
                        }
                    }]
                }
            })
            assert.deepStrictEqual(e, u('paragraph', [u('foo', '='), u('break'), u('text', 'test-test'), u('break'), u('foo', '===')]))
        }
        {
            const e = u('paragraph', [u('foo', '==='), u('break'), u('text', 'test-test'), u('break'), u('foo', '===')])
            trimChildren(e, {
                ...options,
                endFilter: {
                    ...options.endFilter,
                    actions: [{
                        do: (node) => {
                            if (nodeMatcher(node)) {
                                node.value = '='
                                return [true, 'stop']
                            }
                            return [false]
                        }
                    }]
                }
            })
            assert.deepStrictEqual(e, u('paragraph', [u('foo', '==='), u('break'), u('text', 'test-test'), u('break'), u('foo', '=')]))
        }
    })
    it('should throw an error for invalid node type', () => {
        const e = u('text', 'test') as any
        assert.throws(() => trimChildren(e, options), /Invalid node type. Expected Parent or array of children./)
    })
    it('should have a type error when an invalid node is passed', () => {
        const e = u('text', 'test')
        // @ts-expect-error Invalid node type
        const f = () => trimChildren(e, options)
        assert.ok(typeof f === 'function')
    })
})
