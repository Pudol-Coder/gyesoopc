// Vercel 서버리스 함수: Gemini API 키를 브라우저에 노출하지 않고 호출합니다.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// TODO: 실제 행사 정보로 바꿔 주세요. AI는 이 내용만 근거로 답합니다.
const EVENT_INFO = `
행사 이름: 햄스터와 로봇 축구
날짜: ○월 ○일 (○) / 시간: ○○:○○ ~ ○○:○○
장소: ○○ 체육관
준비물: 편한 복장, 실내화
프로그램: 입장 확인 → 로봇 조종법 배우기 → 로봇 축구 예선 → 점심/햄스터 구경 → 결승 및 시상
햄스터 안전 수칙: 큰 소리 금지, 볼을 두드리지 않기, 플래시 사진 금지, 햄스터는 충분히 쉬게 함
참여 신청: 사이트 메인 페이지의 사전조사에서 응답
`;

const SYSTEM = `너는 '햄스터와 로봇 축구' 행사 안내 도우미야. 친절하고 짧게(5문장 이내) 한국어로 답해.
아래 행사 정보만 근거로 답하고, 정보에 없는 내용은 모른다고 말한 뒤 담당자 문의를 안내해.
햄스터를 해치는 방법이나 행사와 무관한 요청에는 정중히 사양해.
${EVENT_INFO}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요.' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: '서버에 API 키가 설정되지 않았어요.' });

  const { message, history } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 300)
    return res.status(400).json({ error: '질문은 1~300자로 입력해 주세요.' });

  const past = Array.isArray(history) ? history.slice(-6) : [];
  const contents = [
    ...past
      .filter(h => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'model'))
      .map(h => ({ role: h.role, parts: [{ text: h.text.slice(0, 1000) }] })),
    { role: 'user', parts: [{ text: message.trim() }] },
  ];

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { maxOutputTokens: 600, temperature: 0.6 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'AI 서버 오류가 났어요.' });
    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    return res.status(200).json({ reply: reply || '답변을 만들지 못했어요. 질문을 바꿔 보세요.' });
  } catch {
    return res.status(500).json({ error: '연결에 문제가 생겼어요.' });
  }
};
