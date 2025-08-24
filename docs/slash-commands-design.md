# スラッシュコマンド機能 設計書

## 概要

Claude Codeのスラッシュコマンド機能を参考に、next-yuiにコマンド機能を実装します。ユーザーが入力欄で`/`で始まるコマンドを入力することで、特定の操作を実行できます。

## 要件

### 機能要件

1. **コマンド検知**: 入力が`/`で始まる場合、コマンドとして認識
2. **コマンド実行**: 定義されたコマンドの処理を実行
3. **自動補完**: コマンド入力中のサジェスト表示
4. **エラーハンドリング**: 存在しないコマンドの適切な処理
5. **拡張性**: 新しいコマンドの追加が容易

### 非機能要件

1. **レスポンス性**: コマンド実行は即座に反応
2. **直感性**: わかりやすいコマンド名と動作
3. **一貫性**: 既存のUI/UXとの整合性

## 実装するコマンド

### Phase 1: 基本コマンド

| コマンド | 説明 | 動作 | ショートカット相当 |
|---------|------|------|------------------|
| `/clear` | 会話履歴をクリア | 現在の会話セッションを削除 | Ctrl+K |
| `/help` | ヘルプを表示 | 利用可能なコマンドの一覧表示 | - |
| `/about` | YUIについて | YUIの情報と機能説明 | - |

### Phase 2: 拡張コマンド（将来実装）

| コマンド | 説明 | 動作 |
|---------|------|------|
| `/save` | 会話を保存 | 現在の会話をローカルストレージに保存 |
| `/load` | 会話を読込 | 保存された会話を読み込み |
| `/export` | 会話をエクスポート | 会話履歴をJSON/Markdownで出力 |
| `/theme` | テーマ切替 | ダーク/ライトテーマの切り替え |
| `/sound` | 音響切替 | タイプ音のオン/オフ |

## アーキテクチャ設計

### 1. コマンドパーサー

```typescript
interface SlashCommand {
  name: string
  description: string
  execute: (args: string[], context: ChatContext) => Promise<void>
  aliases?: string[]
  hidden?: boolean
}

interface ChatContext {
  clearSession: () => Promise<void>
  addSystemMessage: (message: string) => void
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  // その他必要なコンテキスト
}
```

### 2. コマンド登録システム

```typescript
class SlashCommandManager {
  private commands = new Map<string, SlashCommand>()
  
  register(command: SlashCommand): void
  execute(input: string, context: ChatContext): Promise<boolean>
  getSuggestions(partial: string): SlashCommand[]
  isCommand(input: string): boolean
}
```

### 3. UI統合

```typescript
interface CommandSuggestion {
  command: SlashCommand
  highlight: string
  description: string
}

// YuiChat.tsx内での統合
const handleInputChange = (value: string) => {
  if (commandManager.isCommand(value)) {
    const suggestions = commandManager.getSuggestions(value)
    setCommandSuggestions(suggestions)
    setShowSuggestions(true)
  } else {
    setShowSuggestions(false)
  }
}
```

## 実装詳細

### ファイル構成

```
src/
├── lib/
│   ├── commands/
│   │   ├── index.ts              # CommandManagerのエクスポート
│   │   ├── CommandManager.ts     # コマンド管理クラス
│   │   ├── commands/
│   │   │   ├── clear.ts          # /clearコマンド
│   │   │   ├── help.ts           # /helpコマンド
│   │   │   └── about.ts          # /aboutコマンド
│   │   └── types.ts              # 型定義
│   └── ...
├── components/
│   ├── CommandSuggestions.tsx    # コマンドサジェストUI
│   ├── YuiChat.tsx              # メインチャット（コマンド統合）
│   └── ...
└── ...
```

### コマンド実装例

#### /clear コマンド

```typescript
// src/lib/commands/commands/clear.ts
import type { SlashCommand, ChatContext } from '../types'

export const clearCommand: SlashCommand = {
  name: 'clear',
  description: '会話履歴をクリアします（Ctrl+K と同じ）',
  async execute(args: string[], context: ChatContext) {
    await context.clearSession()
    context.addSystemMessage('💫 会話履歴をクリアしました')
  }
}
```

#### /help コマンド

```typescript
// src/lib/commands/commands/help.ts
export const helpCommand: SlashCommand = {
  name: 'help',
  description: '利用可能なコマンドを表示します',
  async execute(args: string[], context: ChatContext) {
    const commands = context.commandManager.getAllCommands()
    const helpText = commands
      .filter(cmd => !cmd.hidden)
      .map(cmd => `**/${cmd.name}** - ${cmd.description}`)
      .join('\n')
    
    context.addSystemMessage(`🆘 **利用可能なコマンド**\n\n${helpText}`)
  }
}
```

