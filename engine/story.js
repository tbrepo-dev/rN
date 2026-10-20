// Cutscenes. A scene is a list of lines shown one tap at a time on a themed backdrop.
//   who: 'narrator' | 'sign' | a cast member ('billy', 'wizard', 'natasha')
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
    cast: ['billy', 'natasha'],
    lines: [
      { who: 'narrator', text: 'Max the tabby gives one last wheeze, rolls over, and starts to snore. The dojo falls silent.' },
      { who: 'billy', text: 'Whew. That cat was the size of a hay wagon.' },
      { who: 'narrator', text: 'A tiny shadow steps out from behind the paper doors.' },
      { who: 'natasha', text: 'Impressive, cowboy. Nobody beats Max. Not in twelve years.' },
      { who: 'billy', text: 'And who might you be? You are about the size of a boot.' },
      { who: 'natasha', text: 'I am Natasha, of the Russian Blue family. We run this city. Max was our muscle.' },
      { who: 'billy', text: 'So you are the boss.' },
      { who: 'natasha', text: 'Da. Goodnight, cowboy.', fx: 'ko' },
      { who: 'narrator', text: '...', bg: 'black' },
      { who: 'narrator', text: 'Billy wakes up tied to a chair. A single lamp swings overhead.', bg: 'interrogation' },
      { who: 'natasha', text: 'Wakey wakey. Now. Tell me about the wizard.' },
      { who: 'billy', text: "I ain't tellin' you nothin'." },
      { who: 'natasha', text: 'Everyone talks eventually. But I am a reasonable cat. So I offer you a choice.' },
      { who: 'natasha', text: 'Two pills. Red... and blue. Choose wisely, cowboy.' },
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
      { who: 'narrator', text: 'The corn is high, the jugs are full, and Natasha is purring on his lap. Turns out she just wanted a warm spot to nap.' },
      { who: 'wizard', text: 'Told you, student. The most powerful being known to man: a fella with a cold beer, a cat, and nowhere to be.' },
      { who: 'billy', text: 'Yeehaw.' },
    ],
    then: { ending: 'happy' },
  },

  // Red pill
  tbc: {
    bg: 'black',
    cast: ['billy', 'natasha'],
    lines: [
      { who: 'narrator', text: 'Billy swallows the red pill.' },
      { who: 'narrator', text: 'The lamp flickers. The room begins to spin. Natasha smiles.' },
      { who: 'natasha', text: 'Welcome to the real world, cowboy.' },
    ],
    then: { ending: 'tbc' },
  },
};
