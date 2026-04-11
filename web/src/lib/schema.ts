import { z } from "zod";

// 3択シーンIDを固定して、想定外の値を受け取らないようにする。
export const sceneIdSchema = z.enum([
  "forecast_meeting",
  "ride_along_feedback",
  "slack_callout",
]);

// API入力の最小必須項目を定義して、不正なリクエストを弾く。
// user_id はリクエストボディでは受け取らず、IDトークン検証で得る。
export const generateInputSchema = z.object({
  // シーンIDは3択のみ許可する。
  scene_id: sceneIdSchema,
  // 生入力テキストを受け取る。
  raw_note: z.string().min(1).max(2000),
  // 上司のセリフは任意入力にする。
  manager_quote: z.string().max(500).optional().default(""),
  // 自分の返答も任意入力にする。
  self_response: z.string().max(500).optional().default(""),
});

// AI出力の契約を固定して、UI側の実装を安定させる。
export const aiOutputSchema = z.object({
  // 状況分析は短く具体化する。
  situation_analysis: z.string().min(20).max(180),
  // 明日の1アクションは必須にする。
  morning_action: z.string().min(20).max(120),
  // そのまま使える文面は必須にする。
  copy_paste_text: z.string().min(30).max(300),
  // 共感文は任意にして過度な文量を避ける。
  empathy_line: z.string().max(80).optional(),
  // バッドニュースファースト1文は任意にする。
  bad_news_first_line: z.string().max(120).optional(),
  // 予備返答は任意にする。
  fallback_reply: z.string().max(180).optional(),
});

// 入力型を推論してハンドラで使い回す。
export type GenerateInput = z.infer<typeof generateInputSchema>;
// 出力型を推論してUIとAPIの整合を取る。
export type AiOutput = z.infer<typeof aiOutputSchema>;

