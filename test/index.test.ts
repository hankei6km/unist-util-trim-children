import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Literal } from 'unist'
import { convert } from 'unist-util-is'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { convertElement } from 'hast-util-is-element'
import { fromHtml } from 'hast-util-from-html'
import { toHtml } from 'hast-util-to-html'
import type { FilterAction } from '../src/index.ts'
import { trimChildren } from '../src/index.ts'
import * as mdast from '../src/utils/mdast/index.ts'
import * as hast from '../src/utils/hast/index.ts'

describe('trimChildren', () => {
    it('should correctly trim children(markdown)', () => {
        const markdown = `
# test

## heading 1

 line1\\
line2　\\

## heading 2

line3\\
\`line4  \`

## heading 3

line5\\
[link text  ](test1.md)
[  ](test2.md)
`
        const isParagraph = convert('paragraph')
        const tree = fromMarkdown(markdown)
        for (const node of tree.children) {
            if (isParagraph(node)) {
                trimChildren(node, mdast.getDefaultTrimChildrenOptions())
            }
        }
        const result = toMarkdown(tree)
        // t.assert.snapshot(result)
        assert.strictEqual(result, `# test

## heading 1

line1\\
line2

## heading 2

line3\\
\`line4  \`

## heading 3

line5\\
[link text](test1.md)
`)
    })
    it('should correctly trim children(html)', () => {
        const html = `
<h1>test</h1>

<h2>heading 1</h2>

<p>line1<br>line2　<br>

</p>

<h2>heading 2</h2>

<p>line3<br><code>line4  </code></p>

<h2>heading 3</h2>

<p>line5<br>
<a href="test1.md">link text  </a>
<a href="test2.md">  </a></p>
`
        const isParagraph = convertElement('p')
        const tree = fromHtml(html, { fragment: true })
        for (const node of tree.children) {
            if (isParagraph(node)) {
                trimChildren(node, hast.getDefaultTrimChildrenOptions())
            }
        }
        const result = toHtml(tree)
        // t.assert.snapshot(result)
        assert.strictEqual(result, `
<h1>test</h1>

<h2>heading 1</h2>

<p>line1<br>line2</p>

<h2>heading 2</h2>

<p>line3<br><code>line4  </code></p>

<h2>heading 3</h2>

<p>line5<br>
<a href="test1.md">link text</a></p>
`)
    })
    it('should correctly trim children(markdown with BR elements)', () => {
        const markdown = `
# test

## heading 1

 line1\\
line2<Br>

## heading 2

<br>line3\\
\`line4  \`<br><br>

## heading 3

line5\\
[link text  ](test1.md) <a href="test2.md">  </a>
`
        const isParagraph = convert('paragraph')
        const tree = fromMarkdown(markdown)

        const htmlNodeMatcher = convert({ type: 'html' } as Literal & { type: 'html', value: string })
        const breakElementMatcher = convertElement('br')
        const htmlAction: FilterAction['do'] = (node: unknown) => {
            if (htmlNodeMatcher(node)) {
                const htmlTree = fromHtml(node.value, { fragment: true })
                if (htmlTree.children.length === 1 && breakElementMatcher(htmlTree.children[0])) {
                    return [true, 'trim']
                }
            }
            return [false]
        }
        const options = hast.getDefaultTrimChildrenOptions()
        for (const node of tree.children) {
            if (isParagraph(node)) {
                trimChildren(node, {
                    ...options,
                    startFilter: {
                        ...options.startFilter,
                        actions: [{
                            do: htmlAction
                        }]
                    },
                    endFilter: {
                        ...options.endFilter,
                        actions: [{
                            do: htmlAction
                        }]
                    }
                })
            }
        }
        const result = toMarkdown(tree)
        // t.assert.snapshot(result)
        assert.strictEqual(result, `# test

## heading 1

line1\\
line2

## heading 2

line3\\
\`line4  \`

## heading 3

line5\\
[link text  ](test1.md) <a href="test2.md">  </a>
`)
    })
})
