# unist-util-trim-element

`Parent` の `children` から先頭と末尾の空白や改行などを削除する unist ユーティリティ.

## Install

```sh
npm install @hankei6km/unist-util-trim-element
```

## Usage

```ts
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { trimChildren } from '../src/index.ts'
import * as mdast from '../src/utils/mdast/index.ts'

const tree = fromMarkdown(`
# test

## 見出し 1

　  **テスト** の行。前後に半角と全角スペースなど。  　

## 見出し 2

　  [  テストのリンク(前後に半角と全角スペースなど)  ](test1.md) あいうえお  　

　  あいうえお [  テストのリンク(前後に半角と全角スペースなど)  ](test1.md)  　

`)

console.log(toMarkdown(tree))

const options = mdast.getDefaultTrimChildrenOptions()
for (const node of tree.children) {
    if (node.type === 'paragraph') {
        trimChildren(node, options)
    }
}

console.log(toMarkdown(tree))
```

yield:

```md
# test

## 見出し 1

　  **テスト** の行。前後に半角と全角スペースなど。  　

## 見出し 2

　  [  テストのリンク(前後に半角と全角スペースなど)  ](test1.md) あいうえお  　

　  あいうえお [  テストのリンク(前後に半角と全角スペースなど)  ](test1.md)  　

# test

## 見出し 1

**テスト** の行。前後に半角と全角スペースなど。

## 見出し 2

[テストのリンク(前後に半角と全角スペースなど)  ](test1.md) あいうえお

あいうえお [  テストのリンク(前後に半角と全角スペースなど)](test1.md)
```

## API

### `trimChildren(parent, options)`

`children` 内の先頭または末尾の空白や改行を削除する。`parent` は `unist` の `Parent` ノード。または `Parent['children']` 配列を直接指定。

#### `options.trimExistingEmptyText`

`children` 内の子ノードをトリムする際に、既に空のテキストノード(`{"type": "text", "value": ""}`)もトリムするか？しない場合はそこで処理を停止する。

#### `options.trimExistingEmptyNode`

`children` 内の子ノードをトリムする際に、既に空の要素もトリムするか？しない場合は空の要素を残して処理を継続する。

#### `options.trimBecameEmptyNode`

`children` 内の子ノードをトリムする際に、再帰的なトリムにより空になった要素もトリムするか？しない場合は空の要素を残して処理を継続する。

#### `options.trimDirection`

`children` 内をトリムするときの順番を、`start` と `end` の配列で指定する

#### `options.startFilter`

`children` 内の先頭からトリムする際に、挙動をカスタマイズするためのフィルター。

##### `startFilter` のフィールド

- `trimTextMatcher`: 先頭のテキストノードからトリムするテキストを決定するマッチャー。
- `trimTextMatcherOnce`: 先頭のテキストノードからトリムするテキストを決定するマッチャー(処理開始後の最初の 1 回だけ使用)。
- `trimNodeMatcher`: 先頭からトリムするノードを決定するマッチャー、`null` で全て無視(`unist-util-is` の [`Test`](https://github.com/syntax-tree/unist-util-is#test) を指定、以降の NodeMatcher も同様)。
- `stopNodeMatcher`: 先頭からのトリムを停止するかを決定するマッチャー、`null` で全て無視。
- `recursiveNodeMatcher`: 先頭からのトリムを再帰的に適用するかを決定するマッチャー、`null` で全て無視。
- `actions` : 先頭からのトリム処理をカスタマイズする関数の配列。

#### `options.endFilter`

`children` 内の末尾からトリムする際に、挙動をカスタマイズするためのフィルター。

##### `endFilter` のフィールド

- `trimTextMatcher`: 末尾のテキストノードからトリムするテキストを決定するマッチャー。
- `trimTextMatcherOnce`: 末尾のテキストノードからトリムするテキストを決定するマッチャー(処理開始後の最初の 1 回だけ使用)。
- `trimNodeMatcher`: 末尾からトリムするノードを決定するマッチャー、`null` で全て無視(`unist-util-is` の [`Test`](https://github.com/syntax-tree/unist-util-is#test) を指定、以降の NodeMatcher も同様)。
- `stopNodeMatcher`: 末尾からのトリムを停止するかを決定するマッチャー、`null` で全て無視。
- `recursiveNodeMatcher`: 末尾からのトリムを再帰的に適用するかを決定するマッチャー、`null` で全て無視。
- `actions` : 末尾からのトリム処理をカスタマイズする関数の配列。

## `FilterAction`

`startFilter` または `endFilter` の `actions` に指定する配列の要素の型。

### `FilterAction['do']`

処理対象のノードの情報を渡される。ノードを処理し以降の処理に対する状況を返す。

#### Parameters

- `node` ( `unknown` ) : 処理対象のノード
- `index` ( `number | null` ) : `children` 内のノードのインデックス
- `parent` ( `Parent | null` ) : 親ノード(存在しないときは `null`)
- `options` ( `FilterOptions` ) : フィルターオプション

#### Returns

```ts
| 'trim' // 対象の node を trim (子要素から取り除く)、処理は継続する
| 'pass' // 対象の node を通過、処理は継続する(対象の node の内容は変更されているときもある)
| 'recursive' // 対象の node の子要素に対して再帰的に処理を行う
| 'stop' // filter 処理自体を停止する(対象の node の内容は変更されているときもある)
```

## Utils

### `utils/mdast`

Markdown(mdast)用のユーティリティ関数。

#### `utils/mdast.getDefaultTrimChildrenOptions()`

mdast 用の `trimChildren` のデフォルトオプションを返す。

### `utils/hast`

HTML(hast)用のユーティリティ関数。

#### `utils/hast.getDefaultTrimChildrenOptions()`

hast 用の `trimChildren` のデフォルトオプションを返す。

## License

MIT License

Copyright (c) 2026 hankei6km
