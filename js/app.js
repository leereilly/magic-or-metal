/**
 * Game state machine — manages rounds, scoring, and question flow.
 */
const STATES = { START: 'start', QUIZ: 'quiz', RESULTS: 'results' };

const Game = {
  state: STATES.START,
  questions: [],
  currentIndex: 0,
  answers: [],
  roundSize: 10,

  async init() {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    this.roundSize = parseInt(params.get('n'), 10) || 10;
    this.timerSeconds = parseInt(params.get('timer'), 10) || 0;

    await Data.load();
    UI.renderStart();
  },

  startRound(count) {
    count = count || this.roundSize;
    this.state = STATES.QUIZ;
    this.currentIndex = 0;
    this.answers = [];
    this.questions = this.selectQuestions(count);
    UI.showPlayer(Data.getRandomTrack());
    UI.renderQuestion(this.questions[0], 0, count);
  },

  selectQuestions(count) {
    const half = Math.floor(count / 2);
    const mtg = shuffle(Data.mtgNames).slice(0, half).map(name => ({
      text: name, answer: 'magic'
    }));
    const metal = shuffle(Data.metalSongs).slice(0, count - half).map(song => ({
      text: song.title, answer: 'metal',
      band: song.band, album: song.album
    }));
    return shuffle([...mtg, ...metal]);
  },

  submitAnswer(userAnswer) {
    if (this.state !== STATES.QUIZ) return;

    const q = this.questions[this.currentIndex];
    const correct = userAnswer === q.answer;
    this.answers.push({ question: q, userAnswer, correct });

    // Disable buttons to prevent double-tap
    document.querySelectorAll('.answer-buttons button').forEach(btn => {
      btn.disabled = true;
    });

    UI.showFeedback(correct, userAnswer);

    setTimeout(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.questions.length) {
        this.showResults();
      } else {
        UI.renderQuestion(
          this.questions[this.currentIndex],
          this.currentIndex,
          this.questions.length
        );
      }
    }, 900);
  },

  async showResults() {
    this.state = STATES.RESULTS;
    const score = this.answers.filter(a => a.correct).length;

    UI.renderResults(this.answers, score, this.questions.length, true);

    // Fetch Scryfall details for wrong MTG answers
    const wrongMtg = this.answers.filter(
      a => !a.correct && a.question.answer === 'magic'
    );

    if (wrongMtg.length > 0) {
      const cardDetails = await Promise.all(
        wrongMtg.map((a, i) =>
          new Promise(resolve =>
            setTimeout(() => Data.fetchCardDetails(a.question.text).then(resolve), i * 100)
          )
        )
      );

      let detailIndex = 0;
      for (const a of this.answers) {
        if (!a.correct && a.question.answer === 'magic') {
          a.cardDetails = cardDetails[detailIndex++];
        }
      }
    }

    // Fetch album art for wrong metal answers
    const wrongMetal = this.answers.filter(
      a => !a.correct && a.question.answer === 'metal'
    );

    if (wrongMetal.length > 0) {
      const albumArts = await Promise.all(
        wrongMetal.map((a, i) =>
          new Promise(resolve =>
            setTimeout(() => Data.fetchAlbumArt(a.question.band, a.question.album).then(resolve), i * 150)
          )
        )
      );

      let artIndex = 0;
      for (const a of this.answers) {
        if (!a.correct && a.question.answer === 'metal') {
          a.albumArt = albumArts[artIndex++];
        }
      }
    }

    // Re-render with card details and album art (or clear loading state)
    UI.renderResults(this.answers, score, this.questions.length, false);
  }
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (Game.state === STATES.QUIZ) {
    if (e.key === '1' || e.key === 'm' || e.key === 'ArrowLeft') {
      Game.submitAnswer('magic');
    } else if (e.key === '2' || e.key === 'e' || e.key === 'ArrowRight') {
      Game.submitAnswer('metal');
    }
  } else if (Game.state === STATES.START || Game.state === STATES.RESULTS) {
    if (e.key === 'Enter' || e.key === ' ') {
      Game.startRound();
    }
  }
});

// Boot
document.addEventListener('DOMContentLoaded', () => Game.init());
