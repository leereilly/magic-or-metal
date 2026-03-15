/**
 * UI rendering — DOM manipulation, animations, results display.
 */
const UI = {
  get app() {
    return document.getElementById('app');
  },

  renderStart() {
    this.app.innerHTML = `
      <div class="start-screen">
        <div class="ember-container" aria-hidden="true">
          <div class="ember"></div><div class="ember"></div><div class="ember"></div>
          <div class="ember"></div><div class="ember"></div><div class="ember"></div>
          <div class="ember"></div><div class="ember"></div>
        </div>
        <h1 class="logo">
          <span class="logo-magic">⚔️ MAGIC</span>
          <span class="logo-or">or</span>
          <span class="logo-metal">METAL? 🤘</span>
        </h1>
        <p class="subtitle">Is it a <strong>Magic: The Gathering</strong> card<br>or a <strong>Heavy Metal</strong> song?</p>
        <button class="btn-play" onclick="Game.startRound()" autofocus>PLAY</button>
        <div class="data-stats">
          <span>${Data.mtgNames.length.toLocaleString()} cards</span>
          <span class="dot">·</span>
          <span>${Data.metalSongs.length.toLocaleString()} songs</span>
        </div>
        <p class="credit">
          Cards via <a href="https://scryfall.com" target="_blank" rel="noopener">Scryfall</a> ·
          Songs via <a href="https://musicbrainz.org" target="_blank" rel="noopener">MusicBrainz</a>
        </p>
      </div>
    `;
  },

  renderQuestion(question, index, total) {
    const score = Game.answers.filter(a => a.correct).length;
    const progressPct = (index / total) * 100;

    this.app.innerHTML = `
      <div class="quiz-screen">
        <div class="quiz-header">
          <div class="progress-text">${index + 1} / ${total}</div>
          <div class="score-text" aria-live="polite">Score: <strong>${score}</strong></div>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${index}" aria-valuemin="0" aria-valuemax="${total}">
          <div class="progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <div class="quiz-card animate-enter" role="status" aria-live="assertive">
          <p class="phrase">${this.escapeHtml(question.text)}</p>
        </div>
        <div class="answer-buttons">
          <button class="btn-answer btn-magic" onclick="Game.submitAnswer('magic')" aria-label="Magic: The Gathering card">
            <span class="btn-emoji" aria-hidden="true">🧙‍♂️</span> MAGIC
          </button>
          <button class="btn-answer btn-metal" onclick="Game.submitAnswer('metal')" aria-label="Heavy Metal song">
            <span class="btn-emoji" aria-hidden="true">🤘</span> METAL
          </button>
        </div>
        <div class="hint-text">Press <kbd>1</kbd> or <kbd>←</kbd> for Magic · <kbd>2</kbd> or <kbd>→</kbd> for Metal</div>
      </div>
    `;
  },

  showFeedback(correct, userAnswer) {
    const card = document.querySelector('.quiz-card');
    const btnMagic = document.querySelector('.btn-magic');
    const btnMetal = document.querySelector('.btn-metal');

    if (correct) {
      card.classList.add('feedback-correct');
      (userAnswer === 'magic' ? btnMagic : btnMetal).classList.add('btn-selected-correct');
    } else {
      card.classList.add('feedback-wrong');
      (userAnswer === 'magic' ? btnMagic : btnMetal).classList.add('btn-selected-wrong');
    }
  },

  renderResults(answers, score, total, loading) {
    const pct = Math.round((score / total) * 100);
    const message =
      pct === 100 ? '🏆 PERFECT! True MTG Judge & Metalhead!'
      : pct >= 80 ? '🔥 Impressive! You know your stuff!'
      : pct >= 60 ? '👍 Not bad! Keep studying your cards and albums.'
      : pct >= 40 ? '😅 Room for improvement...'
      : '💀 The Dark Lord of Confusion claims another victim.';

    const cards = answers.map((a, i) => this.renderResultCard(a, i)).join('');

    this.app.innerHTML = `
      <div class="results-screen">
        <h2 class="results-title">Round Complete!</h2>
        <div class="score-display">
          <span class="score-number">${score}</span>
          <span class="score-divider">/</span>
          <span class="score-total">${total}</span>
        </div>
        <p class="results-pct">${pct}%</p>
        <p class="results-message">${message}</p>
        ${loading ? '<p class="loading-details">Loading card details…</p>' : ''}
        <div class="results-list">${cards}</div>
        <div class="results-actions">
          <button class="btn-play" onclick="Game.startRound()" autofocus>PLAY AGAIN</button>
        </div>
        <p class="credit">
          Powered by <a href="https://scryfall.com" target="_blank" rel="noopener">Scryfall</a> &
          <a href="https://musicbrainz.org" target="_blank" rel="noopener">MusicBrainz</a>
        </p>
      </div>
    `;
  },

  renderResultCard(answer, index) {
    const { question, userAnswer, correct, cardDetails } = answer;
    const icon = correct ? '✅' : '❌';
    const actualLabel = question.answer === 'magic' ? '🧙‍♂️ Magic Card' : '🤘 Metal Song';
    const delay = index * 0.06;

    let details = '';
    if (!correct) {
      if (question.answer === 'magic' && cardDetails) {
        details = `
          <div class="detail-card mtg-detail">
            ${cardDetails.image ? `<img src="${cardDetails.image}" alt="${this.escapeHtml(cardDetails.name)}" loading="lazy" class="card-art">` : ''}
            <div class="detail-info">
              <strong>${this.escapeHtml(cardDetails.typeLine || '')}</strong>
              ${cardDetails.manaCost ? `<span class="mana-cost">${this.escapeHtml(cardDetails.manaCost)}</span>` : ''}
              <p class="oracle-text">${this.escapeHtml(cardDetails.oracleText || '')}</p>
              <small>Set: ${this.escapeHtml(cardDetails.setName || 'Unknown')} · Artist: ${this.escapeHtml(cardDetails.artist || 'Unknown')}</small>
            </div>
          </div>
        `;
      } else if (question.answer === 'magic' && !cardDetails) {
        details = `
          <div class="detail-card mtg-detail">
            <div class="detail-info">
              <strong>Magic: The Gathering Card</strong>
            </div>
          </div>
        `;
      } else if (question.answer === 'metal') {
        details = `
          <div class="detail-card metal-detail">
            <div class="detail-info">
              <strong>🎸 ${this.escapeHtml(question.band || 'Unknown')}</strong>
              <p>Album: ${this.escapeHtml(question.album || 'Unknown')}</p>
            </div>
          </div>
        `;
      }
    }

    return `
      <div class="result-row ${correct ? 'result-correct' : 'result-wrong'}" style="animation-delay: ${delay}s">
        <div class="result-header">
          <span class="result-icon">${icon}</span>
          <span class="result-phrase">"${this.escapeHtml(question.text)}"</span>
          <span class="result-label">${actualLabel}</span>
        </div>
        ${details}
      </div>
    `;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
