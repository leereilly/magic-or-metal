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
        <div class="share-section">
          <h3>Share your score</h3>
          <div class="share-buttons">
            <a class="btn-share" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`I scored ${score}/${total} (${pct}%) on Magic or Metal! ⚔️🤘 Can you tell a Magic: The Gathering card from a Heavy Metal song?`)}&url=${encodeURIComponent(window.location.origin + window.location.pathname)}" target="_blank" rel="noopener" aria-label="Share on X (Twitter)" title="Share on X">
              <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a class="btn-share" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + window.location.pathname)}" target="_blank" rel="noopener" aria-label="Share on Facebook" title="Share on Facebook">
              <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a class="btn-share" href="https://www.reddit.com/submit?url=${encodeURIComponent(window.location.origin + window.location.pathname)}&title=${encodeURIComponent(`I scored ${score}/${total} on Magic or Metal! ⚔️🤘`)}" target="_blank" rel="noopener" aria-label="Share on Reddit" title="Share on Reddit">
              <svg viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
            </a>
            <button class="btn-share" onclick="UI.copyShareLink(${score}, ${total}, ${pct})" aria-label="Copy link" title="Copy link">
              <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        </div>
        <p class="credit">
          Powered by <a href="https://scryfall.com" target="_blank" rel="noopener">Scryfall</a> &
          <a href="https://musicbrainz.org" target="_blank" rel="noopener">MusicBrainz</a>
        </p>
      </div>
    `;
  },

  renderResultCard(answer, index) {
    const { question, userAnswer, correct, cardDetails, albumArt } = answer;
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
            ${albumArt ? `<img src="${albumArt}" alt="${this.escapeHtml(question.album || '')}" loading="lazy" class="card-art">` : ''}
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
  },

  // ── SoundCloud Player ──

  showPlayer(trackUrl) {
    this.hidePlayer();
    const encoded = encodeURIComponent(trackUrl);
    const container = document.createElement('div');
    container.id = 'sc-player';
    container.className = 'sc-player';
    container.innerHTML = `
      <button class="sc-close" onclick="UI.hidePlayer()" aria-label="Close player" title="Close player">✕</button>
      <iframe
        id="sc-iframe"
        width="100%"
        height="80"
        scrolling="no"
        frameborder="no"
        allow="autoplay"
        loading="lazy"
        src="https://w.soundcloud.com/player/?url=${encoded}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&color=%23dc3545">
      </iframe>
    `;
    document.body.appendChild(container);
    // Animate in
    requestAnimationFrame(() => container.classList.add('sc-player-visible'));
  },

  hidePlayer() {
    const el = document.getElementById('sc-player');
    if (el) el.remove();
  },

  copyShareLink(score, total, pct) {
    const text = `I scored ${score}/${total} (${pct}%) on Magic or Metal! ⚔️🤘 ${window.location.origin}${window.location.pathname}`;
    navigator.clipboard.writeText(text).then(() => {
      const toast = document.createElement('div');
      toast.className = 'share-toast';
      toast.textContent = 'Copied to clipboard!';
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('visible'));
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    });
  }
};
