// A scripted player used only by the ?shot= screenshot scenes: it plays by the real rules,
// steering toward shades and embers, so the frames staged for screenshots are real play.
// It deliberately weakens in the end scene so the game-over screen shows honestly.
import { CORE, EMBER, FIELD, PLAYER } from "./config.js";

/** Of the shades, the one nearest the core - the most urgent target. */
function nearestThreat(state) {
  let best = null;
  let bestDist = Infinity;
  for (const shade of state.shades) {
    const d = Math.hypot(shade.x - CORE.x, shade.y - CORE.y);
    if (d < bestDist) { bestDist = d; best = shade; }
  }
  return best;
}

export function createAutopilot(horizonWeakness) {
  return {
    /** Move direction, aim point, and trigger state for this simulation step. */
    control(state) {
      const player = state.player;
      let target = nearestThreat(state);
      let mx = 0; let my = 0;
      let firing = false;
      if (target) {
        // Stand between the threat and the core, at shotgun-ish range.
        const dx = target.x - CORE.x; const dy = target.y - CORE.y;
        const d = Math.hypot(dx, dy) || 1;
        const gx = target.x + (dx / d) * -70;
        const gy = target.y + (dy / d) * -70;
        mx = Math.sign(gx - player.x);
        my = Math.sign(gy - player.y);
        firing = Math.hypot(target.x - player.x, target.y - player.y) < 520;
        return { mx, my, aimX: target.x, aimY: target.y, firing };
      }
      // No threats: chase an ember, else orbit the core.
      let ember = null;
      let emberDist = Infinity;
      for (const e of state.droppedEmbers) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < emberDist) { emberDist = d; ember = e; }
      }
      if (ember) {
        mx = Math.sign(ember.x - player.x);
        my = Math.sign(ember.y - player.y);
      } else {
        const a = performance.now() / 900;
        mx = Math.sign(CORE.x + Math.cos(a) * 130 - player.x);
        my = Math.sign(CORE.y + Math.sin(a) * 130 - player.y);
      }
      return { mx, my, aimX: player.x + 100, aimY: player.y, firing: false };
    },
  };
}
