/** Curated Unsplash photography — professional fintech & business imagery */

function unsplash(photoId: string, width = 1200, height = 800) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

export const IMAGES = {
  hero: {
    tradingDesk: unsplash("1611974789855-9c2a0a7236a3", 1400, 900),
    office: unsplash("1497366216548-37526070297c", 1400, 900),
    analytics: unsplash("1551288049-bebda4e38f71", 1400, 900),
  },
  about: {
    team: unsplash("1600880292203-757bb62b4baf", 1000, 700),
    advisor: unsplash("1556761175-5973dc0f32e7", 800, 1000),
    skyline: unsplash("1486406146926-c627a92ad1ab", 1200, 800),
    meeting: unsplash("1521737604893-d14cc237f11d", 1000, 700),
  },
  services: {
    hedgeFunds: unsplash("1460925895917-afdab827c52f", 800, 500),
    copyTrading: unsplash("1579621970563-ebec7560ff3e", 800, 500),
    cryptoMining: unsplash("1621761192522-63ede5464df1", 800, 500),
    forex: unsplash("1590283603385-17ffb3a7f29f", 800, 500),
    stocks: unsplash("1642790106117-e829e14a08fe", 800, 500),
    signals: unsplash("1611974789855-9c2a0a7236a3", 800, 500),
  },
  security: {
    datacenter: unsplash("1558494949-ef010cbdcc31", 1200, 800),
    encryption: unsplash("1563986768609-322da13575f3", 1200, 800),
  },
  lifestyle: {
    laptop: unsplash("1517245386807-bb43d82bedb8", 1000, 700),
    mobile: unsplash("1563013544-824ae1b704d3", 800, 600),
    workspace: unsplash("1497366754035-f200968a6e72", 1200, 800),
  },
  avatars: {
    james: unsplash("1507003211169-0a1dd7228f2d", 256, 256),
    sarah: unsplash("1573496359142-b8d87734a5a2", 256, 256),
    michael: unsplash("1560250097-0b93528c311a", 256, 256),
    emma: unsplash("1544005313-94ddf0286df2", 256, 256),
    david: unsplash("1472099645785-5658abf4ff4e", 256, 256),
    lisa: unsplash("1580896810199-f0c94a0722e0", 256, 256),
  },
  pages: {
    payouts: unsplash("1579621970563-ebec7560ff3e", 1200, 600),
    tradingRoom: unsplash("1642790106117-e829e14a08fe", 1200, 600),
    holdings: unsplash("1611974789855-9c2a0a7236a3", 1200, 600),
    plans: unsplash("1454165804606-c3d57bc86b40", 1200, 600),
  },
} as const;

export const SERVICE_IMAGES: Record<string, string> = {
  "hedge-funds": IMAGES.services.hedgeFunds,
  "copy-trading": IMAGES.services.copyTrading,
  "crypto-mining": IMAGES.services.cryptoMining,
  forex: IMAGES.services.forex,
  stocks: IMAGES.services.stocks,
};
