# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

PDF 문서를 읽고 사용자의 질문에 답변하는 챗봇 애플리케이션.

- **서버**: Node.js + Express
- **프론트엔드**: HTML / CSS / JavaScript (바닐라)
- **AI API**: OpenAI API — `gpt-4.1-mini` 모델
- **배포**: Vercel

## 현재 상태

소스 코드 미구현 상태. `docs/` 폴더에 샘플 PDF(한국 근로기준법)만 존재.
구현이 필요한 파일: `server.js`, `public/index.html`, `public/app.js`, `public/style.css`, `package.json`, `.env`

## 디렉토리 구조

```
my-pdf_chatbot2/
├── docs/          # PDF 문서 보관 폴더 (현재 근로기준법 PDF 있음)
├── public/        # 정적 프론트엔드 파일 (HTML, CSS, JS)
├── server.js      # Express 서버 진입점
├── .env           # 환경 변수 (Git 제외)
└── CLAUDE.md
```

## 서버 실행

```powershell
npm install
npm start       # 프로덕션
npm run dev     # 개발 (nodemon)
```

## 핵심 규칙

1. **`.env` 파일은 절대 Git에 추가하지 말 것**
2. **API 키는 `server.js`에서만 처리** — 프론트엔드 노출 금지
3. **PDF 파일은 `docs/` 폴더에만 보관**
4. **주석은 한국어로 작성**

## 아키텍처

### 데이터 흐름

```
사용자 질문 (브라우저)
  → POST /api/chat  (server.js)
  → docs/ 폴더에서 PDF 텍스트 추출
  → OpenAI API 호출 (pdfText + userQuestion)
  → 응답 반환 → 브라우저 렌더링
```

### server.js 구현 시 포함해야 할 엔드포인트

- `GET /` — `public/index.html` 서빙
- `POST /api/chat` — 질문 수신, PDF 파싱, OpenAI 호출, 응답 반환

### PDF 처리

`docs/` 폴더의 PDF를 서버 시작 시 또는 요청 시 파싱. 텍스트 추출에는 `pdf-parse` 패키지 사용 권장.

### OpenAI API 패턴

```js
const response = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [
    { role: "system", content: "당신은 PDF 문서를 기반으로 질문에 답변하는 어시스턴트입니다." },
    { role: "user", content: `다음 문서를 참고하여 답변해주세요.\n\n${pdfText}\n\n질문: ${userQuestion}` },
  ],
  max_tokens: 1024,
});
```

## 환경 변수

```
OPENAI_API_KEY=your_api_key_here
```

## 배포 (Vercel)

- `OPENAI_API_KEY`를 Vercel 대시보드 → Settings → Environment Variables에 등록
- `vercel.json`이 필요하면 Express 앱을 serverless function으로 래핑
