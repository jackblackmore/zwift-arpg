// Testing hooks, exposed as window.__dbg by main.js (used by tests/sim.mjs and tests/blocks/*, handy in the console).
// Any module may add its own hooks at load time: `import { dbg } from '../core/dbg.js'; Object.assign(dbg, { foo });`
// so new features don't all have to edit main.js.
export const dbg = {};
