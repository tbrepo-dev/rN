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

## Pause

Tap the **⏸** button (top right) or press **Esc / P** on a keyboard. The game also pauses by itself if you switch apps. The menu has Resume, Sound on/off, Enter Code, Restart Level and Quit to Title.

## Secret level select

On the title screen, the game-over screen or the pause menu, tap **🔑 ENTER CODE** (or tap the title five times) to open the level-select keypad, then enter a code. You start with the gear you'd normally have found by then.

| Code | Level |
| --- | --- |
| 1776 | 1. Billy's Holler |
| 5150 | 2. Crash-Landed |
| 1492 | 3. Dark Ages |
| 8008 | 4. The Wizard's Fridge |
| 3141 | 5. The Pagoda |
| 6660 | 6. Hell |
| 4200 | 7. Big Al's Liquor Store |
| 1337 | 8. The Hive |
| 1999 | 9. Hillbilly Cage Match |
| 2718 | The secret Egg Chamber (inside the Hive; no bazooka until you crack the Queen Egg) |

On the web you can also type the code on a keyboard.

## Lives

Extra lives (1UP) come from: a hidden 1UP pickup in every level (look above the gaps in the high routes, or in the barrel graveyard in the tower), life barrels, and every 25 things you collect. Lives are capped at nine; extra 1UPs past that turn into bonus points.

## The levels (and the story)

1. **Billy's Holler**: chickens, raccoons, skunks, chasing hounds, charging turkeys, bees. Load the truck with half the jugs.
2. **Crash-Landed**: a UFO has crashed on the ranch. Aliens drop ⚡ ammo for the **ray gun** (found in the first barrel). Gear: ray gun, antenna helmet (double ammo), alien vest (+1 armor). Collect crystals to power the Time Booth.
3. **Dark Ages**: the Time Booth drops Billy in the Middle Ages: goblins, skeletons, trolls, witches who lob orbs, bats and the **Witch Queen**. Gear: sword, shield, knight-alien helm and armor. After the Witch Queen falls, a wizard appears in a cutscene and sets a quest: fetch his beer from his fridge and he'll make Billy the most powerful being known to man.
4. **The Wizard's Fridge**: a single-screen, Donkey Kong-style climb. Honkey Kong, an albino ape in overalls, rolls barrels down the zig-zag girders. Hug a girder edge and jump up through the gaps, reach the fridge at the top and grab the beer. A note on the door says "Good job, student. You have passed the first test." and the wizard sends Billy east.
5. **The Pagoda**: ninja cats (hop and throw shuriken) and samurai cats (slow, tough, lunge). The boss is **Max**, a huge, old, fat tabby: he slams the floor sending shockwaves (jump them!), lobs hairballs when hurt, and is **wide open (double damage) while he's winded**. Beat him and Jinxy, a small dark-grey Russian Blue with big cheekbones who works for the Russian mafia, knocks Billy out, interrogates him and offers a **red pill** or a **blue pill**. Blue is the happy ending. The red pill says "to be continued"... and then keeps going, into Hell, and beyond.

6. **Hell** (red pill): Billy wakes up in Hell. A gauntlet of imps (throw fireballs), demons (charge) and embers over lava, then **Pack Billy**: a big, hungry, yellow hillbilly Pac-Man with a straw hat and a ginger beard. He can't be hurt, only fed. **Drink flaming tequila** (barrels along the road, then bottles keep appearing in the arena), then tap FIRE to **belch a flame ball**. Pack Billy eats them: feed him **five** and he gets full and lets Billy leave. In the cutscene Billy runs out of the gates of Hell with his backside on fire, finds a toilet, sits on it to put the fire out... and it's **to be continued**.

