export type Category = 'TECH' | 'GAMING' | 'MUSIC' | 'INTERNET' | 'CULTURE';

export interface TimelineEvent {
  /** Globally unique, stable id (`<puzzleId>-<index>`). */
  id: string;
  title: string;
  clue: string;
  year: number;
  category: Category;
}

export interface Puzzle {
  id: number;
  theme: string;
  events: TimelineEvent[];
}

type RawEvent = readonly [title: string, clue: string, year: number, category: Category];

/**
 * 35 curated five-event sets. Every set uses five distinct years so there is
 * exactly one correct chronological order.
 */
const RAW_PUZZLES: ReadonlyArray<{ theme: string; events: readonly RawEvent[] }> = [
  {
    theme: 'Viral Origins',
    events: [
      ['First YouTube Video Uploaded', '"Me at the zoo" — 19 seconds of elephants.', 2005, 'INTERNET'],
      ['iPhone 1 Announced', 'An iPod, a phone, and an internet communicator.', 2007, 'TECH'],
      ['Minecraft First Playable Release', 'Notch shares "Cave Game" on a forum.', 2009, 'GAMING'],
      ['Gangnam Style Hits 1B Views', 'First video ever to cross a billion plays.', 2012, 'MUSIC'],
      ['TikTok Goes Global', 'Merges with Musical.ly and takes over phones.', 2018, 'INTERNET'],
    ],
  },
  {
    theme: 'Console Wars',
    events: [
      ['NES Launches in North America', 'Bundled with a robot named R.O.B.', 1985, 'GAMING'],
      ['Sony PlayStation Debuts in Japan', 'Discs, not cartridges, change everything.', 1994, 'GAMING'],
      ['Original Xbox Launches', 'Microsoft enters the living room with Halo.', 2001, 'GAMING'],
      ['Nintendo Wii Released', 'Grandparents start bowling in the lounge.', 2006, 'GAMING'],
      ['Nintendo Switch Released', 'A console you can take on the bus.', 2017, 'GAMING'],
    ],
  },
  {
    theme: 'Social Network Birth',
    events: [
      ['TheFacebook Goes Live', 'Harvard dorm-room directory goes online.', 2004, 'INTERNET'],
      ['First Tweet Sent', '"just setting up my twttr"', 2006, 'INTERNET'],
      ['Instagram Launches', 'Square photos with vintage filters.', 2010, 'INTERNET'],
      ['Snapchat Launches as Picaboo', 'Photos that vanish in seconds.', 2011, 'INTERNET'],
      ['Discord Launches', 'Voice chat built for gamers.', 2015, 'INTERNET'],
    ],
  },
  {
    theme: 'Search & Web',
    events: [
      ['World Wide Web Proposed', 'A CERN memo marked "vague but exciting".', 1989, 'TECH'],
      ['Google Founded', 'Two Stanford students in a garage.', 1998, 'TECH'],
      ['Wikipedia Launches', 'The encyclopedia anyone can edit.', 2001, 'INTERNET'],
      ['Gmail Launches', 'Announced on April Fools\' Day — with 1GB.', 2004, 'TECH'],
      ['Google Chrome Released', 'A browser that came with a comic book.', 2008, 'TECH'],
    ],
  },
  {
    theme: 'Music Goes Digital',
    events: [
      ['Napster Launches', 'Peer-to-peer MP3s terrify record labels.', 1999, 'MUSIC'],
      ['First iPod Revealed', '1,000 songs in your pocket.', 2001, 'TECH'],
      ['iTunes Store Opens', '99 cents per song, legally.', 2003, 'MUSIC'],
      ['Spotify Launches', 'Swedish streaming with a free tier.', 2008, 'MUSIC'],
      ['Apple Music Launches', 'Apple finally goes all-in on streaming.', 2015, 'MUSIC'],
    ],
  },
  {
    theme: 'Multiplayer Mania',
    events: [
      ['Halo: Combat Evolved Released', 'Master Chief\'s first ring.', 2001, 'GAMING'],
      ['World of Warcraft Launches', 'Azeroth opens its servers.', 2004, 'GAMING'],
      ['League of Legends Released', 'Riot\'s free-to-play MOBA arrives.', 2009, 'GAMING'],
      ['Fortnite Battle Royale Drops', '100 players, one bus, building wars.', 2017, 'GAMING'],
      ['Among Us Explodes on Twitch', 'A two-year-old game becomes sus.', 2020, 'GAMING'],
    ],
  },
  {
    theme: 'Box Office Giants',
    events: [
      ['Toy Story Released', 'First fully computer-animated feature.', 1995, 'CULTURE'],
      ['Titanic Sets Sail in Cinemas', '"I\'m the king of the world!"', 1997, 'CULTURE'],
      ['The Matrix Released', 'Red pill or blue pill?', 1999, 'CULTURE'],
      ['Avatar Released', 'Pandora in glorious 3D.', 2009, 'CULTURE'],
      ['Avengers: Endgame Released', '"I love you 3000."', 2019, 'CULTURE'],
    ],
  },
  {
    theme: 'Pocket Apps',
    events: [
      ['Nokia 3310 Released', 'Indestructible brick with Snake II.', 2000, 'TECH'],
      ['Apple App Store Opens', '500 apps on day one.', 2008, 'TECH'],
      ['Angry Birds Released', 'Slingshots versus green pigs.', 2009, 'GAMING'],
      ['Pokémon GO Launches', 'Crowds chase Pikachu through parks.', 2016, 'GAMING'],
      ['NYT Buys Wordle', 'Green and yellow squares go mainstream.', 2022, 'INTERNET'],
    ],
  },
  {
    theme: 'Pop Royalty',
    events: [
      ['"...Baby One More Time" Released', 'A school-uniform video makes a star.', 1998, 'MUSIC'],
      ['"Crazy in Love" Released', 'Beyoncé\'s first solo smash.', 2003, 'MUSIC'],
      ['"Just Dance" Released', 'Lady Gaga\'s debut single.', 2008, 'MUSIC'],
      ['Taylor Swift Releases "1989"', 'Her full switch from country to pop.', 2014, 'MUSIC'],
      ['"bad guy" Released', 'Billie Eilish whispers her way to #1.', 2019, 'MUSIC'],
    ],
  },
  {
    theme: 'Meme Hall of Fame',
    events: [
      ['Dancing Baby Goes Viral', 'A 3D baby shuffles through email chains.', 1996, 'INTERNET'],
      ['Rickrolling Begins', 'Never gonna give you up.', 2007, 'INTERNET'],
      ['Nyan Cat Uploaded', 'A Pop-Tart cat trailing rainbows.', 2011, 'INTERNET'],
      ['Harlem Shake Craze', 'Helmet guy dances, then everyone does.', 2013, 'INTERNET'],
      ['Distracted Boyfriend Meme', 'A stock photo becomes a template.', 2017, 'INTERNET'],
    ],
  },
  {
    theme: 'Space Age',
    events: [
      ['Hubble Telescope Launched', 'Needed glasses after its first photos.', 1990, 'TECH'],
      ['First ISS Module Launched', 'The Zarya module reaches orbit.', 1998, 'TECH'],
      ['Falcon 9 First Launch', 'SpaceX\'s workhorse rocket flies.', 2010, 'TECH'],
      ['Falcon Heavy Launches a Tesla', 'Starman cruises past Mars.', 2018, 'TECH'],
      ['First Black Hole Image', 'A glowing orange donut in M87.', 2019, 'CULTURE'],
    ],
  },
  {
    theme: 'Handheld Heroes',
    events: [
      ['Tetris Created', 'Falling blocks from a Moscow lab.', 1984, 'GAMING'],
      ['Game Boy Released', 'Grey brick, green screen, AA batteries.', 1989, 'GAMING'],
      ['Pokémon Red & Green (Japan)', 'Gotta catch \'em all — first 151.', 1996, 'GAMING'],
      ['Nintendo DS Released', 'Two screens, one stylus.', 2004, 'GAMING'],
      ['Animal Crossing: New Horizons', 'Island life during lockdown.', 2020, 'GAMING'],
    ],
  },
  {
    theme: 'Rise of the Machines',
    events: [
      ['Deep Blue Beats Kasparov', 'A computer wins a chess match vs. champ.', 1997, 'TECH'],
      ['Roomba Released', 'Robots start vacuuming your floor.', 2002, 'TECH'],
      ['IBM Watson Wins Jeopardy!', 'Beats the show\'s greatest champions.', 2011, 'TECH'],
      ['AlphaGo Beats Lee Sedol', 'Move 37 stuns the Go world.', 2016, 'TECH'],
      ['ChatGPT Launches', '1 million users in five days.', 2022, 'TECH'],
    ],
  },
  {
    theme: 'Streaming Wars',
    events: [
      ['Netflix Founded', 'DVDs by mail in red envelopes.', 1997, 'CULTURE'],
      ['Hulu Launches Publicly', 'Network TV shows, free online.', 2008, 'INTERNET'],
      ['Twitch Launches', 'Spun off from Justin.tv for gamers.', 2011, 'GAMING'],
      ['House of Cards Binge Drop', 'Netflix drops a whole prestige season.', 2013, 'CULTURE'],
      ['Disney+ Launches', 'Baby Yoda steals the show.', 2019, 'CULTURE'],
    ],
  },
  {
    theme: 'K-Pop Wave',
    events: [
      ['Seo Taiji and Boys Debut', 'Often called the birth of modern K-pop.', 1992, 'MUSIC'],
      ['"Gangnam Style" Released', 'Invisible-horse dance goes worldwide.', 2012, 'MUSIC'],
      ['BTS Debuts', 'Seven members, "No More Dream".', 2013, 'MUSIC'],
      ['BLACKPINK Debuts', '"Whistle" and "Boombayah" double drop.', 2016, 'MUSIC'],
      ['"Dynamite" Tops the Hot 100', 'First all-Korean act at US #1.', 2020, 'MUSIC'],
    ],
  },
  {
    theme: 'Gadget Drops',
    events: [
      ['Sony Walkman Released', 'Personal music on cassette.', 1979, 'TECH'],
      ['First Commercial Cellphone', 'Motorola DynaTAC: the "brick".', 1983, 'TECH'],
      ['PalmPilot Released', 'A stylus and a pocket organizer.', 1996, 'TECH'],
      ['iPad Released', 'A giant iPhone that changed tablets.', 2010, 'TECH'],
      ['Apple Watch Released', 'Apple straps a computer to your wrist.', 2015, 'TECH'],
    ],
  },
  {
    theme: 'Superhero Cinema',
    events: [
      ['Superman: The Movie', '"You\'ll believe a man can fly."', 1978, 'CULTURE'],
      ['Tim Burton\'s Batman', 'Michael Keaton dons the cowl.', 1989, 'CULTURE'],
      ['Sam Raimi\'s Spider-Man', 'The upside-down kiss in the rain.', 2002, 'CULTURE'],
      ['Iron Man Released', 'The MCU begins with "I am Iron Man."', 2008, 'CULTURE'],
      ['Black Panther Released', 'Wakanda Forever.', 2018, 'CULTURE'],
    ],
  },
  {
    theme: 'Open World Legends',
    events: [
      ['GTA III Released', 'Liberty City goes fully 3D.', 2001, 'GAMING'],
      ['Skyrim Released', '"Fus Ro Dah!" — arrow to the knee.', 2011, 'GAMING'],
      ['GTA V Released', 'Three protagonists, one Los Santos.', 2013, 'GAMING'],
      ['Zelda: Breath of the Wild', 'Climb anything you can see.', 2017, 'GAMING'],
      ['Elden Ring Released', 'Rise, Tarnished — FromSoftware goes open world.', 2022, 'GAMING'],
    ],
  },
  {
    theme: 'Music Video Era',
    events: [
      ['MTV Goes on Air', 'First clip: "Video Killed the Radio Star".', 1981, 'MUSIC'],
      ['"Thriller" Video Premieres', 'A 14-minute zombie dance epic.', 1983, 'MUSIC'],
      ['Vevo Launches', 'Music labels build their own video hub.', 2009, 'MUSIC'],
      ['"Despacito" Becomes Most Viewed', 'Overtakes "See You Again" on YouTube.', 2017, 'MUSIC'],
      ['"Old Town Road" 19 Weeks at #1', 'A country-trap song breaks records.', 2019, 'MUSIC'],
    ],
  },
  {
    theme: 'Money Goes Digital',
    events: [
      ['PayPal\'s Origin Company Founded', 'Confinity starts with Palm Pilot payments.', 1998, 'TECH'],
      ['Bitcoin Whitepaper Published', 'Satoshi\'s nine-page PDF.', 2008, 'TECH'],
      ['Bitcoin Pizza Day', '10,000 BTC for two pizzas.', 2010, 'INTERNET'],
      ['Ethereum Goes Live', 'Smart contracts on a blockchain.', 2015, 'TECH'],
      ['El Salvador Adopts Bitcoin', 'First country to make it legal tender.', 2021, 'CULTURE'],
    ],
  },
  {
    theme: 'Animation Icons',
    events: [
      ['Snow White Premieres', 'Disney\'s first feature-length film.', 1937, 'CULTURE'],
      ['The Simpsons Series Premiere', 'A Christmas episode starts it all.', 1989, 'CULTURE'],
      ['Shrek Released', 'An ogre with layers, like onions.', 2001, 'CULTURE'],
      ['Frozen Released', '"Let It Go" on repeat everywhere.', 2013, 'CULTURE'],
      ['Into the Spider-Verse Released', 'Miles Morales takes a leap of faith.', 2018, 'CULTURE'],
    ],
  },
  {
    theme: 'Esports Legends',
    events: [
      ['Space Invaders Championship', 'Atari hosts 10,000 players.', 1980, 'GAMING'],
      ['StarCraft Released', 'Korea\'s national pastime is born.', 1998, 'GAMING'],
      ['Evo Moment #37', 'Daigo parries the full Chun-Li super.', 2004, 'GAMING'],
      ['First Dota 2 International', 'A $1 million prize pool shocks gamers.', 2011, 'GAMING'],
      ['Fortnite World Cup', 'A 16-year-old wins $3 million.', 2019, 'GAMING'],
    ],
  },
  {
    theme: 'Phone Evolution',
    events: [
      ['First SMS Sent', '"Merry Christmas" from a PC to a phone.', 1992, 'TECH'],
      ['Motorola Razr V3 Launches', 'The flip phone everyone wanted.', 2004, 'TECH'],
      ['First Android Phone (T-Mobile G1)', 'Slide-out keyboard, little green robot.', 2008, 'TECH'],
      ['iPhone X Released', 'Goodbye home button, hello Face ID.', 2017, 'TECH'],
      ['Galaxy Fold Released', 'A phone that folds like a book.', 2019, 'TECH'],
    ],
  },
  {
    theme: 'Viral Video Classics',
    events: [
      ['"Charlie Bit My Finger"', '"Ouch, Charlie! That really hurt!"', 2007, 'INTERNET'],
      ['"Double Rainbow" Goes Viral', '"What does it mean?!"', 2010, 'INTERNET'],
      ['Ice Bucket Challenge', 'Freezing water for ALS awareness.', 2014, 'INTERNET'],
      ['"The Dress" Divides the World', 'Blue and black, or white and gold?', 2015, 'INTERNET'],
      ['"Damn, Daniel!"', 'Back at it again with the white Vans.', 2016, 'INTERNET'],
    ],
  },
  {
    theme: 'Hip-Hop History',
    events: [
      ['Hip-Hop\'s Birthday Party', 'DJ Kool Herc spins at 1520 Sedgwick Ave.', 1973, 'MUSIC'],
      ['"Rapper\'s Delight" Released', 'Sugarhill Gang\'s first big rap hit.', 1979, 'MUSIC'],
      ['Run-DMC × Aerosmith "Walk This Way"', 'Rap breaks through the rock wall.', 1986, 'MUSIC'],
      ['"The Slim Shady LP" Released', 'Eminem\'s major-label debut.', 1999, 'MUSIC'],
      ['Kendrick Lamar Wins a Pulitzer', 'First non-classical/jazz winner: DAMN.', 2018, 'MUSIC'],
    ],
  },
  {
    theme: 'Computing Classics',
    events: [
      ['Apple I Released', 'Hand-built by Steve Wozniak.', 1976, 'TECH'],
      ['IBM PC Launches', 'The "Personal Computer" gets its name.', 1981, 'TECH'],
      ['Macintosh Introduced', 'Launched with a famous Super Bowl ad.', 1984, 'TECH'],
      ['Windows 95 Launches', 'Start button, set to the Rolling Stones.', 1995, 'TECH'],
      ['Raspberry Pi Released', 'A credit-card computer for $35.', 2012, 'TECH'],
    ],
  },
  {
    theme: 'Game Changers',
    events: [
      ['Pac-Man Released', 'Waka-waka through a maze of ghosts.', 1980, 'GAMING'],
      ['Street Fighter II Released', 'Hadouken! Arcades get crowded.', 1991, 'GAMING'],
      ['Doom Released', 'Shareware demons on every office PC.', 1993, 'GAMING'],
      ['The Sims Released', 'Remove the pool ladder…', 2000, 'GAMING'],
      ['Roblox Officially Launches', 'A platform built from blocky games.', 2006, 'GAMING'],
    ],
  },
  {
    theme: 'Dance Crazes',
    events: [
      ['"Macarena" Hits US #1', 'Hands, hips, hey Macarena!', 1996, 'MUSIC'],
      ['"Crank That (Soulja Boy)"', 'Superman dance takes over YouTube.', 2007, 'MUSIC'],
      ['"Single Ladies" Video', 'Put a ring on it — in black and white.', 2008, 'MUSIC'],
      ['Running Man Challenge', 'Two college students start a trend.', 2016, 'INTERNET'],
      ['Renegade Dance Explodes', 'A teen\'s TikTok choreo goes everywhere.', 2019, 'INTERNET'],
    ],
  },
  {
    theme: 'Blockbuster Franchises',
    events: [
      ['Star Wars Premieres', 'A long time ago, in a galaxy far away…', 1977, 'CULTURE'],
      ['Jurassic Park Released', 'Life, uh, finds a way.', 1993, 'CULTURE'],
      ['First Harry Potter Film', 'The boy who lived hits cinemas.', 2001, 'CULTURE'],
      ['Pirates of the Caribbean Released', 'Captain Jack Sparrow staggers in.', 2003, 'CULTURE'],
      ['The Hunger Games Film', 'May the odds be ever in your favor.', 2012, 'CULTURE'],
    ],
  },
  {
    theme: 'Page to Phenomenon',
    events: [
      ['The Fellowship of the Ring Published', 'Tolkien\'s epic begins in print.', 1954, 'CULTURE'],
      ['First Harry Potter Book', 'A small UK print run of 500 copies.', 1997, 'CULTURE'],
      ['Twilight Published', 'Vampires that sparkle.', 2005, 'CULTURE'],
      ['The Hunger Games Published', 'District 12\'s tribute volunteers.', 2008, 'CULTURE'],
      ['Game of Thrones Premieres on HBO', 'Winter is coming.', 2011, 'CULTURE'],
    ],
  },
  {
    theme: 'Web 2.0',
    events: [
      ['MySpace Launches', 'Tom is everyone\'s first friend.', 2003, 'INTERNET'],
      ['Reddit Founded', 'The front page of the internet.', 2005, 'INTERNET'],
      ['Tumblr Launches', 'Reblogs, GIFs and fandoms.', 2007, 'INTERNET'],
      ['Pinterest Opens Beta', 'Digital pinboards for ideas.', 2010, 'INTERNET'],
      ['Vine Launches', 'Six-second looping videos.', 2013, 'INTERNET'],
    ],
  },
  {
    theme: 'Electric Era',
    events: [
      ['GM EV1 Leased', 'The electric car that was later crushed.', 1996, 'TECH'],
      ['Toyota Prius Debuts in Japan', 'The first mass-produced hybrid.', 1997, 'TECH'],
      ['Tesla Roadster Deliveries', 'A Lotus body full of laptop batteries.', 2008, 'TECH'],
      ['Nissan Leaf Goes on Sale', 'An affordable mass-market EV.', 2010, 'TECH'],
      ['First Tesla Model 3 Deliveries', 'The "affordable" Tesla arrives.', 2017, 'TECH'],
    ],
  },
  {
    theme: 'Sports Moments',
    events: [
      ['Miracle on Ice', 'US college kids beat the Soviets.', 1980, 'CULTURE'],
      ['Michael Jordan\'s "Flu Game"', '38 points while visibly ill.', 1997, 'CULTURE'],
      ['Usain Bolt Runs 9.58', 'The 100m world record in Berlin.', 2009, 'CULTURE'],
      ['Leicester City Win the League', '5000-to-1 underdogs become champions.', 2016, 'CULTURE'],
      ['Messi Wins the World Cup', 'Argentina triumph in Qatar.', 2022, 'CULTURE'],
    ],
  },
  {
    theme: 'Rock Legends',
    events: [
      ['The Beatles on Ed Sullivan', '73 million Americans tune in.', 1964, 'MUSIC'],
      ['Woodstock Festival', 'Three days of peace and music.', 1969, 'MUSIC'],
      ['Queen at Live Aid', '20 minutes that stole the show.', 1985, 'MUSIC'],
      ['Nirvana Releases "Nevermind"', 'A baby swimming after a dollar.', 1991, 'MUSIC'],
      ['Linkin Park\'s "Hybrid Theory"', '"In the End" it doesn\'t even matter.', 2000, 'MUSIC'],
    ],
  },
  {
    theme: 'Gaming Hardware',
    events: [
      ['Atari 2600 Released', 'Wood-grain panel and a joystick.', 1977, 'GAMING'],
      ['Nintendo 64 Released', 'Mario goes 3D with an analog stick.', 1996, 'GAMING'],
      ['Steam Launches', 'Valve\'s storefront starts with patches.', 2003, 'GAMING'],
      ['Oculus Rift Kickstarter', 'VR crowdfunds its comeback.', 2012, 'TECH'],
      ['PlayStation 5 Released', 'Scalpers make it impossible to find.', 2020, 'GAMING'],
    ],
  },
];

