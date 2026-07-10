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
  '"Roboto Mono","Arial Black", "Courier New", Impact, "Roboto Mono", monospace';

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
    this.screenTimers = [];
    this.pendingScreen = "loading";
  }

  preload() {
    this.load.json("quiz", "data/quiz.json");
  }

  create() {
    this.quiz = this.cache.json.get("quiz");

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.input.setDefaultCursor("default");
    this.drawTextureLibrary();

    const params = new URLSearchParams(window.location.search);
    this.pendingScreen = params.get("screen") || "loading";
    this.loadQuizImages();
  }

  jumpToScreen(screen) {
    switch (screen) {
      case 'loading':
        this.showLoading();
        break;
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
      case 'calculating':
        this.showCalculating();
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
    this.load.svg(this.quiz.start.logo, this.quiz.start.logo)
    this.load.svg(this.quiz.start.percival, this.quiz.start.percival)
    this.load.image(this.quiz.start.fade, this.quiz.start.fade)
    this.load.image(this.quiz.loading.blastDoorLeftUpper, this.quiz.loading.blastDoorLeftUpper)
    this.load.image(this.quiz.loading.blastDoorLeftLower, this.quiz.loading.blastDoorLeftLower)
    this.load.image(this.quiz.loading.blastDoorRightUpper, this.quiz.loading.blastDoorRightUpper)
    this.load.image(this.quiz.loading.blastDoorRightLower, this.quiz.loading.blastDoorRightLower)
    this.load.image(this.quiz.loading.secondDoorTop, this.quiz.loading.secondDoorTop)
    this.load.image(this.quiz.loading.secondDoorBottom, this.quiz.loading.secondDoorBottom)
    this.load.image(this.quiz.loading.secondDoorBar, this.quiz.loading.secondDoorBar)
    this.load.image(this.quiz.loading.secondDoorClasp, this.quiz.loading.secondDoorClasp)
  

    this.load.once("complete", () => {
      this.jumpToScreen(this.pendingScreen);
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
    this.screenTimers.forEach((timer) => timer.remove(false));
    this.screenTimers = [];
    this.children.removeAll();
    this.hotspots = [];
    this.input.removeAllListeners("pointermove");
    this.input.removeAllListeners("pointerdown");
  }

  trackTimer(timer) {
    this.screenTimers.push(timer);
    return timer;
  }

  drawStartScene() {
    this.drawBackground();
    // this.drawStartEdgeGradients();
    this.startGridPulseField();
    this.startStarburst();
    this.drawStartArt();

    // this.add
    //   .text(WIDTH / 2, 86, this.quiz.title.toUpperCase(), textStyle({
    //     fontFamily: FONT_TITLE,
    //     fontSize: "30px",
    //     color: "#f2f7ff",
    //     align: "center",
    //     letterSpacing: 0,
    //     resolution: TITLE_TEXT_RESOLUTION,
    //     wordWrap: { width: 560 }
    //   }))
    //   .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, 150, this.quiz.subtitle.toUpperCase(), textStyle({
        fontFamily: FONT_TITLE,
        fontSize: "20px",
        color: "#ffcf5a",
        align: "center",
        resolution: 0.8
      }))
      .setOrigin(0.5);

    this.drawButton(WIDTH / 2 - 100, 358, 200, 46, this.quiz.startButton.toUpperCase(), () => {
      this.questionIndex = 0;
      this.answers = [];
      this.transitionTo(() => this.showQuestion());
    }, 1);

    this.add
      .text(WIDTH / 2, 430, "© Percival Software", textStyle({
        fontSize: "12px",
        color: "#93a8b8"
      }))
      .setOrigin(0.5);
  }
  
  showStart() {
    this.state = "start";
    this.clearScreen();
    this.drawStartScene();
  }

  showLoading() {
    this.state = "loading";
    this.clearScreen();
    this.drawStartScene();
    this.drawSecondDoorLayer();
    this.drawBlastDoors();
  }

  drawBlastDoors() {
    const leftUpper = this.add.image(0, 0, this.quiz.loading.blastDoorLeftUpper).setOrigin(0, 0).setDepth(19);
    const leftLower = this.add.image(0, HEIGHT, this.quiz.loading.blastDoorLeftLower).setOrigin(0, 1).setDepth(20);
    const rightUpper = this.add.image(WIDTH, 0, this.quiz.loading.blastDoorRightUpper).setOrigin(1, 0).setDepth(20);
    const rightLower = this.add.image(WIDTH, HEIGHT, this.quiz.loading.blastDoorRightLower).setOrigin(1, 1).setDepth(19);

    const leftTargetX = -leftUpper.displayWidth;
    const rightTargetX = WIDTH + rightUpper.displayWidth;

    this.trackTimer(
      this.time.delayedCall(1000, () => {
        const duration = 1250;
        const ease = "Cubic.easeInOut";
        [leftUpper, leftLower].forEach((doorPart) => {
          this.tweens.add({
            targets: doorPart,
            x: leftTargetX,
            duration,
            ease
          });
        });
        [rightUpper, rightLower].forEach((doorPart) => {
          this.tweens.add({
            targets: doorPart,
            x: rightTargetX,
            duration,
            ease
          });
        });

        this.trackTimer(
          this.time.delayedCall(duration + 80, () => {
            [leftUpper, leftLower, rightUpper, rightLower].forEach((doorPart) => doorPart.destroy());
          })
        );
      })
    );
  }

  drawSecondDoorLayer() {
    const topPanel = this.add.image(WIDTH / 2, 0, this.quiz.loading.secondDoorTop).setOrigin(0.5, 0).setDepth(10);
    const bottomPanel = this.add.image(WIDTH / 2, HEIGHT, this.quiz.loading.secondDoorBottom).setOrigin(0.5, 1).setDepth(10);

    const topBarY = Math.round(110);
    const bottomBarY = Math.round(370);
    const topBar = this.add.image(WIDTH / 2, topBarY, this.quiz.loading.secondDoorBar).setOrigin(0.5, 0.5).setFlipY(true).setDepth(12);
    const bottomBar = this.add.image(WIDTH / 2, bottomBarY, this.quiz.loading.secondDoorBar).setOrigin(0.5, 0.5).setFlipX(true).setDepth(12);

    const claspXs = [Math.round(238), Math.round(428)];
    const topClasps = claspXs.map((x) =>
      this.add.image(x, topBarY - 1, this.quiz.loading.secondDoorClasp).setOrigin(0.5, 0.5).setDepth(13)
    );
    const bottomClasps = claspXs.map((x) =>
      this.add.image(x, bottomBarY - 1, this.quiz.loading.secondDoorClasp).setOrigin(0.5, 0.5).setDepth(13)
    );

    this.trackTimer(
      this.time.delayedCall(2000, () => {
        const duration = 1100;
        this.tweens.add({
          targets: topBar,
          x: -topBar.displayWidth / 2,
          duration,
          ease: "Cubic.easeInOut"
        });
        this.tweens.add({
          targets: bottomBar,
          x: WIDTH + bottomBar.displayWidth / 2,
          duration,
          ease: "Cubic.easeInOut"
        });
      })
    );

    this.trackTimer(
      this.time.delayedCall(3000, () => {
        const duration = 1250;
        this.tweens.add({
          targets: [topPanel],
          y: -topPanel.displayHeight,
          duration,
          ease: "Cubic.easeInOut"
        });
        this.tweens.add({
          targets: [...topClasps],
          y: -120,
          duration,
          ease: "Cubic.easeInOut"
        });
        this.tweens.add({
          targets: [bottomPanel],
          y: HEIGHT + bottomPanel.displayHeight,
          duration,
          ease: "Cubic.easeInOut"
        });
        this.tweens.add({
          targets: [...bottomClasps],
          y: 610,
          duration,
          ease: "Cubic.easeInOut"
        });
        

        this.trackTimer(
          this.time.delayedCall(duration + 80, () => {
            [topPanel, bottomPanel, topBar, bottomBar, ...topClasps, ...bottomClasps].forEach((part) => part.destroy());
            if (this.state === "loading") {
              this.state = "start";
            }
          })
        );
      })
    );
  }

  // drawStartEdgeGradients() {
  //   const leftCenter = { x: -245, y: 108 };
  //   const rightCenter = { x: WIDTH + 245, y: HEIGHT - 102 };
  //   const rings = [
  //     { radius: 360, alpha: 0.08 },
  //     { radius: 300, alpha: 0.12 },
  //     { radius: 240, alpha: 0.16 },
  //     { radius: 180, alpha: 0.2 }
  //   ];

  //   rings.forEach(({ radius, alpha }) => {
  //     this.add.circle(leftCenter.x, leftCenter.y, radius, COLORS.red, alpha).setDepth(1);
  //     this.add.circle(rightCenter.x, rightCenter.y, radius, COLORS.blue, alpha).setDepth(1);
  //   });
  // }

  startGridPulseField() {
    for (let i = 0; i < 3; i += 1) {
      const pulse = this.createGridPulse(
        Phaser.Math.Between(110, WIDTH - 110),
        Phaser.Math.Between(90, HEIGHT - 90),
        Phaser.Math.Between(120, 185)
      );
      pulse.alpha = 0;

      this.tweens.add({
        targets: pulse,
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.55, 0.78) },
        duration: Phaser.Math.Between(3000, 4600),
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        repeatDelay: Phaser.Math.Between(500, 1200),
        delay: Phaser.Math.Between(0, 2200)
      });
    }
  }

  createGridPulse(centerX, centerY, radius) {
    const pulse = this.add.container(0, 0);
    const xStep = 32;
    const yStep = 24;

    for (let x = 0; x <= WIDTH; x += xStep) {
      for (let y = 0; y <= HEIGHT; y += yStep) {
        const distance = Phaser.Math.Distance.Between(x, y, centerX, centerY);
        if (distance > radius) {
          continue;
        }

        const normalized = 1 - distance / radius;
        const nodeAlpha = 0.08 + normalized * 0.28;
        const nodeSize = normalized > 0.72 ? 5 : 3;
        const node = this.add.rectangle(x, y, nodeSize, nodeSize, COLORS.cyan, nodeAlpha).setOrigin(0.5);
        pulse.add(node);

        if (x + xStep <= WIDTH) {
          const rightDistance = Phaser.Math.Distance.Between(x + xStep, y, centerX, centerY);
          if (rightDistance <= radius) {
            const segmentAlpha = 0.04 + normalized * 0.18;
            const hSegment = this.add.rectangle(x + xStep / 2, y, xStep - 6, 2, COLORS.cyan, segmentAlpha).setOrigin(0.5);
            pulse.add(hSegment);
          }
        }

        if (y + yStep <= HEIGHT) {
          const downDistance = Phaser.Math.Distance.Between(x, y + yStep, centerX, centerY);
          if (downDistance <= radius) {
            const segmentAlpha = 0.04 + normalized * 0.18;
            const vSegment = this.add.rectangle(x, y + yStep / 2, 2, yStep - 4, COLORS.cyan, segmentAlpha).setOrigin(0.5);
            pulse.add(vSegment);
          }
        }
      }
    }

    return pulse;
  }

  startStarburst() {
    for (let i = 0; i < 24; i += 1) {
      this.spawnStarburstDot(Phaser.Math.Between(0, 700));
    }

    this.trackTimer(
      this.time.addEvent({
        delay: 3,
        loop: true,
        callback: () => {
          this.spawnStarburstDot();
        }
      })
    );
  }

  spawnStarburstDot(initialDelay = 0) {
    const launch = () => {
      const centerX = WIDTH / 2 + Phaser.Math.FloatBetween(-12, 12);
      const centerY = HEIGHT / 2 + Phaser.Math.FloatBetween(-10, 10);
      const target = this.randomStarburstEdgePoint();
      const dotSize = Phaser.Math.Between(0.5, 1);
      const dot = this.add.circle(centerX, centerY, dotSize, 0xffffff, 0.5);

      const travel = Phaser.Math.Distance.Between(centerX, centerY, target.x, target.y);
      const duration = Phaser.Math.Clamp(travel * 10.8, 1250, 2600);

      this.tweens.add({
        targets: dot,
        x: target.x,
        y: target.y,
        alpha: { from: 0, to: 1 },
        scaleX: { from: 0.8, to: 1.25 },
        scaleY: { from: 0.8, to: 1.25 },
        duration,
        ease: "Quad.easeIn",
        onComplete: () => {
          dot.destroy();
        }
      });
    };

    if (initialDelay > 0) {
      this.trackTimer(
        this.time.delayedCall(initialDelay, launch)
      );
    } else {
      launch();
    }
  }

  randomStarburstEdgePoint() {
    const side = Phaser.Math.Between(0, 3);
    const padding = 20;

    switch (side) {
      case 0:
        return { x: Phaser.Math.Between(padding, WIDTH - padding), y: -padding };
      case 1:
        return { x: WIDTH + padding, y: Phaser.Math.Between(padding, HEIGHT - padding) };
      case 2:
        return { x: Phaser.Math.Between(padding, WIDTH - padding), y: HEIGHT + padding };
      default:
        return { x: -padding, y: Phaser.Math.Between(padding, HEIGHT - padding) };
    }
  }

  drawStartArt() {
    if (!this.textures.exists(this.quiz.start.image)) {
      return;
    }

    this.add.image(WIDTH / 2, 80, this.quiz.start.logo)
      .setDisplaySize(200,90)
    this.add.image(WIDTH / 2, 280, this.quiz.start.image)
      .setDisplaySize(640, 214)
      .setDepth(0)
      .setAlpha(0.4);
    this.add.image(WIDTH / 2, HEIGHT / 2, this.quiz.start.fade)
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
    const width = WIDTH;
    const height = ANSWER_HEIGHT;
    const notch = Math.min(20, Math.round(height * 0.48));
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const points = [
      -halfWidth, 0,
      -halfWidth + notch, -halfHeight,
      halfWidth - notch, -halfHeight,
      halfWidth, 0,
      halfWidth - notch, halfHeight,
      -halfWidth + notch, halfHeight
    ];
    const centerX = WIDTH / 2;
    const centerY = y + halfHeight;
    const container = this.add.container(centerX, centerY);

    const glow = this.add.graphics();
    glow.fillStyle(COLORS.amber, 0.05);
    glow.lineStyle(6, COLORS.amber, 0.05);
    glow.beginPath();
    glow.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      glow.lineTo(points[i], points[i + 1]);
    }
    glow.closePath();
    glow.fillPath();
    glow.strokePath();

    const bg = this.add.graphics();
    bg.fillStyle(index % 2 === 0 ? COLORS.panelAlt : 0x09131d, 0.96);
    bg.lineStyle(2, COLORS.cyan, 0.3);
    bg.beginPath();
    bg.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      bg.lineTo(points[i], points[i + 1]);
    }
    bg.closePath();
    bg.fillPath();
    bg.strokePath();

    const hoverBorder = this.add.graphics().setAlpha(0);
    hoverBorder.lineStyle(3, COLORS.amber, 0.95);
    hoverBorder.beginPath();
    hoverBorder.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      hoverBorder.lineTo(points[i], points[i + 1]);
    }
    hoverBorder.closePath();
    hoverBorder.strokePath();

    const accent = this.add.graphics();
    accent.lineStyle(1, COLORS.cyan, 0.12);
    accent.beginPath();
    accent.moveTo(-halfWidth + notch + 6, -halfHeight + 6);
    accent.lineTo(halfWidth - notch - 6, -halfHeight + 6);
    accent.moveTo(-halfWidth + notch + 6, halfHeight - 6);
    accent.lineTo(halfWidth - notch - 6, halfHeight - 6);
    accent.strokePath();

    const arrowGlow = this.add.image(-halfWidth + 30, 0, "arrow").setAlpha(0).setTint(COLORS.amber);
    const arrow = this.add.image(-halfWidth + 30, 0, "arrow").setAlpha(0.78);
    const label = this.add
      .text(-halfWidth + 70, 0, answer, textStyle({
        fontSize: "14px",
        color: "#f2f7ff",
        lineSpacing: 3,
        wordWrap: { width: 520 }
      }))
      .setOrigin(0, 0.5);

    container.add([glow, bg, hoverBorder, accent, arrowGlow, arrow, label]);

    const hitArea = new Phaser.Geom.Polygon([
      new Phaser.Geom.Point(points[0], points[1]),
      new Phaser.Geom.Point(points[2], points[3]),
      new Phaser.Geom.Point(points[4], points[5]),
      new Phaser.Geom.Point(points[6], points[7]),
      new Phaser.Geom.Point(points[8], points[9]),
      new Phaser.Geom.Point(points[10], points[11])
    ]);

    container.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
    container.input.cursor = "pointer";

    const hotspot = {
      index,
      container,
      glow,
      hoverBorder,
      label,
      arrowGlow,
      arrow,
      arrowBaseX: -halfWidth + 30,
      y
    };
    this.hotspots.push(hotspot);

    container.on("pointerover", () => this.setAnswerHover(hotspot, true));
    container.on("pointerout", () => this.setAnswerHover(hotspot, false));
    container.on("pointerdown", () => this.chooseAnswer(index));
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
    this.tweens.killTweensOf([
      hotspot.container,
      hotspot.glow,
      hotspot.hoverBorder,
      hotspot.arrowGlow,
      hotspot.arrow,
      hotspot.label
    ]);
    this.tweens.add({
      targets: hotspot.container,
      scaleX: active ? 1.01 : 1,
      scaleY: active ? 1.01 : 1,
      duration: 140,
      ease: "Quad.easeOut"
    });
    this.tweens.add({
      targets: hotspot.glow,
      alpha: active ? 1.6 : 1,
      duration: 140,
      ease: "Quad.easeOut"
    });
    this.tweens.add({
      targets: hotspot.hoverBorder,
      alpha: active ? 1 : 0,
      duration: 140,
      ease: "Quad.easeOut"
    });
    this.tweens.add({
      targets: hotspot.arrowGlow,
      x: active ? hotspot.arrowBaseX + 10 : hotspot.arrowBaseX,
      alpha: active ? 0.95 : 0,
      scaleX: active ? 1.28 : 1,
      scaleY: active ? 1.28 : 1,
      duration: 160,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: hotspot.arrow,
      x: active ? hotspot.arrowBaseX + 10 : hotspot.arrowBaseX,
      alpha: active ? 1 : 0.7,
      duration: 160,
      ease: "Back.easeOut"
    });
    hotspot.arrow.setTint(active ? COLORS.amber : COLORS.cyan);
    hotspot.label.setColor(active ? "#fff2b8" : "#f2f7ff");
  }

  chooseAnswer(index) {
    const question = this.quiz.questions[this.questionIndex];
    this.answers.push({ questionId: question.id, answerIndex: index });

    const selected = this.hotspots[index];
    this.tweens.add({
      targets: selected.container,
      alpha: 0.45,
      yoyo: true,
      duration: 110,
      onComplete: () => {
        this.questionIndex += 1;
        if (this.questionIndex >= this.quiz.questions.length) {
          this.transitionTo(() => this.showCalculating());
        } else {
          this.transitionTo(() => this.showQuestion());
        }
      }
    });
  }

  showCalculating() {
    this.state = "calculating";
    this.clearScreen();
    this.drawBackground();

    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.panelDark, 0.76).setOrigin(0);
    this.add.rectangle(42, 42, 556, 396, COLORS.ink, 0.62).setOrigin(0).setStrokeStyle(2, COLORS.cyan, 0.58);
    this.add.rectangle(58, 58, 524, 24, COLORS.cyan, 0.08).setOrigin(0);

    this.add
      .text(WIDTH / 2, 88, "CALCULATING", textStyle({
        fontFamily: FONT_TITLE,
        fontSize: "28px",
        color: "#f2f7ff"
      }))
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, 114, "CROSS-REFERENCING MIDICHLORIAN VECTORS // DESTINY MATRICES // ARCHIVE BIAS", textStyle({
        fontSize: "11px",
        color: "#ffcf5a",
        align: "center",
        wordWrap: { width: 470 }
      }))
      .setOrigin(0.5, 0);

    const centerX = 182;
    const centerY = 236;
    const ringA = this.add.circle(centerX, centerY, 82).setStrokeStyle(2, COLORS.cyan, 0.64);
    const ringB = this.add.circle(centerX, centerY, 58).setStrokeStyle(2, COLORS.amber, 0.78);
    const ringC = this.add.circle(centerX, centerY, 32).setStrokeStyle(2, COLORS.red, 0.76);
    const reticleH = this.add.rectangle(centerX, centerY, 150, 2, COLORS.cyan, 0.32);
    const reticleV = this.add.rectangle(centerX, centerY, 2, 150, COLORS.cyan, 0.32);
    const orbitDot = this.add.circle(centerX + 58, centerY, 5, COLORS.amber, 1);
    const core = this.add.circle(centerX, centerY, 10, COLORS.text, 0.9).setStrokeStyle(2, COLORS.cyan, 0.9);
    const pulse = this.add.circle(centerX, centerY, 20, COLORS.cyan, 0.16).setStrokeStyle(1, COLORS.cyan, 0.4);

    const graphX = 324;
    const graphY = 166;
    const graphWidth = 224;
    const graphHeight = 94;
    this.add.rectangle(graphX, graphY, graphWidth, graphHeight, COLORS.panelAlt, 0.42).setOrigin(0).setStrokeStyle(1, COLORS.cyan, 0.3);
    const graph = this.add.graphics();
    graph.setPosition(graphX, graphY);

    const progressBg = this.add.rectangle(324, 294, 224, 18, COLORS.panelAlt, 0.55).setOrigin(0).setStrokeStyle(1, COLORS.cyan, 0.28);
    const progressFill = this.add.rectangle(326, 296, 0, 14, COLORS.cyan, 0.9).setOrigin(0);
    const progressText = this.add
      .text(556, 288, "0%", textStyle({
        fontSize: "16px",
        color: "#f2f7ff"
      }))
      .setOrigin(1, 0);

    const statusText = this.add
      .text(324, 324, "Sampling behavioral residue...", textStyle({
        fontSize: "13px",
        color: "#f2f7ff",
        wordWrap: { width: 240 }
      }))
      .setOrigin(0);

    const metricText = this.add
      .text(324, 356, "", textStyle({
        fontSize: "12px",
        color: "#93a8b8",
        lineSpacing: 4
      }))
      .setOrigin(0);

    const statuses = [
      "Sampling behavioral residue...",
      "Reconstructing lightsaber bias profile...",
      "Interpolating smuggler-to-Jedi probability arc...",
      "Correcting for excessive main-character energy...",
      "Matching sarcasm signatures against archive records..."
    ];

    const metrics = [
      "TACTICAL DRIFT: 08.3\nFORCE NOISE: 12.1\nPROPHECY FIT: 74.6",
      "TACTICAL DRIFT: 11.9\nFORCE NOISE: 09.4\nPROPHECY FIT: 81.3",
      "TACTICAL DRIFT: 06.7\nFORCE NOISE: 14.2\nPROPHECY FIT: 88.9",
      "TACTICAL DRIFT: 04.1\nFORCE NOISE: 08.1\nPROPHECY FIT: 93.5",
      "TACTICAL DRIFT: 02.8\nFORCE NOISE: 05.7\nPROPHECY FIT: 99.2"
    ];

    const drawWaveform = (phase) => {
      graph.clear();
      graph.lineStyle(1, COLORS.cyan, 0.14);
      for (let x = 0; x <= graphWidth; x += 32) {
        graph.lineBetween(x, 0, x, graphHeight);
      }
      for (let y = 0; y <= graphHeight; y += 24) {
        graph.lineBetween(0, y, graphWidth, y);
      }

      graph.lineStyle(2, COLORS.amber, 0.95);
      graph.beginPath();
      for (let x = 0; x <= graphWidth; x += 6) {
        const y =
          graphHeight / 2 +
          Math.sin((x + phase) / 17) * 18 +
          Math.cos((x + phase * 1.8) / 9) * 7;
        if (x === 0) {
          graph.moveTo(x, y);
        } else {
          graph.lineTo(x, y);
        }
      }
      graph.strokePath();

      graph.lineStyle(1, COLORS.red, 0.7);
      graph.beginPath();
      for (let x = 0; x <= graphWidth; x += 8) {
        const y =
          graphHeight / 2 +
          Math.cos((x + phase * 1.6) / 15) * 14 +
          Math.sin((x + phase) / 6) * 4;
        if (x === 0) {
          graph.moveTo(x, y);
        } else {
          graph.lineTo(x, y);
        }
      }
      graph.strokePath();
    };

    drawWaveform(0);
    metricText.setText(metrics[0]);

    this.tweens.add({
      targets: ringA,
      angle: 360,
      duration: 4200,
      repeat: -1
    });
    this.tweens.add({
      targets: ringB,
      angle: -360,
      duration: 3200,
      repeat: -1
    });
    this.tweens.add({
      targets: ringC,
      angle: 360,
      duration: 1800,
      repeat: -1
    });
    this.tweens.add({
      targets: pulse,
      scaleX: 1.45,
      scaleY: 1.45,
      alpha: 0.02,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const orbitState = { angle: 0 };
    this.tweens.add({
      targets: orbitState,
      angle: 360,
      duration: 1700,
      repeat: -1,
      ease: "Linear",
      onUpdate: () => {
        const radians = Phaser.Math.DegToRad(orbitState.angle);
        orbitDot.x = centerX + Math.cos(radians) * 58;
        orbitDot.y = centerY + Math.sin(radians) * 58;
      }
    });

    const progressState = { value: 0 };
    this.tweens.add({
      targets: progressState,
      value: 100,
      duration: 3600,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const percent = Math.floor(progressState.value);
        progressFill.width = (220 * percent) / 100;
        progressText.setText(`${percent}%`);
      }
    });

    let waveformPhase = 0;
    this.trackTimer(
      this.time.addEvent({
        delay: 120,
        loop: true,
        callback: () => {
          waveformPhase += 12;
          drawWaveform(waveformPhase);
        }
      })
    );

    let statusIndex = 0;
    this.trackTimer(
      this.time.addEvent({
        delay: 720,
        loop: true,
        callback: () => {
          statusIndex = (statusIndex + 1) % statuses.length;
          statusText.setText(statuses[statusIndex]);
          metricText.setText(metrics[statusIndex]);
        }
      })
    );

    this.add
      .particles(0, 0, "spark", {
        x: { min: 70, max: 570 },
        y: { min: 344, max: 410 },
        lifespan: 1800,
        speedY: { min: -18, max: -42 },
        speedX: { min: -10, max: 10 },
        alpha: { start: 0.22, end: 0 },
        scale: { start: 0.28, end: 0.05 },
        frequency: 90,
        quantity: 1
      })
      .setDepth(0);

    this.trackTimer(
      this.time.delayedCall(3800, () => {
        this.transitionTo(() => this.showResult());
      })
    );
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
    const notch = Math.min(20, Math.round(height * 0.48));
    const halfHeight = height / 2;
    const halfWidth = width / 2;
    const points = [
      -halfWidth, 0,
      -halfWidth + notch, -halfHeight,
      halfWidth - notch, -halfHeight,
      halfWidth, 0,
      halfWidth - notch, halfHeight,
      -halfWidth + notch, halfHeight
    ];

    const centerX = x + halfWidth;
    const centerY = y + halfHeight;
    const container = this.add.container(centerX, centerY).setDepth(depth);

    const glow = this.add.graphics();
    glow.fillStyle(COLORS.cyan, 0.1);
    glow.lineStyle(6, COLORS.cyan, 0.1);
    glow.beginPath();
    glow.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      glow.lineTo(points[i], points[i + 1]);
    }
    glow.closePath();
    glow.fillPath();
    glow.strokePath();

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.ink, 0.96);
    bg.lineStyle(2, COLORS.cyan, 0.95);
    bg.beginPath();
    bg.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      bg.lineTo(points[i], points[i + 1]);
    }
    bg.closePath();
    bg.fillPath();
    bg.strokePath();

    const accent = this.add.graphics();
    accent.lineStyle(1, COLORS.cyan, 0.24);
    accent.beginPath();
    accent.moveTo(-halfWidth + notch + 6, -halfHeight + 6);
    accent.lineTo(halfWidth - notch - 6, -halfHeight + 6);
    accent.moveTo(-halfWidth + notch + 6, halfHeight - 6);
    accent.lineTo(halfWidth - notch - 6, halfHeight - 6);
    // accent.strokePath();

    const text = this.add
      .text(0, 0, label, textStyle({
        fontFamily: FONT_TITLE,
        fontSize: "18px",
        color: "#37d5ff"
      }))
      .setOrigin(0.5);

    container.add([glow, bg, accent, text]);

    const hitArea = new Phaser.Geom.Polygon([
      new Phaser.Geom.Point(points[0], points[1]),
      new Phaser.Geom.Point(points[2], points[3]),
      new Phaser.Geom.Point(points[4], points[5]),
      new Phaser.Geom.Point(points[6], points[7]),
      new Phaser.Geom.Point(points[8], points[9]),
      new Phaser.Geom.Point(points[10], points[11])
    ]);

    container.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
    container.input.cursor = "pointer";

    container.on("pointerover", () => {
      this.tweens.killTweensOf([container, glow, text]);
      this.tweens.add({
        targets: container,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 130,
        ease: "Quad.easeOut"
      });
      this.tweens.add({
        targets: glow,
        alpha: 1.35,
        duration: 130,
        ease: "Quad.easeOut"
      });
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 130,
        ease: "Quad.easeOut"
      });
    });

    container.on("pointerout", () => {
      this.tweens.killTweensOf([container, glow, text]);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 130,
        ease: "Quad.easeOut"
      });
      this.tweens.add({
        targets: glow,
        alpha: 1,
        duration: 130,
        ease: "Quad.easeOut"
      });
      this.tweens.add({
        targets: text,
        alpha: 0.94,
        duration: 130,
        ease: "Quad.easeOut"
      });
    });

    container.on("pointerdown", onClick);
  }

  drawBackground() {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.background).setOrigin(0);
    for (let i = 0; i < 58; i += 1) {
      const x = (i * 97) % WIDTH;
      const y = (i * 53) % HEIGHT;
      const alpha = 0.18 + ((i % 5) * 0.08);
      this.add.rectangle(x, y, i % 7 === 0 ? 2 : 1, 1, 0xffffff, alpha).setOrigin(0);
    }

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
