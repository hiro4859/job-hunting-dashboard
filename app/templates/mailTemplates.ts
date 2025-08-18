export type Field =
  | { key: string; label: string; type: "text"; required?: boolean; placeholder?: string }
  | { key: string; label: string; type: "textarea"; required?: boolean; placeholder?: string }
  | { key: string; label: string; type: "datetime"; required?: boolean; placeholder?: string }
  | { key: string; label: string; type: "select"; options: string[]; required?: boolean };

export type MailTemplate = {
  id: string;
  category: "お礼" | "日程調整" | "書類提出" | "辞退" | "承諾" | "催促" | "質問" | "説明会" | "OB訪問";
  title: string;
  subject: string;
  needReplySubject?: boolean;
  toHonorific: "様" | "御中" | "役職";
  fields: Field[];
  body: string;
};

const SIGN = `

{{user.name}}
{{user.university}}{{user.faculty}}{{user.department}}
電話番号：{{user.tel}}
メール：{{user.email}}
`;

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "thanks-experience",
    category: "お礼",
    title: "仕事体験／オープンカンパニーのお礼",
    subject: "{{date.mm}}月{{date.dd}}日の{{eventName}}のお礼（{{user.university}} {{user.name}}）",
    toHonorific: "様",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true, placeholder: "株式会社" },
      { key: "department", label: "部署", type: "text", placeholder: "人事部" },
      { key: "person", label: "担当者名", type: "text", placeholder: "" },
      { key: "eventName", label: "イベント名", type: "text", required: true, placeholder: "仕事体験 / オープンカンパニー" },
      { key: "eventDate", label: "実施日時", type: "datetime", required: true, placeholder: "YYYY-MM-DD HH:mm" },
      { key: "memo", label: "学び印象（任意）", type: "textarea", placeholder: "業務のロールプレイングを体験でき..." },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}{{person}}様

お世話になっております。
{{user.university}}{{user.faculty}}{{user.department}}の{{user.name}}です。

本日は貴社の{{eventName}}にてご対応いただき、誠にありがとうございました。

{{#if memo}}{{memo}}{{/if}}

丁寧にご対応いただいたことへのお礼をお伝えしたく、メールをお送りいたしました。
今後ともどうぞよろしくお願いいたします。

${SIGN}
`.trim(),
  },

  {
    id: "schedule-propose",
    category: "日程調整",
    title: "OBOG/面談面接の日程調整（候補提示）",
    subject: "（先方件名のまま返信）",
    needReplySubject: true,
    toHonorific: "様",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true },
      { key: "department", label: "部署", type: "text", placeholder: "人事部" },
      { key: "person", label: "担当者名", type: "text", placeholder: "" },
      { key: "topic", label: "用件", type: "select", options: ["OBOG訪問", "面談", "一次面接", "二次面接"], required: true },
      { key: "wish1", label: "第一希望", type: "datetime", required: true },
      { key: "wish2", label: "第二希望", type: "datetime" },
      { key: "wish3", label: "第三希望", type: "datetime" },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}{{person}}様

お世話になっております。
{{user.university}}{{user.faculty}}の{{user.name}}です。

{{topic}}のご連絡、誠にありがとうございます。
下記日程にて希望いたします。

第一希望　{{format(wish1)}}
{{#if wish2}}第二希望　{{format(wish2)}}{{/if}}
{{#if wish3}}第三希望　{{format(wish3)}}{{/if}}

お忙しい中恐れ入りますが、何卒よろしくお願いいたします。

${SIGN}
`.trim(),
  },

  {
    id: "submit-doc",
    category: "書類提出",
    title: "履歴書ご送付",
    subject: "履歴書ご送付の件（{{user.university}} {{user.name}}）",
    toHonorific: "御中",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true },
      { key: "department", label: "部署（任意）", type: "text" },
      { key: "pw", label: "パスワード別送の旨", type: "select", options: ["連絡する", "記載しない"], required: true },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}御中

お世話になります。
{{user.university}}{{user.faculty}}{{user.department}}の{{user.name}}と申します。

説明会にて提出のご指示をいただきました履歴書を、添付にて送付いたします。
{{#if pw}}なお、添付ファイルにはパスワードを設定しております。後ほど別メールにてパスワードをお送りいたします。{{/if}}

お忙しいところ恐れ入りますが、ご確認のほどよろしくお願いいたします。

${SIGN}
`.trim(),
  },

  {
    id: "decline-selection",
    category: "辞退",
    title: "面接辞退のご連絡",
    subject: "面接辞退のご連絡（{{user.university}} {{user.name}}）",
    toHonorific: "様",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true },
      { key: "department", label: "部署", type: "text", placeholder: "人事部" },
      { key: "person", label: "担当者名", type: "text", placeholder: "" },
      { key: "meetDate", label: "面接日（辞退対象）", type: "datetime", required: true },
      { key: "reason", label: "理由（任意簡潔）", type: "textarea", placeholder: "他社の内定を受諾したため、等" },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}{{person}}様

お世話になっております。
{{user.university}}{{user.faculty}}{{user.department}}の{{user.name}}と申します。

{{format(meetDate)}}に面接を設定いただいておりましたが、選考を辞退させていただきたくご連絡いたしました。
{{#if reason}}理由といたしましては、{{reason}}。{{/if}}
お忙しい中お時間を割いていただいたにもかかわらず、誠に申し訳ございません。

末筆ながら、貴社のますますのご発展を心よりお祈り申し上げます。

${SIGN}
`.trim(),
  },

  {
    id: "accept-offer",
    category: "承諾",
    title: "内々定／内定の承諾（返信）",
    subject: "（先方件名そのまま）",
    needReplySubject: true,
    toHonorific: "様",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true },
      { key: "department", label: "部署", type: "text" },
      { key: "person", label: "担当者名", type: "text" },
      { key: "startMonth", label: "入社月（任意）", type: "text", placeholder: "4月 など" },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}{{person}}様

