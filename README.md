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
- **Fire** (🌽 / 🔫): up close with a sword it slashes, otherwise it fires the ray gun while you have ammo, otherwise it throws a corn cob.
- **SHINE / RUSH**: collect shine to fill the meter, then tap RUSH for 6 seconds of invincibility (critters are plowed through, pits still count), extra speed, a higher jump and triple corn cobs.
- **🛡️** (once you find a shield): hold to block from the front. Slows you down, stops shots and shoves enemies back.
- Bump barrels from below: a collectible pops out to the side (chase it down!), a glowing **shine** jug makes Billy big (one free hit), gear for your loadout, or a swarm.
- Keyboard (web): arrows/WASD move, space/Z jump, X fire, C rush, V shield.

## The three levels

1. **Billy's Holler**: chickens, raccoons, skunks, chasing hounds, charging turkeys, bees. Load the truck with half the jugs.
2. **Crash-Landed**: a UFO has crashed on the ranch. Same mechanics, but aliens (grunts, hoppers, tentacle gunners, UFOs, drones) drop ⚡ ammo for the **ray gun** (found in the first barrel). Gear: ray gun, antenna helmet (double ammo), alien vest (+1 armor). Collect crystals to power the Time Booth.
3. **Dark Ages**: the Time Booth drops Billy in the Middle Ages: goblins, skeletons, trolls, witches who lob orbs, bats and the **Witch Queen** guarding the castle gate. Gear: sword, shield, knight-alien helm and armor. By the end Billy wears the full knight-alien kit with ray gun, sword and shield.

Gear you miss is waiting in a loot chest at the end of each level, so Billy always finishes level 3 fully equipped. Gear, ammo, lives and score carry from level to level.

## Layout

- `engine/` — pure-JS game logic (tile physics, enemies, items), unit-tested with `node --test`.
- `src/Sprites.js` — Views/emoji sprites. `App.js` — game loop, camera, HUD, touch input.
