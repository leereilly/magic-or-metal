/**
 * UI rendering — DOM manipulation, animations, results display.
 */
const UI = {
  get app() {
    return document.getElementById('app');
  },

  renderStart() {
    this.app.innerHTML = `
      <div class="start-screen screen-shell">
        <div class="grain-overlay" aria-hidden="true"></div>
        <header class="top-nav">
          <div class="brand">MAGIC or METAL</div>
          <nav class="top-links" aria-label="Primary">
            <a href="#" aria-current="page">The Void</a>
            <a href="#">Rituals</a>
            <a href="#">High Scores</a>
            <a href="#">Archive</a>
          </nav>
          <div class="top-icons" aria-hidden="true">
            <span>↺</span>
            <span>⚙</span>
            <span>◼</span>
          </div>
        </header>

        <main class="start-hero">
          <div class="hero-runes hero-runes-left">ᛖ ᛏ ᛊ ᛟ ᛗ</div>
          <h1 class="hero-title">
            <span class="hero-magic">MAGIC</span>
            <span class="hero-or">or</span>
            <span class="hero-metal">METAL</span>
          </h1>
          <p class="hero-subtitle">THE RELIC ARCHIVE PROTOCOL</p>

          <button class="btn-relic-play" onclick="Game.startRound()" autofocus>
            <span class="play-triangle">▶</span>
            <span>PLAY</span>
          </button>

          <div class="hero-runes hero-runes-right">ᛗ ᛖ ᛏ ᚨ ᛚ</div>
        </main>

        <footer class="start-meta">
          <div class="meta-stats">
            <div>
              <span class="meta-label">Index Size</span>
              <strong>${Data.mtgNames.length.toLocaleString()} Cards</strong>
            </div>
            <div>
              <span class="meta-label">Audio Mass</span>
              <strong>${Data.metalSongs.length.toLocaleString()} Songs</strong>
            </div>
          </div>
          <div class="meta-credits">
            <p>Created with GitHub Copilot</p>
            <p>Data provisioned by Scryfall</p>
            <p>Acoustic signatures by MusicBrain</p>
          </div>
        </footer>

        <div class="ember-container" aria-hidden="true">
          <div class="ember"></div><div class="ember"></div><div class="ember"></div>
          <div class="ember"></div><div class="ember"></div><div class="ember"></div>
        </div>
      </div>
    `;
  },

  renderQuestion(question, index, total) {
    const score = Game.answers.filter(a => a.correct).length;
    const progressPct = (index / total) * 100;

    this.app.innerHTML = `
      <div class="prompt-screen screen-shell">
        <div class="grain-overlay" aria-hidden="true"></div>

        <header class="prompt-header">
          <div>
            <p class="prompt-kicker">Current Trial</p>
            <h2 class="prompt-title">THE ORACLE'S ALTAR</h2>
          </div>
          <p class="prompt-score" aria-live="polite">Score: <strong>${score}</strong></p>
        </header>

        <div class="prompt-progress" role="progressbar" aria-valuenow="${index}" aria-valuemin="0" aria-valuemax="${total}">
          <div class="prompt-progress-fill" style="width: ${progressPct}%"></div>
        </div>

        <aside class="prompt-rail" aria-hidden="true">
          <span>📖</span>
          <span>🏆</span>
          <span>⚙</span>
        </aside>

        <main class="prompt-main">
          <article class="oracle-card animate-enter" role="status" aria-live="assertive">
            <div class="oracle-card-head">
              <span>ANCIENT RELIC</span>
              <span>✦</span>
            </div>
            <p class="phrase">${this.escapeHtml(question.text)}</p>
            <div class="oracle-lore-wrap">
              <p class="oracle-lore">"Born from the iron pits, fueled by necrotic whispers."</p>
              <p class="oracle-meta">Lvl.${String(index + 1).padStart(2, '0')} • Tier: Void</p>
            </div>
          </article>

          <div class="answer-buttons">
            <button class="btn-answer btn-magic" onclick="Game.submitAnswer('magic')" aria-label="Magic: The Gathering card">
              <span>MAGIC</span><span class="btn-mark" aria-hidden="true">✦</span>
            </button>
            <button class="btn-answer btn-metal" onclick="Game.submitAnswer('metal')" aria-label="Heavy Metal song">
              <span>METAL</span><span class="btn-mark" aria-hidden="true">⛓</span>
            </button>
          </div>

          <div class="hint-text">Press <kbd>1</kbd> or <kbd>←</kbd> for Magic <span>•</span> <kbd>2</kbd> or <kbd>→</kbd> for Metal</div>
        </main>

        <footer class="prompt-footer">
          <span class="prompt-live-dot"></span>
          <span>Oracle Connection Stable</span>
          <div class="prompt-footer-links">
            <span>Help</span>
            <span>Pause</span>
          </div>
        </footer>

        <div class="screen-readout">${index + 1} / ${total}</div>
      </div>
    `;
  },

  showFeedback(correct, userAnswer) {
    const card = document.querySelector('.oracle-card');
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
      pct === 100 ? 'Perfect calibration. The Archive salutes you.'
      : pct >= 80 ? 'A strong reading from the void.'
      : pct >= 60 ? 'You are close. Keep refining your ear and your eye.'
      : pct >= 40 ? 'Room for improvement...'
      : 'The relic rejects this reading.';

    const cards = answers.map((a, i) => this.renderResultCard(a, i)).join('');

    this.app.innerHTML = `
      <div class="results-screen screen-shell">
        <div class="grain-overlay" aria-hidden="true"></div>

        <header class="top-nav results-nav">
          <div class="brand">MAGIC VS METAL</div>
          <div class="top-icons" aria-hidden="true">
            <span>▮▮</span>
            <span>⚙</span>
            <span>◼</span>
          </div>
        </header>

        <main class="results-main">
          <section class="results-hero">
            <h2 class="results-title">The Archive of Souls</h2>
            <div class="score-display">
              <span class="score-number">${score}</span>
              <span class="score-divider">/</span>
              <span class="score-total">${total}</span>
            </div>
            <p class="results-message">${message}</p>
            <p class="results-pct">${pct}% accuracy</p>
            ${loading ? '<p class="loading-details">Transcribing relic details...</p>' : ''}
          </section>

          <section class="results-list-wrap">
            <p class="results-list-label">Transcription of the Round</p>
            <div class="results-list">${cards}</div>
          </section>

          <section class="share-section">
            <h3>Share Your Soul</h3>
            <div class="share-buttons">
              <a class="btn-share" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`I scored ${score}/${total} (${pct}%) on Magic or Metal! Can you do better?`)}&url=${encodeURIComponent(window.location.origin + window.location.pathname)}" target="_blank" rel="noopener" aria-label="Share on X">↗</a>
              <a class="btn-share" href="https://discord.com/" target="_blank" rel="noopener" aria-label="Open Discord">👥</a>
              <button class="btn-share" onclick="UI.copyShareLink(${score}, ${total}, ${pct})" aria-label="Copy link">⛓</button>
            </div>
          </section>

          <div class="results-actions">
            <button class="btn-relic-play" onclick="Game.startRound()" autofocus>
              <span>PLAY AGAIN</span>
            </button>
          </div>
        </main>
      </div>
    `;
  },

  renderResultCard(answer, index) {
    const { question, correct, cardDetails, albumArt } = answer;
    const label = question.answer === 'magic' ? 'MAGIC CARD' : 'METAL SONG';
    const icon = correct ? '✓' : '✕';
    const stateClass = correct ? 'result-correct' : 'result-wrong';
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
            <h4>${this.escapeHtml(cardDetails.name || question.text)}</h4>
            <p class="detail-type">
              ${this.escapeHtml(cardDetails.typeLine || '')}
              ${cardDetails.manaCost ? `<span class="mana-cost">${this.formatManaCost(cardDetails.manaCost)}</span>` : ''}
            </p>
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
            <h4>${this.escapeHtml(question.text)}</h4>
            <p class="detail-type">Magic: The Gathering Card</p>
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
            <h4>${this.escapeHtml(question.text)}</h4>
            <p class="detail-type">${this.escapeHtml(question.band || 'Unknown')}</p>
            <p class="oracle-text">Album: ${this.escapeHtml(question.album || 'Unknown')}</p>
          </div>
        </div>
      `;
    }

    return `
      <article class="result-row ${stateClass}" style="animation-delay: ${delay}s">
        <div class="result-badge">
          <span class="result-label">${label}</span>
          <span class="result-icon">${icon}</span>
        </div>
        ${details}
      </article>
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
      const cls = symbol.toLowerCase().replace(/\//g, '');
      return `<i class="ms ms-${cls} ms-cost" aria-hidden="true"></i>`;
    });
  },

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
    requestAnimationFrame(() => container.classList.add('sc-player-visible'));
  },

  hidePlayer() {
    const el = document.getElementById('sc-player');
    if (el) el.remove();
  },

  copyShareLink(score, total, pct) {
    const text = `I scored ${score}/${total} (${pct}%) on Magic or Metal! ${window.location.origin}${window.location.pathname}`;
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
