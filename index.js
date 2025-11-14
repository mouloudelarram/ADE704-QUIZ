async function fetchQuestions() {
  const res = await fetch("questions.json");
  const data = await res.json();

  return data;
}

class Toast {
  static popup(correct) {
    const texte = `${correct ? "✅ Bonne" : "🔴 Mauvaise"} réponse`;
    document.querySelector(".toast")?.remove();
    document.body.insertAdjacentHTML(
      "afterbegin",
      `
            <div class="toast ${correct ? "correct" : "wrong"}">${texte}</div>
        `
    );
  }

  static unpop() {
    document.querySelector(".toast")?.remove();
  }
}

class Card {
  question;
  options;
  answer;
  id;
  isCorrect;

  constructor(question, options, answer, id) {
    this.question = question;
    this.options = options;
    this.answer = answer;
    this.id = id;
  }

  generateOption(option, correct) {
    if (correct) {
      return `
            <li class="card__option" data-correct="correct">${option}</li>
        `;
    }
    return `
        <li class="card__option">${option}</li>
    `;
  }

  #shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  generateCard() {
    const acc = this.options.map((o, i) =>
      this.generateOption(o, this.answer === i + 1)
    );

    this.#shuffleArray(acc);
    return `
          <div class="card" id="qid${this.id}">
              <h2 class="card__question">${this.question}</h2>
              <ul class="card__options">
                ${acc.join("")}
              </ul>
          </div>
      `;
  }

  listenCard(Quizz) {
    const card = document.querySelector(`.card#qid${this.id}`);
    let locked = false;
    card.addEventListener("click", (e) => {
      if (locked) return;
      locked = true;
      const target = e.target;
      if (!target.classList.contains("card__option")) {
        locked = false;
        return;
      }
      const correctAnswer =
        !!target.dataset.correct && target.dataset.correct === "correct";
      this.isCorrect = correctAnswer;

      if (this.isCorrect) {
        target.classList.add("correct");
      } else {
        target.classList.add("wrong");
        card
          .querySelector(".card__option[data-correct]")
          .classList.add("correct");
      }
      Toast.popup(this.isCorrect);
    });
  }
}

class Score {
  correctSpan;
  incorrectSpan;
  notAnsweredSpan;

  constructor(correctSpan, incorrectSpan, notAnsweredSpan, total) {
    this.correctSpan = correctSpan;
    this.incorrectSpan = incorrectSpan;
    this.notAnsweredSpan = notAnsweredSpan;
    this.total;
  }

  setScore(correct, incorrect, notAnswered) {
    this.correctSpan.innerHTML = "";
    this.incorrectSpan.innerHTML = "";
    this.notAnsweredSpan.innerHTML = "";

    this.correctSpan.insertAdjacentHTML(
      "afterbegin",
      `
        <span class="score">
            ${correct}
        </span>
    `
    );

    this.incorrectSpan.insertAdjacentHTML(
      "afterbegin",
      `
        <span class="score">
            ${incorrect}
        </span>
    `
    );

    this.notAnsweredSpan.insertAdjacentHTML(
      "afterbegin",
      `
      <span class="score">
          ${notAnswered}
      </span>
  `
    );
  }
}

class Quizz {
  #questions;
  currentQuestion = 0;
  timer;
  #shuffledQuestions;
  correctAnswers = 0;
  incorrectAnswers = 0;
  notAnswered = 0;
  app;
  locked = false;
  score;
  currentCard;
  questionPointer;

  constructor(questions, app) {
    this.#questions = questions;
    this.app = app;
    this.score = new Score(
      document.querySelector(".correct > .score"),
      document.querySelector(".wrong > .score"),
      document.querySelector(".stats__stat.neutral > .score"),
      questions.length
    );
    this.questionPointer = document.querySelector("#question-pointer");
    this.start();
  }

  start() {
    this.#shuffledQuestions = this.#questions
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    this.correctAnswers = this.incorrectAnswers = this.notAnswered = 0;
    this.score.setScore(0, 0, 0);
    this.questionPointer.textContent = `Question 1 / ${
      this.#shuffledQuestions.length
    }`;
    this.popQuestion();
  }

  popQuestion() {
    const question = this.#shuffledQuestions[this.currentQuestion];
    this.questionPointer.textContent = `Question ${
      this.currentQuestion + 1
    } / ${this.#shuffledQuestions.length}`;
    const card = new Card(
      question.question,
      question.choix,
      question.reponse,
      this.currentQuestion
    );
    this.currentCard = card;
    this.app.innerHTML = "";
    this.app.insertAdjacentHTML("afterbegin", this.currentCard.generateCard());
    this.currentCard.listenCard(this);
  }

  next(correct) {
    this.currentQuestion++;
    if (correct === true) {
      this.correctAnswers++;
    } else if (correct === false) {
      this.incorrectAnswers++;
    } else {
      this.notAnswered++;
    }
    this.score.setScore(
      this.correctAnswers,
      this.incorrectAnswers,
      this.notAnswered
    );

    if (this.currentQuestion === this.#questions.length) {
      this.finalScore();
      return;
    }

    this.popQuestion();
  }

  
  finalScore() {
    const note =
      ((this.correctAnswers - this.incorrectAnswers) * 20) /
      this.#questions.length;
    const noteArrondie = Math.round((note + Number.EPSILON) * 100) / 100;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="final">
            <div class="final__result">
                <h2>Votre score final</h2>
                <div class="body-stat">
                    <p class="body-stat__stat correct-body">${
                      this.correctAnswers
                    } ✅<p>
                    <p class="body-stat__stat neutral-body">${
                      this.notAnswered
                    } ◽<p>
                    <p class="body-stat__stat wrong-body">${
                      this.incorrectAnswers
                    } 🔴<p>
                </div>
                <button type="button" class="primary" id="restart">🎓 Rejouer</button>
            </div>
        </div>
    `
    );

    document.querySelector("#restart").addEventListener("click", function () {
      window.location.reload();
    });
  }
}

window.addEventListener("DOMContentLoaded", async function () {
  const app = document.querySelector("#app");
  const nextBtn = document.querySelector("button#next");
  const questions = await fetchQuestions();

  if (app) {
    const quizz = new Quizz(questions, app);
    nextBtn.addEventListener("click", () => {
      quizz.next(quizz.currentCard.isCorrect);
      Toast.unpop();
    });
  }
});