### UI コンポーネント設計

#### CommandSuggestions.tsx

```typescript
interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[]
  selectedIndex: number
  onSelect: (command: SlashCommand) => void
  position: { x: number; y: number }
}

export default function CommandSuggestions({
  suggestions,
  selectedIndex,
  onSelect,
  position
}: CommandSuggestionsProps) {
  return (
    <div 
      className="absolute z-50 bg-black border border-green-400/30 rounded"
      style={{ top: position.y, left: position.x }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.command.name}
          className={`
            px-3 py-2 cursor-pointer
            ${index === selectedIndex ? 'bg-green-400/20' : 'hover:bg-green-400/10'}
          `}
          onClick={() => onSelect(suggestion.command)}
        >
          <div className="text-green-400 font-mono">
            /{suggestion.highlight}
          </div>
          <div className="text-green-400/70 text-sm">
            {suggestion.description}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### YuiChat.tsx への統合

```typescript
// 状態管理
const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)
const [commandSuggestions, setCommandSuggestions] = useState<CommandSuggestion[]>([])
const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)

// コマンドマネージャー
const commandManager = useMemo(() => new SlashCommandManager(), [])

// 入力処理
const handleInputChange = useCallback((value: string) => {
  setInputMessage(value)
  
  if (commandManager.isCommand(value)) {
    const suggestions = commandManager.getSuggestions(value)
    setCommandSuggestions(suggestions)
    setShowCommandSuggestions(true)
    setSelectedCommandIndex(0)
  } else {
    setShowCommandSuggestions(false)
  }
}, [commandManager])

// キー処理
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (showCommandSuggestions) {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        )
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedCommandIndex(prev => 
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'Tab':
      case 'Enter':
        e.preventDefault()
        const selected = commandSuggestions[selectedCommandIndex]
        if (selected) {
          executeCommand(selected.command)
        }
        break
      case 'Escape':
        setShowCommandSuggestions(false)
        break
    }
    return
  }
  
  // 既存のキー処理...
}, [showCommandSuggestions, commandSuggestions, selectedCommandIndex])

// コマンド実行
const executeCommand = useCallback(async (command: SlashCommand) => {
  const context: ChatContext = {
    clearSession,
    addSystemMessage: (message: string) => {
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: message,
        timestamp: new Date()
      })
    },
    setMessages,
    // その他必要なコンテキスト
  }
  
  try {
    await command.execute([], context)
  } catch (error) {
    context.addSystemMessage(`❌ コマンド実行エラー: ${String(error)}`)
  }
  
  setInputMessage('')
  setShowCommandSuggestions(false)
}, [clearSession, addMessage, setMessages])
```

## テスト戦略

### 1. 単体テスト

```typescript
describe('SlashCommandManager', () => {
  test('/clear コマンドの実行', async () => {
    const manager = new SlashCommandManager()
    const mockContext = createMockContext()
    
    const result = await manager.execute('/clear', mockContext)
    
    expect(result).toBe(true)
    expect(mockContext.clearSession).toHaveBeenCalled()
  })
})
```

### 2. 結合テスト

- YuiChatコンポーネントでのコマンド入力
- UI サジェストの表示・選択
- キーボードナビゲーション

### 3. E2E テスト

- ユーザーが `/clear` を入力して会話がクリアされる
- コマンドサジェストが適切に表示される
- 存在しないコマンドのエラーハンドリング

## 実装フェーズ

### Phase 1: 基盤実装（1-2日）

1. ✅ CommandManager クラスの作成
2. ✅ 基本コマンド（/clear, /help）の実装
3. ✅ YuiChat.tsx への基本統合

### Phase 2: UI 強化（2-3日）

1. ✅ CommandSuggestions コンポーネント
2. ✅ キーボードナビゲーション
3. ✅ ビジュアル改善

### Phase 3: 拡張機能（必要に応じて）

1. 🔄 追加コマンドの実装
2. 🔄 コマンド履歴
3. 🔄 カスタムコマンド

## パフォーマンス考慮事項

1. **コマンド検索**: Trie構造やファジー検索の検討
2. **メモリ使用量**: コマンド登録時の最適化
3. **レンダリング**: サジェストUIの仮想化（多数のコマンド時）

## セキュリティ考慮事項

1. **入力検証**: コマンド引数の適切な検証
2. **権限制御**: 管理者専用コマンドの実装時
3. **XSS対策**: コマンド出力のサニタイズ

---

この設計に基づいて実装を開始できます。まずは基本的な `/clear` コマンドから始めて、段階的に機能を拡張していきます。