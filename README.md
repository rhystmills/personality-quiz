# Personality Quiz

A client-side canvas personality quiz built with Phaser and Vite.

The quiz presents a start screen, 10 JSON-driven question screens, and a result screen. User choices are recorded for interaction feel, but the final character is intentionally fixed by `guaranteedResultId` in `public/data/quiz.json`.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL.

## Content

Edit `public/data/quiz.json` to change the title, questions, answers, image assets, and the guaranteed result.
