(() => {
  const editor = document.querySelector('#code-editor');
  const output = document.querySelector('#output-content');
  const status = document.querySelector('#output-status');
  const language = document.querySelector('#editor-language');
  const fileName = document.querySelector('#editor-file-name');
  const title = document.querySelector('#challenge-title');
  const hook = document.querySelector('#challenge-hook');
  const xp = document.querySelector('#challenge-xp');
  const hintPanel = document.querySelector('#hint-panel');
  const hintContent = document.querySelector('#hint-content');
  const runButton = document.querySelector('#run-code');
  const submitButton = document.querySelector('#submit-code');
  const challenges = [...document.querySelectorAll('.challenge[data-kind="challenge"]')];
  if (!editor || !output || !status || !language) return;

  const config = window.CODECRAFT_CONFIG || {};
  const initial = Object.fromEntries(challenges.map((challenge) => [challenge.dataset.id, challenge.dataset.starter || '']));
  let active = document.querySelector('.challenge[data-kind="challenge"].is-active') || challenges[0] || null;
  const emptyOutput = 'Кодоо ажиллуулахад үр дүн энд харагдана.';

  const setFileName = (value) => {
    fileName.textContent = `challenge.${value === 'javascript' ? 'js' : value}`;
  };

  const setControls = (enabled) => {
    [runButton, submitButton].forEach((button) => {
      if (button) button.disabled = !enabled;
    });
  };

  const resetOutput = () => {
    output.textContent = emptyOutput;
    status.textContent = 'Бэлэн';
  };

  const selectChallenge = (challenge) => {
    if (!challenge || challenge.dataset.kind !== 'challenge') return;
    challenges.forEach((item) => {
      const selected = item === challenge;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    active = challenge;
    setControls(true);
    language.value = challenge.dataset.language || 'python';
    editor.value = challenge.dataset.starter || '';
    setFileName(language.value);
    title.textContent = challenge.dataset.title || 'Challenge';
    hook.textContent = challenge.dataset.hook || '';
    xp.textContent = challenge.dataset.xp ? `+${challenge.dataset.xp} XP` : 'PRACTICE';
    hintContent.textContent = challenge.dataset.hint || 'Өөрчлөлтөө жижиг хэсгээр хийж дахин ажиллуулаарай.';
    hintPanel.hidden = true;
    resetOutput();
  };

  const readPayload = async (response) => {
    const raw = await response.text();
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return { error: `Сервер JSON биш response буцаалаа (HTTP ${response.status}).` };
    }
  };

  const requireBackend = () => {
    if (!config.backendEnabled || !config.apiBase || !active?.dataset.id) {
      throw new Error('Бодит code check хийхийн тулд Login болон backend горим шаардлагатай.');
    }
  };

  const redirectToLogin = () => {
    window.location.assign('/auth?mode=login');
  };

  challenges.forEach((challenge) => {
    challenge.setAttribute('aria-pressed', challenge.classList.contains('is-active') ? 'true' : 'false');
    challenge.addEventListener('click', () => selectChallenge(challenge));
  });

  if (active) selectChallenge(active);
  else {
    setControls(false);
    title.textContent = 'Challenge олдсонгүй';
    hook.textContent = 'Practice хуудаснаас нэг challenge сонгож эхлээрэй.';
    xp.textContent = 'PRACTICE';
  }

  language.addEventListener('change', () => {
    if (active && active.dataset.language !== language.value) {
      const sameLanguage = challenges.find((item) => item.dataset.language === language.value);
      if (sameLanguage) selectChallenge(sameLanguage);
    }
    setFileName(language.value);
  });

  document.querySelector('#show-hint')?.addEventListener('click', () => {
    if (active) hintPanel.hidden = !hintPanel.hidden;
  });

  document.querySelector('#reset-code')?.addEventListener('click', () => {
    if (!active) return;
    editor.value = initial[active.dataset.id] || '';
    resetOutput();
  });

  runButton?.addEventListener('click', async () => {
    if (!active) return;
    status.textContent = 'Ажиллаж байна…';
    output.textContent = 'Түр хүлээнэ үү…';
    try {
      requireBackend();
      const response = await fetch(`${config.apiBase}/api/submissions/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          challenge_id: active.dataset.id,
          language: language.value,
          code: editor.value,
        }),
      });
      const payload = await readPayload(response);
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) throw new Error(payload.error?.message_mn || payload.error || 'Code check хийх боломжгүй байна.');
      const summary = payload.total_tests ? `${payload.passed_tests}/${payload.total_tests} test pass` : '';
      output.textContent = summary
        ? `${summary}\n\n${payload.output || payload.stdout || JSON.stringify(payload, null, 2)}`
        : (payload.output || payload.stdout || JSON.stringify(payload, null, 2));
      status.textContent = payload.status === 'accepted' ? 'Accepted' : 'Дууслаа';
      window.showToast?.(payload.status === 'accepted' ? 'Бүх test pass боллоо.' : 'Үр дүнг шалгаад дахин оролдоорой.');
    } catch (error) {
      output.textContent = error.message;
      status.textContent = 'Алдаа';
      window.showToast?.(error.message, true);
    }
  });

  submitButton?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const rewardStatus = document.querySelector('#reward-status');
    if (!config.backendEnabled || !active) {
      status.textContent = 'Backend шаардлагатай';
      output.textContent = 'Шалгуулахын тулд Login хийж, backend mode-д ажиллуулна уу.';
      return;
    }
    button.disabled = true;
    status.textContent = 'Шалгаж байна…';
    if (rewardStatus) rewardStatus.textContent = '';
    try {
      const response = await fetch(`${config.apiBase}/api/submissions/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ challenge_id: active.dataset.id, language: language.value, code: editor.value }),
      });
      const payload = await readPayload(response);
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) throw new Error(payload.error?.message_mn || payload.error || 'Шалгалт хийх боломжгүй байна.');
      const results = payload.results || {};
      const passed = Number(results.passed_tests) || 0;
      const total = Number(results.total_tests) || 0;
      output.textContent = `${passed}/${total} test pass\n\n${JSON.stringify(results.test_results || [], null, 2)}`;
      status.textContent = results.status === 'accepted' ? 'Accepted' : 'Дахин оролдоорой';
      const xpReward = payload.reward?.xp?.xp_amount || 0;
      if (rewardStatus) rewardStatus.textContent = results.status === 'accepted' ? `+${xpReward} XP` : 'XP авахын тулд бүх test-ийг pass болгоно.';
      window.showToast?.(results.status === 'accepted' ? 'Challenge амжилттай. XP нэмэгдлээ.' : 'Зарим test зөрж байна.', results.status !== 'accepted');
    } catch (error) {
      status.textContent = 'Алдаа';
      output.textContent = error.message;
      window.showToast?.(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
})();
