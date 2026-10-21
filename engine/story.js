// Cutscenes. A scene is a list of lines shown one tap at a time on a themed backdrop.
//   who: 'narrator' | 'sign' | a cast member ('billy', 'wizard', 'jinxy')
//   fx:  optional flourish shown behind the dialogue ('zap', 'ko')
//   bg:  optional backdrop change from this line on
// When the lines run out, `then` decides what happens next: start a level, play another
// scene, or end the game. A scene with `choice` ends on a decision instead.

export const SCENES = {
  // After the Witch Queen falls
  wizard: {
    bg: 'throne',
    cast: ['billy', 'wizard'],
    lines: [
      { who: 'narrator', text: 'The Witch Queen crumbles to dust. The castle falls quiet... then a puff of purple smoke fills the throne room.' },
      { who: 'wizard', text: "Splendid! Splendid! You've bested my old rival, young one." },
      { who: 'billy', text: 'Who in tarnation are you?' },
      { who: 'wizard', text: 'I am Merlinzo the Magnificent. And you, my boy, have potential. I can make you the most powerful being known to man.' },
      { who: 'billy', text: "Well now. What's the catch?" },
      { who: 'wizard', text: 'No catch! Just a small errand. Fetch me a cold beer from my fridge. It is at the very top of my tower.' },
      { who: 'billy', text: 'A beer. That is it?' },
      { who: 'wizard', text: 'There is a tiny matter of Honkey Kong. Albino ape, overalls, serious barrel problem. He guards the fridge.' },
      { who: 'billy', text: "Yeehaw. I've dealt with worse at the county fair." },
      { who: 'wizard', text: 'Off you go!', fx: 'zap' },
    ],
    then: { level: 4 },
  },

  // After grabbing the beer
  fridge: {
    bg: 'tower',
    cast: ['billy', 'wizard'],
    lines: [
      { who: 'narrator', text: 'Billy snatches the ice-cold beer. A sticky note is stuck to the fridge door...' },
      { who: 'sign', text: 'Good job, student.\nYou have passed the first test.' },
      { who: 'wizard', text: 'HA! You actually did it! Marvelous!', fx: 'zap' },
      { who: 'billy', text: "Here's your beer, ya old goat." },
      { who: 'wizard', text: 'Delightful. But that was only the FIRST test. The second awaits in the east: pagodas, cherry blossoms, and cats. So many cats.' },
      { who: 'billy', text: 'Cats?' },
      { who: 'wizard', text: 'Off you go again!', fx: 'zap' },
    ],
    then: { level: 5 },
  },

  // After Max falls
  finale: {
    bg: 'dojo',
    cast: ['billy', 'jinxy'],
    lines: [
      { who: 'narrator', text: 'Max the tabby gives one last wheeze, rolls over, and starts to snore. The dojo falls silent.' },
      { who: 'billy', text: 'Whew. That cat was the size of a hay wagon.' },
      { who: 'narrator', text: 'A tiny shadow steps out from behind the paper doors.' },
      { who: 'jinxy', text: 'Impressive, cowboy. Nobody beats Max. Not in twelve years.' },
      { who: 'billy', text: 'And who might you be? You are about the size of a boot.' },
      { who: 'jinxy', text: 'I am Jinxy, of the Russian Blue family. We run this city. Max was our muscle.' },
      { who: 'billy', text: 'So you are the boss.' },
      { who: 'jinxy', text: 'Da. Goodnight, cowboy.', fx: 'ko' },
      { who: 'narrator', text: '...', bg: 'black' },
      { who: 'narrator', text: 'Billy wakes up tied to a chair. A single lamp swings overhead.', bg: 'interrogation' },
      { who: 'jinxy', text: 'Wakey wakey. Now. Tell me about the wizard.' },
      { who: 'billy', text: "I ain't tellin' you nothin'." },
      { who: 'jinxy', text: 'Everyone talks eventually. But I am a reasonable cat. So I offer you a choice.' },
      { who: 'jinxy', text: 'Two pills. Red... and blue. Choose wisely, cowboy.' },
    ],
    choice: [
      { label: 'Blue pill', color: 'blue', scene: 'happy' },
      { label: 'Red pill', color: 'red', scene: 'tbc' },
    ],
  },

  // Blue pill
  happy: {
    bg: 'home',
    cast: ['billy', 'wizard'],
    lines: [
      { who: 'narrator', text: 'Billy swallows the blue pill. Everything goes warm, and bright...' },
      { who: 'narrator', text: 'He wakes up on his porch back in the holler. His truck is parked out front, good as new.' },
      { who: 'narrator', text: 'The corn is high, the jugs are full, and Jinxy is purring on his lap. Turns out she just wanted a warm spot to nap.' },
      { who: 'wizard', text: 'Told you, student. The most powerful being known to man: a fella with a cold beer, a cat, and nowhere to be.' },
      { who: 'billy', text: 'Yeehaw.' },
    ],
    then: { ending: 'happy' },
  },

  // Red pill: Billy wakes up in Hell
  tbc: {
    bg: 'black',
    cast: ['billy', 'jinxy'],
    lines: [
      { who: 'narrator', text: 'Billy swallows the red pill.' },
      { who: 'narrator', text: 'The lamp flickers. The room begins to spin. Jinxy smiles.' },
      { who: 'jinxy', text: 'Welcome to the real world, cowboy.' },
      { who: 'narrator', text: '...' },
      { who: 'narrator', text: 'Billy wakes up. It is HOT. It smells like sulfur and nachos.', bg: 'hell', cast: ['billy', 'devil'] },
      { who: 'billy', text: 'Where in tarnation am I?' },
      { who: 'devil', text: 'Welcome to Hell! Please take a number.' },
      { who: 'billy', text: "I ain't got time for numbers." },
      { who: 'devil', text: 'Spicy. I like you. Here is the deal: the gates are guarded by Pack Billy. Big yellow fella. Always hungry.' },
      { who: 'devil', text: 'Drink the flaming tequila, BELCH fireballs, and feed him five. When he is full, he lets you leave.' },
      { who: 'billy', text: "Drink fire and burp it. I've been training for this my whole life." },
      { who: 'devil', text: 'Off you go!', fx: 'zap' },
    ],
    then: { level: 6 },
  },

  // After Pack Billy is full
  hellExit: {
    bg: 'hell',
    cast: ['billy', 'packbilly'],
    lines: [
      { who: 'narrator', text: 'Pack Billy swells up like a yellow balloon. His eyes go glassy. His cheeks puff out...' },
      { who: 'packbilly', text: '*BUUUUURP*' },
      { who: 'devil', text: 'Well, I will be. Nobody has ever filled him up.', cast: ['billy', 'devil'] },
      { who: 'billy', text: 'So... can I go now?', cast: ['billy', 'packbilly'] },
      { who: 'packbilly', text: '...Go. Please. Before I explode.' },
      { who: 'narrator', text: 'The gates of Hell swing open. Billy bolts for the exit. His backside is on FIRE.', bg: 'gates', cast: ['billy'], anim: 'run' },
      { who: 'billy', text: 'YEEEOWWW! HOT HOT HOT HOT!', anim: 'run' },
      { who: 'narrator', text: 'Up ahead, in the middle of nowhere, sits a lonely toilet.', bg: 'outside', anim: 'toilet' },
      { who: 'billy', text: "Don't mind if I do!", anim: 'sit' },
      { who: 'narrator', text: 'PSSSSSSSSSSSHHHHhhhh...', anim: 'sit', fx: 'steam' },
      { who: 'billy', text: 'Ahhhhhhhhh.', anim: 'sit', fx: 'steam' },
      { who: 'billy', text: "Now I need a drink. Big Al's Liquor Store ought to be somewhere around here...", anim: 'sit' },
    ],
    then: { level: 7 },
  },

  // Reaching Big Al's
  bigAl: {
    bg: 'store',
    cast: ['billy', 'bigal'],
    lines: [
      { who: 'narrator', text: "Billy slides into the parking lot of Big Al's Liquor Store. The neon sign buzzes. The door jingles." },
      { who: 'bigal', text: "Welcome to Big Al's! What'll it be, friend?" },
      { who: 'billy', text: 'Anything. Anything at all. Just not tequila.' },
      { who: 'bigal', text: 'Ha! Cold root beer, then. On the house. You look like you have had a day.' },
      { who: 'billy', text: 'You have no idea.' },
      { who: 'narrator', text: 'Billy cracks open an ice-cold root beer and sits down for the first time all week. Outside, a siren wails... and a tiny shadow in a fur hat slips behind the dumpster.' },
    ],
    then: { scene: 'abduction' },
  },

  // A beam from the sky takes Billy to the alien hive
  abduction: {
    bg: 'store',
    cast: ['billy', 'bigal'],
    lines: [
      { who: 'narrator', text: 'The root beer rattles. The neon sign flickers. A column of green light drops out of the clouds.', fx: 'zap' },
      { who: 'bigal', text: "Aw, shoot. Not again. They are the cousins of the aliens you been shooting, partner." },
      { who: 'bigal', text: "Their mama is not happy. Folks call her the Queen." },
      { who: 'billy', text: 'I only wanted a root beer!', anim: 'run' },
      { who: 'narrator', text: 'Billy floats up into the mothership... and drops into a dark, dripping, breathing hive.', bg: 'hive', cast: ['billy'] },
      { who: 'billy', text: 'Well this is gross. Where is my ray gun... and what is this stuff on the walls?' },
      { who: 'narrator', text: 'Blue doors need a shot. Red doors need something a lot bigger. Somewhere deep in the nest, the Queen is waiting. Rumor says a cracked wall hides something worth finding.' },
    ],
    then: { level: 8 },
  },

  // After the Queen goes down
  queenDead: {
    bg: 'hive',
    cast: ['billy', 'queen'],
    lines: [
      { who: 'narrator', text: 'The Alien Queen staggers. Black chitin cracks. Acid drips from her great big bunny teeth.' },
      { who: 'queen', text: "Y'all ain't from around here, are ye, boy?" },
      { who: 'billy', text: "I could say the same about you, ma'am." },
      { who: 'queen', text: 'Hee hee. I was raised up in a barn on Tater Creek. Then the aliens got me. Then I got them.' },
      { who: 'queen', text: "Big Mama only wanted a good home for her babies. Y'all are plumb rude." },
      { who: 'billy', text: 'Sorry about your eggs. And your teeth.' },
      { who: 'queen', text: 'Go on. Git. But something far worse is coming. It has a fur hat.' },
      { who: 'narrator', text: 'The hive shudders. A hatch opens to the sky. Somewhere far away, a small grey cat purrs...' },
    ],
    then: { ending: 'tbc' },
  },
};
