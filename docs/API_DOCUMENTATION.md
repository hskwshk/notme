# API ドキュメント

ベースパス: `/api`

このドキュメントでは、各APIエンドポイントの詳細な仕様、リクエストパラメータ、レスポンス構造、および内部ロジックについて説明します。

---

## 認証 / Authentication (`/auth`)

### `GET /me`

現在のユーザーとセッション情報を取得します。

- **リクエスト**: なし
- **ロジック**:
  1. クッキーからセッションIDを取得し、データベースで検証します。
  2. 有効な場合、ユーザー情報とセッション情報を返します。
- **レスポンス**:
  ```json
  {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "image": "string | null",
      ...
    },
    "session": {
      "id": "string",
      "expiresAt": "date",
      ...
    }
  }
  ```

### `POST /secure-message`

セキュアなメッセージを送信します（デモ機能）。

- **リクエスト**:
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "message": "string (1-280文字)"
    }
    ```
- **ロジック**:
  1. メッセージ内容を検証します。
  2. メッセージをテキストファイルとしてR2ストレージに保存します。
- **レスポンス**:
  ```json
  {
    "message": "Hello [ユーザー名], [送信したメッセージ]"
  }
  ```

---

## ホーム / Home (`/home`)

### `GET /`

ホーム画面の描画に必要な全てのデータを一括で取得します。

- **リクエスト**: なし
- **ロジック**:
  1. **ユーザー詳細**: プロフィール画像、レベル、ストリーク（継続日数）などを取得。
  2. **通知チェック**: 未読の通知があるか確認。
  3. **今日のアクティビティ**: 今日の運動ログを取得。存在しない場合は作成（ログインボーナス的なスタンプ判定用）。
  4. **ストリーク計算**: 過去の活動ログから現在の継続日数を再計算し、必要であればユーザー情報を更新します。
  5. **スタンプ判定**: 今日の運動時間に基づいて獲得できるスタンプを計算。まだスタンプを見ていない場合はモーダル表示フラグを立てます。
  6. **グラフデータ**: 過去30日間のデータを元に「今月の最大記録」を算出（Y軸用）。直近5日間の日次データをグラフ用に整形します。
  7. **今日の名言**: ランダムまたは日替わりの名言を取得。
- **レスポンス**:
  ```json
  {
    "user": {
      "name": "string",
      "image": "string",
      "characterName": "string",
      "level": "number",
      "hasUnreadNotifications": "boolean"
    },
    "stats": {
      "currentStreak": "number",
      "maxStreak": "number",
      "todayExerciseMinutes": "number",
      "maxExerciseMinutes": "number",
      "monthMaxMinutes": "number",
      "graphData": [
        {
          "label": "string (例: '今日', '昨日', '2日前')",
          "minutes": "number",
          "type": "daily",
          "isMostEffort": "boolean (5日間で最大ならtrue)"
        }
      ]
    },
    "dailyQuote": { "text": "string" } | null,
    "stampModal": {
      "shouldShow": "boolean",
      "stamp": { "id": "string", "name": "string", "imageUrl": "string" } | null
    }
  }
  ```

### `POST /stamp-seen`

今日のスタンプモーダルを「閲覧済み」にします。

- **リクエスト**: なし
- **ロジック**:
  1. 今日の日付のアクティビティログを検索し、`isStampViewed` フラグを `true` に更新します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

---

## カレンダー・ゲーミフィケーション / Calendar (`/calendar`)

### `GET /`

指定した年月のカレンダーデータと、ミッション進捗などのゲーミフィケーション情報を取得します。

- **リクエスト**:
  - Query: `?year=2024&month=2` (省略時は現在の年月)
- **ロジック**:
  1. **日付範囲生成**: 指定された月の月初から月末までの範囲を決定。
  2. **ユーザー情報**: レベルや所持スタンプ情報を取得。
  3. **ミッション進捗**: 完了したミッション数をカウントし、次のレベルまでの残りミッション数を計算します（モックロジック含む）。
  4. **カレンダー生成**: 1日から月末までループし、各日のアクティビティログと獲得スタンプを紐付けます。
- **レスポンス**:
  ```json
  {
    "year": "number",
    "month": "number",
    "monthLabel": "string (例: '2月')",
    "currentStreak": "number",
    "days": [
      {
        "date": "string (YYYY-MM-DD)",
        "day": "number",
        "isFuture": "boolean",
        "hasActivity": "boolean",
        "stamp": { ... } | null
      }
    ],
    "level": "number",
    "missionProgress": {
      "current": "number (現在の進捗)",
      "required": "number (必要数)",
      "remaining": "number (あと何回)"
    },
    "isLevelUpReady": "boolean (レベルアップ可能か)",
    "stats": { ... },
    "gacha": {
      "canDraw": "boolean (ガチャが引けるか)"
    }
  }
  ```

### `POST /gacha`

スタンプガチャを引き、レベルアップ処理を行います。

- **リクエスト**: なし
- **ロジック**:
  1. ユーザーが所持していないスタンプを抽出します。
  2. 全て所持している場合はエラー/完了ステータスを返します。
  3. 未所持の中からランダムに1つ選択して付与します。
  4. ユーザーのレベルを+1します。
- **レスポンス**:
  ```json
  {
    "success": true,
    "stamp": { "id": "string", "name": "string", ... },
    "newLevel": "number"
  }
  ```

---

## デイリーゴール / Daily Goals (`/daily-goal`)

### `GET /`

今日の目標を取得します。

- **リクエスト**: なし
- **ロジック**:
  1. 今日の日付でユーザーに割り当てられた目標があればそれを返します。
  2. なければ、マスターデータからランダムに1つ選び、ユーザーに割り当ててから返します。
- **レスポンス**:
  ```json
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "difficulty": "string",
    "isViewed": "boolean"
  }
  ```

### `PATCH /:id/viewed`

目標を「確認済み」にします（バッジ等を消すため）。

- **リクエスト**:
  - Path: `id` (目標ID)
- **ロジック**:
  1. 指定された目標IDかつ今日のレコードの `isViewed` を `true` に更新します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

---

## ユーザー・ソーシャル / Users & Social (`/users`)

### `GET /search`

ユーザーを名前またはIDで検索します。

- **リクエスト**:
  - Query: `?q=検索クエリ`
- **ロジック**:
  1. 名前（部分一致）またはID（完全一致）でユーザーを検索します。最大20件。
- **レスポンス**:
  ```json
  {
    "users": [
      { "id": "string", "name": "string", "image": "string", ... }
    ]
  }
  ```

### `POST /:id/friend-request`

フレンド申請を送信します。

- **リクエスト**:
  - Path: `id` (相手のユーザーID)
- **ロジック**:
  1. 自分自身への申請や存在しないユーザーへの申請をブロック。
  2. 既にフレンド関係あるいは申請中であればエラー。
  3. 新規フレンド申請レコード（status: pending）を作成します。
- **レスポンス**:
  ```json
  { "success": true, "status": "pending" }
  ```

### `GET /me/friend-requests`

自分宛ての未承認フレンド申請一覧を取得します。

- **リクエスト**: なし
- **レスポンス**:
  ```json
  {
    "requests": [
      {
        "id": "string (申請ID)",
        "status": "pending",
        "user": { ... } // 申請者の情報
      }
    ]
  }
  ```

### `POST /friend-request/:requestId/accept`

フレンド申請を承認します。

- **リクエスト**:
  - Path: `requestId` (申請ID)
- **ロジック**:
  1. 申請IDと「自分宛てであること」を確認。
  2. ステータスを `accepted` に更新します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

### `DELETE /friend-request/:requestId`

フレンド申請を拒否またはキャンセルします。

- **リクエスト**:
  - Path: `requestId`
- **ロジック**:
  1. 自分が申請者か受信者であるかを確認。
  2. レコードを物理削除します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

### `GET /me/friends`

フレンド一覧を取得します。

- **リクエスト**: なし
- **ロジック**:
  1. ステータスが `accepted` のフレンドシップレコードを取得し、相手のユーザー情報をリスト化して返します。
- **レスポンス**:
  ```json
  {
    "friends": [
      { "id": "string", "name": "string", ... }
    ]
  }
  ```

### `GET /me/profile`

自分のプロフィール詳細画面用のデータを取得します。

- **リクエスト**: なし
- **ロジック**:
  1. **ソーシャル統計**: フォロー数、フォロワー数、未承認リクエスト数をカウント。
  2. **スタンプ**: 総獲得数とお気に入り登録されているスタンプ（最大3つ）を取得。
  3. **グラフ**: 過去7日間の運動データを取得し、グラフ用に整形します。
- **レスポンス**:
  ```json
  {
    "user": { ... },
    "stats": {
      "followingCount": 0,
      "followerCount": 0,
      "requestCount": 0,
      "totalStampCount": 0
    },
    "graph": [
      { "date": "YYYY-MM-DD", "minutes": 10, "isMax": false }
    ],
    "favoriteStamps": [ ... ]
  }
  ```

### `PUT /me/profile`

プロフィール情報（名前、IDなど）を更新します。

- **リクエスト**:
  - Body:
    ```json
    {
      "name": "string (任意)",
      "username": "string (任意)",
      "characterName": "string (任意)"
    }
    ```
- **ロジック**:
  1. ユーザーID（`username`）を変更する場合、重複チェックを行います。
  2. 指定されたフィールドを更新します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

### `PUT /me/profile/favorite-stamps`

プロフィールに表示するお気に入りスタンプを設定します。

- **リクエスト**:
  - Body: `{ "stampIds": ["id1", "id2", "id3"] }` (最大3つ)
- **ロジック**:
  1. 送信されたIDのスタンプを実際に所持しているか確認。
  2. 既存のお気に入り設定をリセットし、新しい順序で登録します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

### `POST /me/profile/image`

プロフィール画像をアップロードします。

- **リクエスト**:
  - Form Data: `file` (画像ファイル)
- **ロジック**:
  1. ファイルをR2ストレージにアップロード。
  2. 公開URLをユーザーテーブルの `image` カラムに保存。
- **レスポンス**:
  ```json
  { "url": "https://..." }
  ```

---

## 記録 / Records (`/records`)

### `GET /today`

今日の運動記録サマリーとセッション履歴を取得します。

- **リクエスト**: なし
- **ロジック**:
  1. 今日の日付の `activityLog` から合計時間を取得。
  2. 開始時間が「今日」の `exerciseSession` を全て取得。
- **レスポンス**:
  ```json
  {
    "totalDuration": "number (分)",
    "records": [{ "id": "string", "startTime": "date", "durationSeconds": 300 }]
  }
  ```

### `POST /`

運動セッションを記録します。

- **リクエスト**:
  - Body: `{ "durationSeconds": 300 }`
- **ロジック**:
  1. 現在時刻から遡って `startTime` を算出。
  2. `exerciseSession` (詳細ログ) を作成。
  3. `activityLog` (日次集計) の時間を加算（なければ作成）。
  4. `user` の `totalDuration` (累計) を加算。
- **レスポンス**:
  ```json
  { "success": true, "id": "string" }
  ```

### `DELETE /:id`

運動セッションを削除します。

- **リクエスト**:
  - Path: `id` (セッションID)
- **ロジック**:
  1. セッションを削除。
  2. その分の時間を `activityLog` と `user.totalDuration` から減算します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

---

## 通知 / Notifications (`/notifications`)

### `POST /subscriptions`

Web Push通知の購読情報を登録します。

- **リクエスト**:
  - Body: PushSubscription JSON (endpoint, keys, etc.)
- **ロジック**:
  1. 購読情報をDBに保存します。
- **レスポンス**:
  ```json
  { "subscriptionId": "string" }
  ```

### `GET /subscriptions`

特定のデバイス（エンドポイント）の購読状態を確認します。

- **リクエスト**:
  - Query: `?endpoint=...`
- **レスポンス**:
  ```json
  { "isSubscribed": true }
  ```

### `DELETE /subscriptions`

Web Push購読を解除します。

- **リクエスト**:
  - Query: `?endpoint=...`
- **ロジック**:
  1. DBから該当の購読情報を削除します。
- **レスポンス**:
  ```json
  { "success": true }
  ```

### `POST /send-test`

自分自身にテスト通知を送信します。

- **リクエスト**:
  - Body: `{ "title": "Test", "body": "Hello", "url": "/" }`
- **ロジック**:
  1. ユーザーの全購読エンドポイントに対してプッシュ通知を送信します。
  2. 送信に失敗したエンドポイント（無効なもの）は自動的に削除されます。
- **レスポンス**:
  ```json
  { "sentCount": 1, "failedCount": 0 }
  ```
