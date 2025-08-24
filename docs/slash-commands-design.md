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

## コマンドサジェストUI仕様

### 基本要件

Claude Code風のコマンドサジェストUIを実装します：

1. **表示条件**: 入力欄で「/」を入力した時に表示
2. **表示位置**: input要素の直下にドロップダウン形式
3. **最大表示数**: 10件まで
4. **ソート**: アルファベット順
5. **フィルタリング**: 入力に応じてリアルタイムでフィルタ
6. **キーボード操作**:
   - Tab: 候補の一番上のコマンドを補完
   - Enter: 候補の一番上のコマンドを実行
   - 矢印キー: 候補の選択移動（将来実装）
   - Escape: サジェストを閉じる

### UI コンポーネント設計

#### CommandSuggestions.tsx

```typescript
interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[]
  visible: boolean
  inputElement: HTMLInputElement | null
  onSelect: (command: SlashCommand) => void
  onComplete: (commandName: string) => void
}

export default function CommandSuggestions({
  suggestions,
  visible,
  inputElement,
  onSelect,
  onComplete
}: CommandSuggestionsProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  // input要素の位置を計算してサジェストを配置
  useEffect(() => {
    if (inputElement && visible) {
      const rect = inputElement.getBoundingClientRect()
      setPosition({
        x: rect.left,
        y: rect.bottom + 4
      })
    }
  }, [inputElement, visible])

  if (!visible || suggestions.length === 0) return null

  return createPortal(
    <div 
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      style={{ 
        left: position.x, 
        top: position.y,
        minWidth: '280px'
      }}
    >
      {suggestions.slice(0, 10).map((suggestion, index) => (
        <div
          key={suggestion.command.name}
          className={`
            px-3 py-2 cursor-pointer border-b border-gray-800 last:border-b-0
            ${index === 0 ? 'bg-blue-600/20 border-blue-500' : 'hover:bg-gray-800'}
            transition-colors duration-150
          `}
          onClick={() => onSelect(suggestion.command)}
        >
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-mono text-sm">
              /{suggestion.command.name}
            </span>
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {suggestion.command.description}
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}
```

#### サジェスト状態管理

```typescript
// YuiChat.tsx内での状態管理
const [commandSuggestions, setCommandSuggestions] = useState<CommandSuggestion[]>([])
const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)
const inputRef = useRef<HTMLInputElement>(null)

// 入力変更時のフィルタリング
const handleInputChange = useCallback((value: string) => {
  setInputMessage(value)
  
  if (value.startsWith('/') && value.length > 1) {
    // "/"以降の文字でフィルタリング
    const query = value.slice(1).toLowerCase()
    const filtered = commandManager.getSuggestions(query)
      .sort((a, b) => a.command.name.localeCompare(b.command.name))
    
    setCommandSuggestions(filtered)
    setShowCommandSuggestions(filtered.length > 0)
  } else if (value === '/') {
    // "/" だけの場合は全コマンドを表示
    const allCommands = commandManager.getAllCommands()
      .filter(cmd => !cmd.hidden)
      .map(cmd => ({ command: cmd, highlight: cmd.name }))
      .sort((a, b) => a.command.name.localeCompare(b.command.name))
    
    setCommandSuggestions(allCommands)
    setShowCommandSuggestions(true)
  } else {
    setShowCommandSuggestions(false)
  }
}, [commandManager])

// キーボード操作
const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
  if (showCommandSuggestions && commandSuggestions.length > 0) {
    switch (e.key) {
      case 'Tab':
        e.preventDefault()
        // 一番上のコマンドを補完
        const topCommand = commandSuggestions[0]?.command
        if (topCommand) {
          setInputMessage(`/${topCommand.name} `)
          setShowCommandSuggestions(false)
        }
        break
        
      case 'Enter':
        e.preventDefault()
        // 一番上のコマンドを実行
        const selectedCommand = commandSuggestions[0]?.command
        if (selectedCommand) {
          executeCommand(selectedCommand)
        }
        break
        
      case 'Escape':
        setShowCommandSuggestions(false)
        break
    }
    return
  }
  
  // 既存のEnterキー処理
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}, [showCommandSuggestions, commandSuggestions, executeCommand, sendMessage])
```

#### CommandManager拡張

コマンドサジェスト機能に必要なメソッドを追加：

```typescript
// src/lib/commands/CommandManager.ts
class SlashCommandManager {
  // ...既存のメソッド

  /**
   * 全コマンドを取得（サジェスト用）
   */
  getAllCommands(): SlashCommand[] {
    return Array.from(this.commands.values())
  }

  /**
   * コマンドサジェストを取得（フィルタリング付き）
   */
  getSuggestions(query: string): CommandSuggestion[] {
    const lowerQuery = query.toLowerCase()
    
    return this.getAllCommands()
      .filter(cmd => !cmd.hidden)
      .filter(cmd => 
        cmd.name.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery)
      )
      .map(cmd => ({
        command: cmd,
        highlight: this.highlightMatch(cmd.name, query),
        description: cmd.description
      }))
  }

  /**
   * マッチした部分をハイライト用に処理
   */
  private highlightMatch(text: string, query: string): string {
    if (!query) return text
    // 実装は後でハイライト機能が必要になった時に追加
    return text
  }
}
```

### 実装の統合パターン

YuiChat.tsx での最終的な統合例：

```typescript
return (
  <div className="relative">
    {/* 既存のチャットUI */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* メッセージリスト */}
    </div>
    
    {/* 入力エリア */}
    <div className="relative border-t border-green-400/20 p-4">
      <input
        ref={inputRef}
        type="text"
        value={inputMessage}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border border-green-400/30 rounded px-3 py-2"
        placeholder="メッセージを入力するか、/ でコマンドを使用..."
      />
      
      {/* コマンドサジェスト */}
      <CommandSuggestions
        suggestions={commandSuggestions}
        visible={showCommandSuggestions}
        inputElement={inputRef.current}
        onSelect={(command) => executeCommand(command)}
        onComplete={(commandName) => {
          setInputMessage(`/${commandName} `)
          setShowCommandSuggestions(false)
        }}
      />
    </div>
  </div>
)
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
- UI サジェストの表示・選択・フィルタリング
- キーボードナビゲーション（Tab補完、Enter実行）
- input要素の位置に基づく適切なサジェスト配置

### 3. E2E テスト

- ユーザーが `/` を入力してサジェストが表示される
- `/clear` を入力中にフィルタリングされる
- Tabキーで補完、Enterキーで実行される
- コマンド実行後に会話がクリアされる

## 実装フェーズ

### Phase 1: 基盤実装（1-2日）

1. ✅ CommandManager クラスの作成
2. ✅ 基本コマンド（/clear, /help）の実装
3. ✅ YuiChat.tsx への基本統合

### Phase 2: コマンドサジェストUI実装（2-3日）

1. 🔄 CommandSuggestions コンポーネント
2. 🔄 キーボードナビゲーション（Tab補完、Enter実行）
3. 🔄 リアルタイムフィルタリング

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