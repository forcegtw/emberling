// The screenshot scenes behind ?shot=title|play|upgrade|end. Each stages a real game:
// the world runs forward under the scripted autopilot for a fixed number of steps, then the
// matching screen is painted. The same seed always stages the same frame.
import { WAVE, STEP } from "./config.js";
import { createAutopilot } from "./autopilot.js";
import {
  EVENT_UPGRADE_READY, EVENT_WAVE_CLEAR,
} from "./world.js";
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE } from "./render.js";

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 42;
const UPGRADE_SECONDS = 16;
const END_LIMIT_SECONDS = 900;

/**
 * Set `world` to the named scene and step it forward. Returns the screen to paint and the
 * best score to display alongside it.
 */
export function stageShot(name, world, rng) {
  world.reset();
  const pilot = createAutopilot();
  const state = world.state;

  function run(seconds, weak) {
    const steps = Math.floor(seconds / STEP);
    for (let i = 0; i < steps; i += 1) {
      const c = pilot.control(state);
      const events = world.step(c.mx, c.my, c.firing, c.aimX, c.aimY);
      if (events & EVENT_UPGRADE_READY) {
        // Take a mid-list upgrade so the choice screen shows the untouched offer.
        world.applyUpgrade(state.upgradesOffered[1].id);
      }
      if (state.lives <= 0) break;
    }
  }

  if (name === "play") {
    // Run until a wave is mid-flow with several shades on the field, then freeze: a busy,
    // honest mid-game frame rather than a lull.
    for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
      const c = pilot.control(state);
      const events = world.step(c.mx, c.my, c.firing, c.aimX, c.aimY);
      if (events & EVENT_UPGRADE_READY) world.applyUpgrade(state.upgradesOffered[1].id);
      if (state.shades.length >= 7) break;
      if (state.lives <= 0) break;
    }
    return { screen: SCREEN_PLAY, best: state.score };
  }
  if (name === "upgrade") {
    run(UPGRADE_SECONDS, false);
    // Step until an upgrade is offered, then freeze on the choice screen.
    for (let i = 0; i < 60 * 240 && !state.upgradesOffered; i += 1) {
      const c = pilot.control(state);
      const events = world.step(c.mx, c.my, c.firing, c.aimX, c.aimY);
      if (events & EVENT_UPGRADE_READY) break;
      if (state.lives <= 0) break;
    }
    return { screen: SCREEN_UPGRADE, best: state.score };
  }
  if (name === "end") {
    // Play honestly until the lantern falls out.
    for (let i = 0; i < END_LIMIT_SECONDS / STEP; i += 1) {
      const c = pilot.control(state);
      world.step(c.mx, c.my, c.firing, c.aimX, c.aimY);
      if (state.lives <= 0) break;
    }
    return { screen: SCREEN_OVER, best: state.score };
  }
  // Title: run a moment of ambient world motion behind the title card.
  run(TITLE_SECONDS, false);
  return { screen: SCREEN_TITLE, best: 0 };
}
