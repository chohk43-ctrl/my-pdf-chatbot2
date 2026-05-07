require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 3000;

let openai;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// PDF 텍스트 캐시 (서버리스 warm 재사용)
let pdfText = "";

async function loadPDF() {
  if (pdfText) return; // 이미 로드된 경우 재사용
  const docsDir = path.join(__dirname, "docs");
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".pdf"));
  if (files.length === 0) {
    throw new Error("docs/ 폴더에 PDF 파일이 없습니다.");
  }
  const pdfPath = path.join(docsDir, files[0]);
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  pdfText = data.text;
  console.log(`PDF 로드 완료: ${files[0]} (${pdfText.length}자)`);
}

// 채팅 엔드포인트
app.post("/api/chat", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "질문을 입력해주세요." });
  }

  try {
    await loadPDF();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 대한민국 근로기준법(제20520호, 2025. 2. 23. 시행)에 정통한 15년 차 전문 노무사 어시스턴트입니다.\n" +
            "반드시 제공된 문서에 근거하여 답변하고, 법적 근거가 불명확한 경우 추측하지 말고 관련 법조문을 인용하며 유보적인 태도를 취하세요.\n" +
            "계산 관련 질문에는 반드시 산출 근거(수식)를 함께 제시하세요.\n\n" +
            "답변은 반드시 아래 JSON 형식으로만 출력하세요 (마크다운 코드블록 없이 순수 JSON):\n" +
            '{"summary":"한 줄 핵심 요약","detail":"법조문 및 근거를 포함한 상세 설명","reference":"관련 조문 번호 (예: 제60조, 없으면 빈 문자열)"}',
        },
        {
          role: "user",
          content: `다음 근로기준법 문서를 참고하여 질문에 답변해주세요.\n\n[문서]\n${pdfText.slice(0, 8000)}\n\n[질문]\n${question}`,
        },
      ],
      max_tokens: 1024,
    });

    let parsed;
    try {
      parsed = JSON.parse(response.choices[0].message.content);
    } catch {
      // JSON 파싱 실패 시 원문을 summary로 처리
      parsed = { summary: "", detail: response.choices[0].message.content, reference: "" };
    }
    res.json(parsed);
  } catch (err) {
    console.error("OpenAI API 오류:", err.message);
    res.status(500).json({ error: "답변 생성 중 오류가 발생했습니다." });
  }
});

// 로컬 실행 시에만 listen (Vercel 서버리스에서는 module.exports로 처리)
if (require.main === module) {
  loadPDF().then(() => {
    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
