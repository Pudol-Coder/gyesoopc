// Vercel 서버리스 함수: 사전조사 저장/집계 (Supabase REST 사용)
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (!URL_ || !KEY) return res.status(500).json({ error: '서버 설정이 아직 끝나지 않았어요.' });

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${URL_}/rest/v1/survey?select=choice`, { headers: H });
      if (!r.ok) throw new Error();
      const rows = await r.json();
      const out = { yes: 0, maybe: 0, no: 0 };
      rows.forEach(x => { if (x.choice in out) out[x.choice]++; });
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { name = '', choice, comment = '' } = req.body || {};
      if (!['yes', 'maybe', 'no'].includes(choice))
        return res.status(400).json({ error: '참여 여부를 선택해 주세요.' });
      const r = await fetch(`${URL_}/rest/v1/survey`, {
        method: 'POST',
        headers: { ...H, Prefer: 'return=minimal' },
        body: JSON.stringify({
          name: String(name).slice(0, 30),
          choice,
          comment: String(comment).slice(0, 300),
        }),
      });
      if (!r.ok) throw new Error();
      return res.status(201).json({ ok: true });
    }

    return res.status(405).json({ error: '허용되지 않는 요청이에요.' });
  } catch {
    return res.status(500).json({ error: '저장 중 문제가 생겼어요.' });
  }
};
