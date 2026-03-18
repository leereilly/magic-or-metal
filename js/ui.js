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
            <a class="btn-share" href="https://www.threads.net/intent/post?text=${encodeURIComponent(`I scored ${score}/${total} (${pct}%) on Magic or Metal! ⚔️🤘 Can you tell a Magic: The Gathering card from a Heavy Metal song?\n${window.location.origin}${window.location.pathname}`)}" target="_blank" rel="noopener" aria-label="Share on Threads" title="Share on Threads">
              <svg viewBox="0 0 24 24"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.343-.783-.964-1.416-1.78-1.87a8.097 8.097 0 0 1-.776 3.478c-.613 1.167-1.528 2.05-2.662 2.544-1.078.47-2.307.564-3.504.228-1.378-.387-2.48-1.236-3.1-2.395-.544-1.014-.764-2.24-.618-3.446.273-2.26 1.758-4.08 3.97-4.862 1.425-.504 3.032-.596 4.598-.32-.118-.896-.437-1.59-.95-2.044-.59-.524-1.448-.794-2.551-.805h-.042c-.94.01-1.79.266-2.417.728l-1.248-1.672C9.58 3.318 10.77 2.95 12.14 2.933h.058c1.57.017 2.823.467 3.724 1.333.861.83 1.39 1.984 1.572 3.42.687.131 1.33.326 1.92.58 1.268.547 2.27 1.43 2.875 2.588.672 1.285.822 2.89.424 4.52-.558 2.282-1.876 3.942-3.916 4.932-1.773.86-3.94 1.27-6.612 1.694zm-1.19-7.043c.107.892.46 1.62.995 2.044.516.41 1.18.58 1.868.496.92-.112 1.614-.574 2.066-1.36.497-.867.697-2.016.549-3.167-.88-.247-1.836-.331-2.765-.2-1.513.213-2.537 1.063-2.713 2.187z"/></svg>
            </a>
            <a class="btn-share" href="https://bsky.app/intent/compose?text=${encodeURIComponent(`I scored ${score}/${total} (${pct}%) on Magic or Metal! ⚔️🤘 Can you tell a Magic: The Gathering card from a Heavy Metal song?\n${window.location.origin}${window.location.pathname}`)}" target="_blank" rel="noopener" aria-label="Share on Bluesky" title="Share on Bluesky">
              <svg viewBox="0 0 24 24"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.497 6.168 3.16-.013.003 3.245.645 1.76 3.436-2.907 3.235 2.48 5.672 5.248 2.085.31-.4.476-.672.476-.672s.166.272.476.672c2.769 3.587 8.155 1.15 5.248-2.085-1.486-2.79 1.773-3.433 1.76-3.436 2.568.337 5.383-.533 6.168-3.16C28.174 9.418 28.552 4.458 28.552 3.768c0-.69-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C20.598 4.747 17.639 8.686 16.552 10.8z" transform="scale(0.857)"/></svg>
            </a>
            <a class="btn-share" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + window.location.pathname)}" target="_blank" rel="noopener" aria-label="Share on LinkedIn" title="Share on LinkedIn">
              <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
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
    if (question.answer === 'magic' && cardDetails) {
      const imgHtml = cardDetails.image
        ? `<img src="${cardDetails.image}" alt="${this.escapeHtml(cardDetails.name)}" loading="lazy" class="card-art" onload="this.classList.add('loaded')">`
        : '';
      details = `
        <div class="detail-card mtg-detail">
          <div class="card-art-wrap">${imgHtml}</div>
          <div class="detail-info">
            <strong>${this.escapeHtml(cardDetails.typeLine || '')}</strong>
            ${cardDetails.manaCost ? `<span class="mana-cost">${this.formatManaCost(cardDetails.manaCost)}</span>` : ''}
            <p class="oracle-text">${this.formatManaCost(this.escapeHtml(cardDetails.oracleText || ''))}</p>
            <small>Set: ${this.escapeHtml(cardDetails.setName || 'Unknown')} · Artist: ${this.escapeHtml(cardDetails.artist || 'Unknown')}</small>
          </div>
        </div>
      `;
    } else if (question.answer === 'magic' && !cardDetails) {
      details = `
        <div class="detail-card mtg-detail">
          <div class="card-art-wrap"></div>
          <div class="detail-info">
            <strong>Magic: The Gathering Card</strong>
          </div>
        </div>
      `;
    } else if (question.answer === 'metal') {
      const imgHtml = albumArt
        ? `<img src="${albumArt}" alt="${this.escapeHtml(question.album || '')}" loading="lazy" class="card-art" onload="this.classList.add('loaded')">`
        : '';
      details = `
        <div class="detail-card metal-detail">
          <div class="card-art-wrap">${imgHtml}</div>
          <div class="detail-info">
            <strong>🎸 ${this.escapeHtml(question.band || 'Unknown')}</strong>
            <p>Album: ${this.escapeHtml(question.album || 'Unknown')}</p>
          </div>
        </div>
      `;
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

  /** Convert Scryfall mana cost string (e.g. "{1}{W}{W}") to Mana font icons */
  formatManaCost(manaCost) {
    if (!manaCost) return '';
    return manaCost.replace(/\{([^}]+)\}/g, (_, symbol) => {
      // Lowercase and strip slashes: {W/U} → "wu", {2/W} → "2w", {W/P} → "wp"
      const cls = symbol.toLowerCase().replace(/\//g, '');
      return `<i class="ms ms-${cls} ms-cost" aria-hidden="true"></i>`;
    });
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