7. **Big Al's Liquor Store** (a big top-down, Grand Theft Auto-style open world, 300x200 tiles): Billy climbs off the toilet and needs a drink, but Big Al's has moved and nobody knows where. Hick Town has farms, crop fields, trailer parks, a lake, a quarry, a grain elevator, back roads and a thick forest.
   - **Controls:** ◀ ▶ steer, **GAS** drives (or walks on foot), 🛑 brakes, **⏪ REV** backs up (it brakes first if you're still rolling forward, and steering works the natural way round), and **ACTION** gets into or out of a ride. On a keyboard: B or V reverses. Near a farmer's truck it says **CARJACK** and throws him out.
   - **Rides:** pickups (fast), tractors (slow but tough, a big ram), trash trucks (heavy; they win head-on crashes).
   - **Drunk driving:** grab a 🍺 (about 20 around town) for 12 seconds of **invincibility** (stacks to 20): nothing hurts you, you can't be busted, you're a bit faster and your rams hit twice as hard. The catch: the steering wobbles and the screen sways.
   - **Hillbilly traffic:** about 30 farmers drive loops around the blocks in the right-hand lane, and 30+ more rides are parked along the roads, all there to be wrecked. Crash into them for points; wreck them and they explode. Farmers on foot dive out of the way.
   - **Cops:** a carjacking is worth a star straight away, and crashes add up. Patrol cars cruise the roads from the very start and chase if you speed past them or cause a scene, and every so often a cop just decides to chase you. Cops follow the roads and chase you, but they're slower than a pickup and there's one cop per star. Lose them (get more than 40 tiles ahead for about five seconds) and they give up, and the heat drops fast. A cop has to sit on you for about 2.5 seconds to bust you. If one catches you standing still, you're BUSTED and lose a life. Get away and the heat fades.
   - **The hunt for Big Al's** is a chain of clues across the whole map: a note on the outhouse points you to the **Honky Tonk** in the middle, where you learn to ask **Pete at his junkyard** far south-east, who sends you to the **dead tree** in the far north-west, where a hand-painted sign marks a **dirt road** winding deep into the woods to the store. The minimap only shows your current lead, Big Al's only appears on it when you are nearly on top of it, and each landmark is a checkpoint, so your progress survives a death.
   - **Decoys:** misleading road signs, a closed fake store (Little Al's), and carjacked farmers who sometimes know nothing at all.
   - Jugs of moonshine are scattered around (every 25 gives a life), plus four hidden 1UPs.
   - After the win there's a cutscene at the store. A beam of green light drops out of the clouds...

8. **The Hive** (a Metroid-style map, 200x60 tiles, scrolling in every direction): the aliens' mama has had enough. Billy is dropped into a dripping alien hive of connected caves, shafts, acid pools and doors, with a minimap that fills in as you explore.
   - **Doors:** blue doors open to any shot. **Red doors only open to a rocket.** Cracked walls need real firepower (ray gun, sword or a flame ball, not corn).
   - **Save stations** set your checkpoint and refill your armor. **Energy tanks** (two in the Hive, one in the Egg Chamber) give +1 armor for good. Acid burns and bounces you out.
   - **Creatures:** face-huggers leap at you, xenos sprint, spitters lob acid, drones fly. **Eggs hatch a hugger when you walk up**, so shoot them from a distance and you get a **rocket** instead.
   - **The secret:** a cracked wall in the first cavern hides a portal into **the Egg Chamber**, a whole separate map (it has its own saves, tank, creatures and a climb). At the top waits the **Queen Egg**: crack it open and harvest the **Egg-zooka**, a rocket launcher (🚀 button, or Q on a keyboard). Back in the Hive, rockets open the red door and are the only thing that hurts the Queen.
   - **The Alien Queen** is a cross between a Giger xenomorph and a hillbilly: black chitin, a straw hat, overalls, drool and a big pair of bunny teeth. Her armor shrugs off corn, rays, sword, rush and stomps; only rockets hurt her. She whips ground waves (jump them), spits acid, pounces, and at half health screeches up more huggers. Egg pods keep appearing in her nest; shoot one for a rocket refill. Beat her and the hatch opens onto an arena...

9. **Hillbilly Cage Match** (a Street Fighter-style fighting game): Jinxy has Billy in a cage. Three one-on-one fights, best of three rounds, against **Cousin Cletus** (slow brawler), **Granny Mae** (blocks and throws fireballs) and finally **Jinxy** (fast, with every special). Your armor gear gives you extra health.
   - **Buttons:** ◀ ▶ on the left (so your thumbs never swap), and on the right JUMP plus a 2x2 pad (PUNCH, KICK over BLOCK, SPECIAL); you can hold several buttons at once, steer in mid-air and walk while swinging. 👊 PUNCH, 🦵 KICK (slower, harder, longer reach), 🛡️ BLOCK (hold; blocked hits do almost nothing), JUMP, and 🔥 SPECIAL: alone it throws a **fireball**, with ▶ it's a **spinning kick** (three hits), with ◀ it's an **uppercut** (invulnerable as it starts, great against jump-ins). Specials have short cooldowns, shown under your health bar. Keyboard: X punch, C kick, V block, Q special.
   - **Fatalities:** win the deciding round by KO and you get **FINISH HIM!** with about seven seconds to press two buttons in a row: PUNCH, KICK = **Corn Cob Smash**; KICK, PUNCH = **Outhouse Express**; SPECIAL, SPECIAL = **Moonshine Meltdown**; PUNCH, PUNCH = **Moon Shot**. (Cartoon style, no blood.) A fatality scores a 1000-point bonus, but skipping it is fine.
   - Lose a match and you lose a life and rematch the same fighter. Beat Jinxy and it's *to be continued* once again.

Gear you miss is waiting in a loot chest at the end of each level. Gear, ammo, lives and score carry from level to level. In the tower and pagoda, Billy keeps his full knight-alien kit.

## Layout

- `engine/` — pure-JS game logic (tile physics, enemies, items), unit-tested with `node --test`.
- `src/Sprites.js` — Views/emoji sprites. `App.js` — game loop, camera, HUD, touch input.
