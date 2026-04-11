import type { GenerateInput } from "@/lib/schema";

// シーンごとの文脈を短く定義する。
const sceneDescriptionMap: Record<GenerateInput["scene_id"], string> = {
  // ヨミ会前夜の文脈を定義する。
  forecast_meeting:
    "明日のヨミ会・進捗報告で『根拠は？』と詰められる前提の準備",
  // 同行後フィードバックの文脈を定義する。
  ride_along_feedback:
    "同行・商談後に『あの場面どうすべきだった？』と問われる前提の準備",
  // Slack呼び出しの文脈を定義する。
  slack_callout:
    "Slackで『ちょっといい？』と呼ばれたときの最初の一言と答え方の準備",
};

// モデル共通のシステムプロンプトを返す。
export function buildSystemPrompt(): string {
  return [
    "あなたはSaaS営業向けの実務アシスタントです。",
    "目的は、ユーザーが明日詰められないための具体行動を1つ出すことです。",
    "出力はJSONのみで返してください。",
    "禁止: 抽象的励まし、根拠のない確率、実名推測。",
    "必須: morning_actionには時刻/相手/チャネルを含める。",
    "copy_paste_textは敬体で、そのまま送れる文章にする。",
    "機密情報は伏せ字表現（顧客X、上司A）を使う。",
  ].join("\n");
}

// ユーザー入力をモデルに渡すプロンプト文字列へ変換する。
export function buildUserPrompt(input: GenerateInput): string {
  // シーン説明を引き当てる。
  const sceneDescription = sceneDescriptionMap[input.scene_id];
  // モデルに渡す本文を構築する。
  return [
    `scene: ${input.scene_id}`,
    `scene_description: ${sceneDescription}`,
    `raw_note: ${input.raw_note}`,
    `manager_quote: ${input.manager_quote || "(none)"}`,
    `self_response: ${input.self_response || "(none)"}`,
    "JSON schema:",
    "{",
    '  "situation_analysis": "string(60-180 chars)",',
    '  "morning_action": "string(30-120 chars)",',
    '  "copy_paste_text": "string(80-300 chars)",',
    '  "empathy_line": "string(optional)",',
    '  "bad_news_first_line": "string(optional)",',
    '  "fallback_reply": "string(optional)"',
    "}",
  ].join("\n");
}

