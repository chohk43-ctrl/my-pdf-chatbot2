const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 퀵 버튼 클릭
document.querySelectorAll(".quick-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    userInput.value = btn.dataset.q;
    sendMessage();
  });
});

// 전송 버튼 클릭
sendBtn.addEventListener("click", sendMessage);

// 엔터키 전송
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function appendBotCard(data) {
  const card = document.createElement("div");
  card.className = "bot-card";

  if (data.summary) {
    const summary = document.createElement("div");
    summary.className = "summary";
    summary.textContent = data.summary;
    card.appendChild(summary);
  }

  const detail = document.createElement("div");
  detail.className = "detail";
  detail.textContent = data.detail || "";
  card.appendChild(detail);

  if (data.reference) {
    const ref = document.createElement("div");
    ref.className = "reference";
    ref.textContent = `관련 조문: ${data.reference}`;
    card.appendChild(ref);
  }

  chatBox.appendChild(card);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function sendMessage() {
  const question = userInput.value.trim();
  if (!question) return;

  userInput.value = "";
  sendBtn.disabled = true;

  appendMessage(question, "user");
  const loadingEl = appendMessage("답변을 생성하는 중...", "loading");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    loadingEl.remove();

    if (data.error) {
      appendMessage(`오류: ${data.error}`, "bot");
    } else {
      appendBotCard(data);
    }
  } catch {
    loadingEl.remove();
    appendMessage("서버 연결에 실패했습니다. 다시 시도해주세요.", "bot");
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}
