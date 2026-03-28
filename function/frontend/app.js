// ============================================================
//  Instant English — app.js
//  バックエンド（FastAPI）と繋がったら BASE_URL を変更するだけでOK
// ============================================================

const BASE_URL = 'http://localhost:8000'; // FastAPI のURL
const USE_MOCK = true; // バックエンド完成後に false に変える

// ── State ──────────────────────────────────────────────────
const state = {
  score: 0,
  streak: 0,
  total: 0,
  level: 'beginner',
  currentQuestion: null, // { ja: string, en: string }
  isLoading: false,
};

// ── DOM refs ───────────────────────────────────────────────
const els = {
  question:    () => document.getElementById('question'),
  input:       () => document.getElementById('answer-input'),
  feedback:    () => document.getElementById('feedback'),
  score:       () => document.getElementById('score'),
  streak:      () => document.getElementById('streak'),
  total:       () => document.getElementById('total'),
};

// ── API ────────────────────────────────────────────────────

/**
 * バックエンドから問題を取得する
 * バックエンド未接続時はモックデータを返す
 */
async function fetchQuestion(level) {
  if (USE_MOCK) {
    const mock = {
      beginner: [
        { ja: '私は毎朝コーヒーを飲みます。', en: 'I drink coffee every morning.' },
        { ja: '彼女は学校の先生です。',       en: 'She is a school teacher.' },
        { ja: '今日は天気がいいですね。',     en: 'The weather is nice today.' },
      ],
      intermediate: [
        { ja: '彼は昨日までにレポートを提出しなければなりませんでした。', en: 'He had to submit the report by yesterday.' },
        { ja: 'もっと早く起きていれば電車に乗れたのに。', en: 'If I had woken up earlier, I could have caught the train.' },
      ],
      advanced: [
        { ja: '彼女がその提案を断るとは思ってもみなかった。', en: 'It never occurred to me that she would turn down the proposal.' },
      ],
    };
    const list = mock[level] || mock.beginner;
    return list[Math.floor(Math.random() * list.length)];
  }
  // 以下は既存のfetchコード...
}
/**
 * バックエンドで採点する
 * バックエンド未接続時はフロントで簡易採点
 */
async function gradeAnswer(userAnswer, correctAnswer) {
  try {
    const res = await fetch(`${BASE_URL}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_answer: userAnswer, correct_answer: correctAnswer }),
    });
    if (!res.ok) throw new Error('Server error');
    return await res.json(); // { correct: bool, feedback: string }
  } catch {
    // ── 簡易採点（FastAPI完成後に削除） ──
    const correct = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    return {
      correct,
      feedback: correct ? '正解！' : `不正解。正解: ${correctAnswer}`,
    };
  }
}

// ── UI helpers ─────────────────────────────────────────────

function setLoading(loading) {
  state.isLoading = loading;
  const q = els.question();
  if (loading) {
    q.innerHTML = '<span class="skeleton" style="width:70%;display:inline-block">&nbsp;</span>';
  }
}

function updateStats() {
  els.score().textContent  = state.score;
  els.streak().textContent = state.streak;
  els.total().textContent  = state.total;
}

function resetInput() {
  const input = els.input();
  input.value     = '';
  input.className = '';
  els.feedback().className   = 'feedback';
  els.feedback().innerHTML   = '';
}

function showFeedback(correct, message) {
  const input    = els.input();
  const feedback = els.feedback();

  input.classList.add(correct ? 'correct' : 'incorrect');
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
  feedback.innerHTML = correct
    ? `✅ ${message}`
    : `❌ ${message}`;
}

// ── Core actions ───────────────────────────────────────────

async function loadQuestion() {
  if (state.isLoading) return;
  setLoading(true);
  resetInput();

  state.currentQuestion = await fetchQuestion(state.level);
  els.question().textContent = state.currentQuestion.ja;
  setLoading(false);
  els.input().focus();
}

async function checkAnswer() {
  if (state.isLoading || !state.currentQuestion) return;

  const userAnswer = els.input().value.trim();
  if (!userAnswer) return;

  state.total++;
  updateStats();

  const result = await gradeAnswer(userAnswer, state.currentQuestion.en);

  if (result.correct) {
    state.score++;
    state.streak++;
    updateStats();
    showFeedback(true, result.feedback);
    setTimeout(loadQuestion, 1200);
  } else {
    state.streak = 0;
    updateStats();
    showFeedback(false, result.feedback);
  }
}

function skipQuestion() {
  if (state.isLoading) return;
  loadQuestion();
}

function setLevel(btn, level) {
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.level = level;
  loadQuestion();
}

function handleKey(e) {
  if (e.key === 'Enter') checkAnswer();
}

function speak() {
  if (!state.currentQuestion?.en) return;
  const utter  = new SpeechSynthesisUtterance(state.currentQuestion.en);
  utter.lang   = 'en-US';
  utter.rate   = 0.9;
  speechSynthesis.speak(utter);
}

// ── Init ───────────────────────────────────────────────────
loadQuestion();