export const PUZZLES: readonly Puzzle[] = RAW_PUZZLES.map((p, pi) => ({
  id: pi + 1,
  theme: p.theme,
  events: p.events.map(([title, clue, year, category], ei) => ({
    id: `p${pi + 1}-${ei}`,
    title,
    clue,
    year,
    category,
  })),
}));

export const ALL_EVENTS: readonly TimelineEvent[] = PUZZLES.flatMap((p) => p.events);

// ---------------------------------------------------------------------------
// Shuffle helpers
// ---------------------------------------------------------------------------

export type RandomFn = () => number;

export function shuffle<T>(items: readonly T[], rand: RandomFn = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function isChronological(events: readonly TimelineEvent[]): boolean {
  for (let i = 1; i < events.length; i++) {
    if (events[i - 1].year > events[i].year) return false;
  }
  return true;
}

/** Shuffle until the order is not already solved (and at least 3 cards are out of place). */
export function scramble(events: readonly TimelineEvent[], rand: RandomFn = Math.random): TimelineEvent[] {
  const sortedYears = events.map((e) => e.year).sort((a, b) => a - b);
  let best = shuffle(events, rand);
  for (let attempt = 0; attempt < 24; attempt++) {
    const candidate = attempt === 0 ? best : shuffle(events, rand);
    const misplaced = candidate.filter((e, i) => e.year !== sortedYears[i]).length;
    if (misplaced >= 3) return candidate;
    if (!isChronological(candidate)) best = candidate;
  }
  return isChronological(best) ? best.slice().reverse() : best;
}

// ---------------------------------------------------------------------------
// Arcade "Shuffle Mix" generator
// ---------------------------------------------------------------------------

/** Minimum gap (years) between any two cards; rounds get tighter as you go. */
export function arcadeMinYearGap(round: number): number {
  if (round <= 2) return 6;
  if (round <= 4) return 4;
  if (round <= 7) return 2;
  return 1;
}

/**
 * Builds a fresh 5-card round from the full event pool, mixing categories,
 * avoiding recently seen cards and narrowing the year gaps as rounds progress.
 */
export function generateArcadeRound(
  round: number,
  recentIds: ReadonlySet<string>,
  rand: RandomFn = Math.random,
): TimelineEvent[] {
  const gap = arcadeMinYearGap(round);
  const fresh = ALL_EVENTS.filter((e) => !recentIds.has(e.id));
  const pool = fresh.length >= 40 ? fresh : ALL_EVENTS;

  for (let attempt = 0; attempt < 60; attempt++) {
    const candidates = shuffle(pool, rand);
    const picked: TimelineEvent[] = [];
    const categoryCount: Partial<Record<Category, number>> = {};
    for (const ev of candidates) {
      if (picked.some((p) => Math.abs(p.year - ev.year) < gap)) continue;
      // Keep the mix varied: at most 2 cards per category.
      if ((categoryCount[ev.category] ?? 0) >= 2) continue;
      picked.push(ev);
      categoryCount[ev.category] = (categoryCount[ev.category] ?? 0) + 1;
      if (picked.length === 5) return scramble(picked, rand);
    }
  }

  // Fallback: any five distinct years (always possible with this dataset).
  const byYear = new Map<number, TimelineEvent>();
  for (const ev of shuffle(ALL_EVENTS, rand)) if (!byYear.has(ev.year)) byYear.set(ev.year, ev);
  return scramble(shuffle([...byYear.values()], rand).slice(0, 5), rand);
}
