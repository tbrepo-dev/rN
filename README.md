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

- **◀ ▶** (bottom-left) run, **JUMP** (bottom-right) — hold for a higher jump.
- Stomp the chickens, raccoons and skunks. Side contact costs a life.
- Bump moonshine barrels from below: jugs of moonshine, or a glowing **shine** jug that makes Billy big (one free hit).
- Grab jugs for points, hit the mailbox for a checkpoint, reach the pickup truck to win.

## Layout

- `engine/` — pure-JS game logic (tile physics, enemies, items), unit-tested with `node --test`.
- `src/Sprites.js` — Views/emoji sprites. `App.js` — game loop, camera, HUD, touch input.
