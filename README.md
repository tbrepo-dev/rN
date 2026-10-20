# Billy Bubs

A Mario-style side-scrolling platformer for iPhone, starring Billy the hillbilly.
Built with Expo / React Native (landscape, multi-touch controls).

## Play

```bash
npm install
npx expo start        # scan the QR code with Expo Go on your iPhone
npm run web           # or play in a browser with arrow keys / WASD + space
npm test              # engine tests (physics, stomping, crates, level is beatable)
```

## How to play

- **◀ ▶** (bottom-left) run. **JUMP** (bottom-right): hold for a higher jump, tap again in mid-air to double jump.
- **🌽** throws a corn cob. Hit critters from a distance. Bees can't be stomped, and turkeys take two cobs.
- Collect jugs of shine to fill the **SHINE** meter. When it's full, tap **RUSH** for 6 seconds of invincibility (critters are plowed through, pits still count), extra speed, a higher jump and triple corn cobs.
- Bump the barrels from below: a jug pops out to the side (chase it down!), a glowing **shine** jug makes Billy big (one free hit) — or it's a hive full of bees.
- Meet the critters: chickens, raccoons and skunks patrol; hounds chase you; turkeys wind up and charge; bees swarm.
- Load the truck: collect enough jugs (shown on the HUD and the truck's sign) before you drive off. Find the treetop trail above the barn for a big stash.
- Keyboard (web): arrows/WASD move, space/Z jump, X throw, C rush.

## Layout

- `engine/` — pure-JS game logic (tile physics, enemies, items), unit-tested with `node --test`.
- `src/Sprites.js` — Views/emoji sprites. `App.js` — game loop, camera, HUD, touch input.
