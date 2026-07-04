import Phaser from "phaser";
import "./styles.css";

const WIDTH = 640;
const HEIGHT = 480;
const QUESTION_HEIGHT = 200;
const ANSWER_HEIGHT = (HEIGHT - QUESTION_HEIGHT) / 4;
const GAME_RESOLUTION = 1;
const TEXT_RESOLUTION = 1;
const TITLE_TEXT_RESOLUTION = 0.9;

const COLORS = {
  background: 0x05070d,
  panel: 0x0c1520,
  panelAlt: 0x101d2a,
  panelDark: 0x070b12,
  text: 0xf2f7ff,
  muted: 0x93a8b8,
  amber: 0xffcf5a,
  cyan: 0x37d5ff,
  blue: 0x1d6dff,
  red: 0xff4f5d,
  ink: 0x03050a
};

const FONT_BODY =
  'Monaco, "Lucida Console", "Courier New", "Roboto Mono", monospace';
const FONT_TITLE =
  '"Arial Black", "Courier New", Impact, "Roboto Mono", monospace';

const textStyle = (overrides = {}) => ({
  fontFamily: FONT_BODY,
  color: "#f2f7ff",
  resolution: TEXT_RESOLUTION,
  ...overrides
});

class QuizScene extends Phaser.Scene {
  constructor() {
    super("quiz");
    this.state = "loading";
    this.questionIndex = 0;
    this.answers = [];
    this.hotspots = [];
    this.choiceTicker = null;
  }

  preload() {
    this.load.json("quiz", "data/quiz.json");
  }

  create() {
    this.quiz = this.cache.json.get("quiz");
    this.loadQuizImages();

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.input.setDefaultCursor("default");
    this.drawTextureLibrary();

    // Check for a query parameter to jump to a specific screen
    const params = new URLSearchParams(window.location.search);
    const targetScreen = params.get('screen');

    if (targetScreen) {
      this.jumpToScreen(targetScreen);
    } else {
      this.showStart();
    }
  }

  jumpToScreen(screen) {
    switch (screen) {
      case 'start':
        this.showStart();
        break;
      case 'question':
        this.questionIndex = 0; // Or set to a specific question index if desired
        this.showQuestion();
        break;
      case 'result':
        this.showResult();
        break;
      default:
        console.warn(`Unknown screen: ${screen}`);
        this.showStart();
    }
  }

  loadQuizImages() {
    const paths = new Set([
      ...this.quiz.questions.map((question) => question.image)
    ]);

    for (const path of paths) {
      this.load.svg(path, path, { width: 180, height: 180 });
    }
    this.load.image(this.quiz.result.image, this.quiz.result.image)
    this.load.image(this.quiz.start.image, this.quiz.start.image)

    this.load.once("complete", () => {
      if (this.state === "start") {
        this.drawStartArt();
      }
    });
    this.load.start();
  }