お世話になっております。
{{user.university}}{{user.faculty}}の{{user.name}}です。

この度は内々定のご連絡を賜り、誠にありがとうございます。
貴社からの内々定を、ありがたくお受けいたします。

{{#if startMonth}}{{startMonth}}より貴社の一員として貢献できるよう、精一杯努力してまいります。{{/if}}
今後の手続きにつきましてご教示いただけますと幸いです。

何卒よろしくお願い申し上げます。

${SIGN}
`.trim(),
  },

  {
    id: "follow-up",
    category: "催促",
    title: "面接等に関するご確認（催促）",
    subject: "面接に関するお伺い（{{user.university}} {{user.name}}）",
    toHonorific: "様",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true },
      { key: "department", label: "部署", type: "text" },
      { key: "person", label: "担当者名", type: "text" },
      { key: "sentDate", label: "前回送信日時（任意）", type: "datetime" },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}{{person}}様

お世話になっております。
{{user.university}}{{user.faculty}}の{{user.name}}と申します。

先日は面接に関するご連絡をいただき、ありがとうございました。
{{#if sentDate}}{{format(sentDate)}}に希望日をお送りしておりますが、進捗はいかがでしょうか。{{/if}}

お忙しいところ恐れ入りますが、ご確認のほどお願いできますと幸いです。
本メールと行き違いでご連絡いただいておりましたら、大変申し訳ございません。

引き続き、何卒よろしくお願いいたします。

${SIGN}
`.trim(),
  },

  {
    id: "ob-request",
    category: "OB訪問",
    title: "OB/OG訪問のお願い",
    subject: "【OB/OG訪問のご依頼】{{user.university}} {{user.name}}",
    toHonorific: "様",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true },
      { key: "department", label: "部署", type: "text", placeholder: "営業部 など" },
      { key: "person", label: "宛名（わからなければ ご担当者）", type: "text", required: true, placeholder: "" },
      { key: "intro", label: "紹介元（任意）", type: "text", placeholder: "大学キャリアセンター／教授 等" },
      { key: "ask", label: "伺いたい内容（任意）", type: "textarea", placeholder: "業務内容やりがい 等" },
      { key: "wish1", label: "第一希望", type: "datetime" },
      { key: "wish2", label: "第二希望", type: "datetime" },
      { key: "wish3", label: "第三希望", type: "datetime" },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}{{person}}様

はじめまして。突然のご連絡で失礼いたします。
{{user.university}}{{user.faculty}}{{user.department}}の{{user.name}}と申します。
{{#if intro}}この度、{{intro}}よりご紹介いただき、OB/OG訪問のお願いでご連絡いたしました。{{/if}}

貴社の業務や仕事のやりがい等についてお話を伺えますと幸いです。
{{#if ask}}特に{{ask}}についてお聞きできればと存じます。{{/if}}

ご多忙のところ恐れ入りますが、以下候補のいずれかでご都合はいかがでしょうか。
{{#if wish1}}{{format(wish1)}}{{/if}}
{{#if wish2}}{{format(wish2)}}{{/if}}
{{#if wish3}}{{format(wish3)}}{{/if}}

何卒よろしくお願い申し上げます。

${SIGN}
`.trim(),
  },

  {
    id: "q-briefing",
    category: "質問",
    title: "会社説明会についての質問",
    subject: "会社説明会についての質問",
    toHonorific: "様",
    fields: [
      { key: "company", label: "会社名", type: "text", required: true },
      { key: "department", label: "部署", type: "text", placeholder: "総務部人事課" },
      { key: "person", label: "担当者名", type: "text", placeholder: "" },
      { key: "eventDate", label: "開催日時", type: "datetime", required: true },
      { key: "q1", label: "質問", type: "text", placeholder: "服装はスーツで問題ないでしょうか。" },
      { key: "q2", label: "質問（任意）", type: "text" },
      { key: "q3", label: "質問（任意）", type: "text" },
    ],
    body: `
{{company}} {{#if department}}{{department}} {{/if}}{{person}}様

お世話になります。
{{user.university}}{{user.faculty}}{{user.department}}{{user.name}}と申します。

{{format(eventDate)}}開催予定の会社説明会につきまして、以下の点を確認させてください。
1) {{q1}}
{{#if q2}}2) {{q2}}{{/if}}
{{#if q3}}3) {{q3}}{{/if}}

お忙しいところ恐れ入りますが、ご回答いただけますと幸いです。
よろしくお願い申し上げます。

${SIGN}
`.trim(),
  },
];

export const CATEGORIES = Array.from(new Set(MAIL_TEMPLATES.map(t => t.category)));
