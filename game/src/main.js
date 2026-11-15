// main.js — boot and the one game loop of Lumenfall. Input is read every frame; the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast one); the renderer
// paints whichever screen is active. Screen flow:
//   title -> play -> (upgrade choice between waves) -> paused / game over -> restart.
//
// Two URL parameters drive testing:
//   ?seed=N fixes the wave pattern (random seed for createRandom).
//   ?shot=title|play|upgrade|end (&seed=N) stages that scene instead of running the loop,
//   paints it twice and sets window.__shotReady for the screenshot harness.
import { BEST_KEY, CORE, PALETTE, STEP } from "./config.js";
import { createRandom } from "./random.js";
import {
  createWorld, EVENT_CORE_HIT, EVENT_EMBER_PICKED, EVENT_GAME_OVER, EVENT_SHADE_SLAIN,
  EVENT_SHOT_FIRED, EVENT_UPGRADE_READY, EVENT_WAVE_CLEAR, EVENT_WAVE_START,
} from "./world.js";
import {
  ACTION_CONFIRM, ACTION_PAUSE, ACTION_UPGRADE_1, ACTION_UPGRADE_2, ACTION_UPGRADE_3, createInput,
} from "./input.js";
import { createAudio } from "./audio.js";
import {
  SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, createRenderer,
} from "./render.js";
import { stageShot } from "./shots.js";

// A frame never simulates more than a quarter second, so a stalled tab doesn't fast-forward.
const MAX_FRAME = 0.25;

// Read the URL once: the optional screenshot scene and the optional fixed seed.
const params = new URLSearchParams(window.location.search);
const shot = params.get("shot");
const seedParam = Number.parseInt(params.get("seed") ?? "", 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById("game");
const status = document.getElementById("status");
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

// Read the persisted best score; 0 when storage is unavailable or empty.
function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

// Persist the best score; storage can be off (private windows), in which case
// the best score then lasts this visit only.
function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Ignore: nothing to fall back to.
  }
}

// Screenshot mode: stage the named scene in the world, then paint it twice
// (once to warm up shaders/layout, once as the real capture) and flag __shotReady.
function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

// The normal game: owns the current screen, the input, and the fixed-step loop.
function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each event.
  function announce(message) {
    status.textContent = message;
  }

  // Begin a fresh run: reset the world, switch to the play screen, and start wave ambience.
  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.waveStart();
    audio.drone(0.05);
    announce(`Wave 1. ${world.state.lives} lives. Defend the lantern.`);
  }

  // Lantern destroyed: show the game-over screen, record a new best if earned.
  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    audio.gameOver();
    audio.drone(0.02);
    announce(`The lantern is out. Score ${world.state.score}. Best ${best}. Press space to relight.`);
  }

  // React to the world's per-step event bitmask with sounds, screen changes, and narration.
  function handleEvents(events) {
    if (events & EVENT_SHOT_FIRED) audio.shot();
    if (events & EVENT_SHADE_SLAIN) audio.slain();
    if (events & EVENT_EMBER_PICKED) audio.ember();
    if (events & EVENT_CORE_HIT) {
      audio.coreHit();
      if (world.state.lives <= 0) endGame();
      else announce(`The lantern broke! ${world.state.lives} ${world.state.lives === 1 ? "life" : "lives"} left.`);
    }
    if (events & EVENT_UPGRADE_READY) {
      screen = SCREEN_UPGRADE;
      audio.waveClear();
      audio.drone(0.02);
      announce(`Wave ${world.state.wave} cleared. Choose a blessing.`);
    }
  }

  // Apply the chosen between-wave blessing, then return to the play screen.
  function chooseUpgrade(index) {
    const offer = world.state.upgradesOffered?.[index];
    if (!offer) return;
    world.applyUpgrade(offer.id);
    audio.upgrade();
    screen = SCREEN_PLAY;
    audio.drone(0.05);
    announce(`${offer.title}: ${offer.detail}. Wave ${world.state.wave + 1} comes.`);
  }

  // Consume queued input actions and route them by the current screen.
  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (screen === SCREEN_UPGRADE) {
      if (actions & ACTION_UPGRADE_1) chooseUpgrade(0);
      else if (actions & ACTION_UPGRADE_2) chooseUpgrade(1);
      else if (actions & ACTION_UPGRADE_3) chooseUpgrade(2);
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce("Paused.");
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce("Playing.");
    }
  }

  // One fixed simulation step while playing: push input into the world, handle its events.
  function step() {
    const aim = input.aim();
    const dir = input.direction();
    const events = world.step(dir.x, dir.y, input.firing(), aim.x, aim.y);
    handleEvents(events);
  }

  // The frame callback: drain the input, catch the simulation up in fixed steps, paint.
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        if (screen === SCREEN_TITLE) {
          // Idle drift behind the title: the world breathes but nothing attacks.
          world.step(0, 0, false, CORE.x + 200, CORE.y);
        } else {
          step();
        }
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting shades advance unseen.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
  });
  // M toggles sound at any moment.
  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyM") {
      const muted = audio.toggleMute();
      announce(muted ? "Sound off." : "Sound on.");
    }
  });

  requestAnimationFrame(frame);
}

// Screenshot mode never runs the loop; normal boot does.
if (shot) runShot(shot);
else runGame();