  drawTextureLibrary() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.cyan, 1);
    g.fillTriangle(0, 0, 18, 8, 0, 16);
    g.generateTexture("arrow", 18, 16);
    g.clear();

    g.lineStyle(2, COLORS.cyan, 0.7);
    g.strokeCircle(12, 12, 10);
    g.lineBetween(12, 4, 12, 20);
    g.lineBetween(4, 12, 20, 12);
    g.generateTexture("spark", 24, 24);
    g.clear();

    g.fillStyle(0xffffff, 1);
    g.fillCircle(1, 1, 1);
    g.generateTexture("star", 2, 2);
    g.destroy();
  }

  clearScreen() {
    this.children.removeAll();
    this.hotspots = [];
    this.input.removeAllListeners("pointermove");
    this.input.removeAllListeners("pointerdown");
  }

  showStart() {
    this.state = "start";
    this.clearScreen();
    this.drawBackground();
    this.drawStartArt();

    this.add
      .text(WIDTH / 2, 86, this.quiz.title.toUpperCase(), textStyle({
        fontFamily: FONT_TITLE,
        fontSize: "30px",
        color: "#f2f7ff",
        align: "center",
        letterSpacing: 0,
        resolution: TITLE_TEXT_RESOLUTION,
        wordWrap: { width: 560 }
      }))
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, 143, this.quiz.subtitle.toUpperCase(), textStyle({
        fontSize: "14px",
        color: "#ffcf5a",
        align: "center",
        resolution: 0.8
      }))
      .setOrigin(0.5);

    this.drawButton(WIDTH / 2 - 86, 358, 172, 46, this.quiz.startButton.toUpperCase(), () => {
      this.questionIndex = 0;
      this.answers = [];
      this.transitionTo(() => this.showQuestion());
    }, 1);

    this.add
      .text(WIDTH / 2, 430, "A Percival WebSystems WebSystem", textStyle({
        fontSize: "12px",
        color: "#93a8b8"
      }))
      .setOrigin(0.5);
  }

  drawStartArt() {
    if (!this.textures.exists(this.quiz.start.image)) {
      return;
    }

    this.add.image(WIDTH / 2, 280, this.quiz.start.image)
      .setDisplaySize(640, 214)
      .setDepth(0)
      .setAlpha(0.4);
    this.add
      .particles(0, 0, "spark", {
        x: { min: 220, max: 420 },
        y: { min: 205, max: 305 },
        lifespan: 2200,
        speedY: { min: -8, max: -20 },
        speedX: { min: -8, max: 8 },
        alpha: { start: 0.28, end: 0 },
        scale: { start: 0.32, end: 0.04 },
        frequency: 280,
        quantity: 1
      })
      .setDepth(-2);
  }

  showQuestion() {
    this.state = "question";
    this.clearScreen();
    this.drawBackground();

    const question = this.quiz.questions[this.questionIndex];
    this.drawQuestionPanel(question);
    question.answers.forEach((answer, index) => this.drawAnswer(answer, index));
    this.drawProgress();
    this.bindHover();
  }

  drawQuestionPanel(question) {
    this.add.rectangle(0, 0, WIDTH, QUESTION_HEIGHT, COLORS.panel, 0.95).setOrigin(0);
    this.add.rectangle(0, QUESTION_HEIGHT - 2, WIDTH, 2, COLORS.cyan, 0.62).setOrigin(0);
    this.add.rectangle(0, 0, 180, QUESTION_HEIGHT, COLORS.ink, 0.72).setOrigin(0);
    this.add.rectangle(10, 10, 160, 180).setOrigin(0).setStrokeStyle(1, COLORS.cyan, 0.55);
    this.add.rectangle(12, 174, 156, 14, COLORS.cyan, 0.12).setOrigin(0);

    if (this.textures.exists(question.image)) {
      this.add.image(90, 96, question.image).setDisplaySize(156, 156);
    }

    this.add
      .text(198, 15, "TRANSMISSION // SCENARIO ANALYSIS", textStyle({
        fontSize: "11px",
        color: "#ffcf5a"
      }))
      .setOrigin(0);

    this.add
      .text(198, 35, question.question, textStyle({
        fontSize: "12px",
        color: "#f2f7ff",
        lineSpacing: 1,
        wordWrap: { width: 412 }
      }))
      .setOrigin(0);
  }

  drawAnswer(answer, index) {
    const y = QUESTION_HEIGHT + index * ANSWER_HEIGHT;
    const fill = index % 2 === 0 ? COLORS.panelAlt : 0x09131d;
    const hit = this.add.rectangle(0, y, WIDTH, ANSWER_HEIGHT, fill).setOrigin(0);
    const border = this.add.rectangle(0, y, WIDTH, ANSWER_HEIGHT).setOrigin(0);
    border.setStrokeStyle(1, COLORS.cyan, 0.18);
    this.add.rectangle(14, y + 10, 32, ANSWER_HEIGHT - 20, COLORS.cyan, 0.08).setOrigin(0);

    const label = this.add
      .text(72, y + ANSWER_HEIGHT / 2, answer, textStyle({
        fontSize: "14px",
        color: "#f2f7ff",
        lineSpacing: 3,
        wordWrap: { width: 520 }
      }))
      .setOrigin(0, 0.5);

    const arrow = this.add.image(34, y + ANSWER_HEIGHT / 2, "arrow").setAlpha(0.7);
    const hotspot = { index, hit, border, label, arrow, y };
    this.hotspots.push(hotspot);

    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => this.setAnswerHover(hotspot, true));
    hit.on("pointerout", () => this.setAnswerHover(hotspot, false));
    hit.on("pointerdown", () => this.chooseAnswer(index));
  }

  drawProgress() {
    const current = this.questionIndex + 1;
    this.add
      .text(WIDTH - 24, 20, `${current}/${this.quiz.questions.length}`, {
        fontFamily: FONT_BODY,
        fontSize: "14px",
        color: "#ffcf5a",
        resolution: TEXT_RESOLUTION
      })
      .setOrigin(1, 0);
  }

  bindHover() {
    this.input.on("pointermove", (pointer) => {
      const hovering = this.hotspots.some((spot) =>
        Phaser.Geom.Rectangle.Contains(
          new Phaser.Geom.Rectangle(0, spot.y, WIDTH, ANSWER_HEIGHT),
          pointer.x,
          pointer.y
        )
      );
      this.input.setDefaultCursor(hovering ? "pointer" : "default");
    });
  }

  setAnswerHover(hotspot, active) {
    this.tweens.killTweensOf([hotspot.hit, hotspot.arrow, hotspot.label]);
    this.tweens.add({
      targets: hotspot.hit,
      alpha: active ? 0.88 : 1,
      duration: 140,
      ease: "Quad.easeOut"
    });
    this.tweens.add({
      targets: hotspot.arrow,
      x: active ? 44 : 34,
      alpha: active ? 1 : 0.7,
      duration: 160,
      ease: "Back.easeOut"
    });
    hotspot.border.setStrokeStyle(2, active ? COLORS.amber : COLORS.cyan, active ? 0.86 : 0.18);
    hotspot.label.setColor(active ? "#fff2b8" : "#f2f7ff");
  }

  chooseAnswer(index) {
    const question = this.quiz.questions[this.questionIndex];
    this.answers.push({ questionId: question.id, answerIndex: index });

    const selected = this.hotspots[index];
    this.tweens.add({
      targets: selected.hit,
      alpha: 0.45,
      yoyo: true,
      duration: 110,
      onComplete: () => {
        this.questionIndex += 1;
        if (this.questionIndex >= this.quiz.questions.length) {
          this.transitionTo(() => this.showResult());
        } else {
          this.transitionTo(() => this.showQuestion());
        }
      }
    });
  }

  showResult() {
    this.state = "result";
    this.clearScreen();
    this.drawBackground();

    const result = this.quiz.result;
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.panel, 0.86).setOrigin(0);
    this.add.rectangle(34, 34, 572, 412, COLORS.ink, 0.58).setOrigin(0).setStrokeStyle(2, COLORS.cyan, 0.62);
    // this.add.rectangle(48, 48, 544, 24, COLORS.cyan, 0.1).setOrigin(0);

    if (this.textures.exists(result.image)) {
      this.add.image(143, 164, result.image).setDisplaySize(178, 178);
    }

    this.add
      .text(272, 88, "MATCH FOUND", textStyle({
        fontSize: "15px",
        color: "#ffcf5a"
      }))
      .setOrigin(0);
    this.add
      .text(272, 116, result.name.toUpperCase(), textStyle({
        fontFamily: FONT_TITLE,
        fontSize: "26px",
        color: "#f2f7ff"
      }))
      .setOrigin(0);
    this.add
      .text(272, 160, result.summary, textStyle({
        fontSize: "15px",
        color: "#f2f7ff",
        lineSpacing: 3,
        wordWrap: { width: 285 }
      }))
      .setOrigin(0);
    this.add
      .text(76, 275, result.description, textStyle({
        fontSize: "14px",
        color: "#cbd8e2",
        lineSpacing: 4,
        wordWrap: { width: 488 }
      }))
      .setOrigin(0);

    this.add
      .particles(0, 0, "spark", {
        x: { min: 78, max: 570 },
        y: { min: 380, max: 430 },
        lifespan: 2600,
        speedY: { min: -12, max: -36 },
        speedX: { min: -12, max: 12 },
        alpha: { start: 0.26, end: 0 },
        scale: { start: 0.32, end: 0.04 },
        frequency: 220
      })
      .setDepth(0);

    this.drawButton(WIDTH / 2 - 70, 380, 140, 40, "RE-RUN", () => {
      this.transitionTo(() => this.showStart());
    });
  }

  drawButton(x, y, width, height, label, onClick, depth = 0) {
    const bg = this.add.rectangle(x, y, width, height, COLORS.amber).setOrigin(0).setDepth(depth);
    const border = this.add.rectangle(x, y, width, height).setOrigin(0).setStrokeStyle(2, COLORS.cyan, 0.9).setDepth(depth);
    const text = this.add
      .text(x + width / 2, y + height / 2, label, textStyle({
        fontFamily: FONT_TITLE,
        fontSize: "19px",
        color: "#03050a"
      }))
      .setOrigin(0.5)
      .setDepth(depth);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      this.tweens.add({ targets: [bg, border, text], scaleX: 1.035, scaleY: 1.035, duration: 120 });
    });
    bg.on("pointerout", () => {
      this.tweens.add({ targets: [bg, border, text], scaleX: 1, scaleY: 1, duration: 120 });
    });
    bg.on("pointerdown", onClick);
    if (depth !== undefined){
      bg.depth = depth
    }
  }

  drawBackground() {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.background).setOrigin(0);
    for (let i = 0; i < 58; i += 1) {
      const x = (i * 97) % WIDTH;
      const y = (i * 53) % HEIGHT;
      const alpha = 0.18 + ((i % 5) * 0.08);
      this.add.rectangle(x, y, i % 7 === 0 ? 2 : 1, 1, 0xffffff, alpha).setOrigin(0);
    }

    this.add.circle(92, 66, 86, COLORS.red, 0.1);
    this.add.circle(520, 405, 118, COLORS.blue, 0.12);

    const grid = this.add.graphics();
    grid.lineStyle(1, COLORS.cyan, 0.06);
    for (let x = 0; x <= WIDTH; x += 32) {
      grid.lineBetween(x, 0, x, HEIGHT);
    }
    for (let y = 0; y <= HEIGHT; y += 24) {
      grid.lineBetween(0, y, WIDTH, y);
    }
    grid.lineStyle(1, COLORS.cyan, 0.2);
    grid.strokeRect(0.5, 0.5, WIDTH - 1, HEIGHT - 1);

    for (let y = 0; y < HEIGHT; y += 6) {
      this.add.rectangle(0, y, WIDTH, 1, 0xffffff, 0.025).setOrigin(0);
    }
  }

  transitionTo(next) {
    this.cameras.main.fadeOut(180, 20, 19, 25);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      next();
      this.cameras.main.fadeIn(220, 20, 19, 25);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: WIDTH,
  height: HEIGHT,
  resolution: GAME_RESOLUTION,
  backgroundColor: COLORS.background,
  scene: QuizScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  }
};

new Phaser.Game(config);
