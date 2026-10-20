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

## Lives

Extra lives (1UP) come from: a hidden 1UP pickup in every level (look above the gaps in the high routes, or in the barrel graveyard in the tower), life barrels, and every 25 things you collect. Lives are capped at nine; extra 1UPs past that turn into bonus points.

## The five levels (and the story)

1. **Billy's Holler**: chickens, raccoons, skunks, chasing hounds, charging turkeys, bees. Load the truck with half the jugs.
2. **Crash-Landed**: a UFO has crashed on the ranch. Aliens drop ⚡ ammo for the **ray gun** (found in the first barrel). Gear: ray gun, antenna helmet (double ammo), alien vest (+1 armor). Collect crystals to power the Time Booth.
3. **Dark Ages**: the Time Booth drops Billy in the Middle Ages: goblins, skeletons, trolls, witches who lob orbs, bats and the **Witch Queen**. Gear: sword, shield, knight-alien helm and armor. After the Witch Queen falls, a wizard appears in a cutscene and sets a quest: fetch his beer from his fridge and he'll make Billy the most powerful being known to man.
4. **The Wizard's Fridge**: a single-screen, Donkey Kong-style climb. Honkey Kong, an albino ape in overalls, rolls barrels down the zig-zag girders. Hug a girder edge and jump up through the gaps, reach the fridge at the top and grab the beer. A note on the door says "Good job, student. You have passed the first test." and the wizard sends Billy east.
5. **The Pagoda**: ninja cats (hop and throw shuriken) and samurai cats (slow, tough, lunge). The boss is **Max**, a huge, old, fat tabby: he slams the floor sending shockwaves (jump them!), lobs hairballs when hurt, and is **wide open (double damage) while he's winded**. Beat him and Natasha, a tiny Russian Blue who works for the Russian mafia, knocks Billy out, interrogates him and offers a **red pill** or a **blue pill**. Blue is the happy ending. Red says "to be continued".

Gear you miss is waiting in a loot chest at the end of each level. Gear, ammo, lives and score carry from level to level. In the tower and pagoda, Billy keeps his full knight-alien kit.

## Layout

- `engine/` — pure-JS game logic (tile physics, enemies, items), unit-tested with `node --test`.
- `src/Sprites.js` — Views/emoji sprites. `App.js` — game loop, camera, HUD, touch input.
