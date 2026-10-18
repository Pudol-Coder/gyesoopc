# 햄스터와 로봇 축구 사이트

주소: gyesoopc.kro.kr  (/main, /ai, /information, /etc)

## 폴더 구조
```
main.html  ai.html  information.html  etc.html  style.css
api/chat.js     ← Gemini 호출 (API 키 보호)
api/survey.js   ← 사전조사 저장·집계 (Supabase)
vercel.json
```

## 1. Supabase 테이블 만들기 (SQL Editor에서 실행)
```sql
create table survey (
  id bigint generated always as identity primary key,
  name text,
  choice text not null check (choice in ('yes','maybe','no')),
  comment text,
  created_at timestamptz default now()
);
alter table survey enable row level security;
```
(정책을 만들지 않으면 브라우저에서는 접근할 수 없고, 서버 함수만 읽고 쓸 수 있어요.)

## 2. GitHub에 올리기
이 폴더 전체를 새 저장소에 push 합니다.

## 3. Vercel 배포
1. vercel.com → Add New Project → 위 저장소 선택 (Framework: Other)
2. Settings → Environment Variables 에 추가
   - `GEMINI_API_KEY` : Google AI Studio에서 발급
   - `SUPABASE_URL` : Supabase 프로젝트 URL
   - `SUPABASE_SERVICE_ROLE_KEY` : Supabase service_role 키 (절대 공개 금지)
3. Deploy

## 4. 도메인 연결
Vercel → Settings → Domains 에 `gyesoopc.kro.kr` 추가 → 안내되는 DNS 값(A 또는 CNAME)을
kro.kr 관리 페이지의 DNS 설정에 입력합니다.

## 5. 내용 수정
- 행사 날짜·장소 등 `○` 표시: main.html, information.html, etc.html
- AI가 아는 행사 정보: api/chat.js 의 `EVENT_INFO`
