interface SummonerSkillList {
    [Key: string]: {
        name: string
        description: string
        summonerlevel: string
        cooldown: string
        gamemode: string
        icon: string
    }
}

interface SummonerSkillResult {
    summonerskill: SummonerSkillList
    version: string
    fileName: string
    fileTime: string
}

interface Hero {
    heroId: string
    name: string
    alias: string
    title: string
    roles: string[]
    isWeekFree: string
    attack: string
    defense: string
    magic: string
    difficulty: string
    selectAudio: string
    banAudio: string
    isARAMweekfree: string
    ispermanentweekfree: string
    changeLabel: string
    goldPrice: string
    couponPrice: string
    camp: string
    campId: string
    keywords: string
}

interface HeroList {
    hero: Hero[]
    version: string
    fileName: string
    fileTime: string
}

interface HeroInfo {
    heroId: string
    name: string
    alias: string
    title: string
    roles: string[]
    shortBio: string
    camp: string
    campId: string
    attack: string
    defense: string
    magic: string
    difficulty: string
    hp: string
    hpperlevel: string
    mp: string
    mpperlevel: string
    movespeed: string
    armor: string
    armorperlevel: string
    spellblock: string
    spellblockperlevel: string
    attackrange: string
    hpregen: string
    hpregenperlevel: string
    mpregen: string
    mpregenperlevel: string
    crit: string
    critperlevel: string
    attackdamage: string
    attackdamageperlevel: string
    attackspeed: string
    attackspeedperlevel: string
    allytips: string[]
    enemytips: string[]
    heroVideoPath: string
    isWeekFree: string
    damageType: string
    style: string
    difficultyL: string
    damage: string
    durability: string
    crowdControl: string
    mobility: string
    utility: string
    selectAudio: string
    banAudio: string
    changeLabel: string
    goldPrice: string
    couponPrice: string
    keywords: string
    introduce: string
    palmHeroHeadImg: string
    relations: string[]
}

interface SkinInfo {
    skinId: string
    heroId: string
    heroName: string
    heroTitle: string
    name: string
    chromas: string
    chromasBelongId: string
    isBase: string
    emblemsName: string
    description: string
    mainImg: string
    iconImg: string
    loadingImg: string
    videoImg: string
    sourceImg: string
    vedioPath: string
    suitType: string
    publishTime: string
    chromaImg: string
}

interface SpellInfo {
    heroId: string
    spellKey: string
    name: string
    description: string
    abilityIconPath: string
    abilityVideoPath: string
    dynamicDescription: string
    cost: string[]
    costburn: string
    cooldown: string[]
    cooldownburn: string
    range: string[]
}

interface HeroAllInfo {
    hero: HeroInfo
    skins: SkinInfo[]
    spells: SpellInfo[]
    version: string
    fileName: string
    fileTime: string
}

interface Champion {
    name: string
    title: string
    english: string
    gold: string
    coupon: string
    isWeekFree: boolean
    spellList: {
        [Key: string]: string
    }
}

interface ChampionList {
    [Id: string]: Champion
}

interface Mode {
    name: string
    code: number
    wikiName: string
}

interface ModeOtherChange {
    [Mode: string]: {
        [Champion: string]: string[]
    }
}

interface Change {
    // championName: string
    damageDealt: number
    damageReceived: number
    shieldingDone: number
    healingDone: number
    otherChangeList: string[]
}

interface ModeChange {
    [Champion: string]: Change
}

interface ModeChangeList {
    [Mode: string]: ModeChange
}

interface Cid {
    [ChampionId: string]: [number, number, number, number, number, number, number, number, string, number, number]
}

interface LolAlyticsData {
    cid: Cid
    totals: number[]
    win: number
    pick: number
}

interface RuneList {
    pri: [number, number, number, number]
    sec: [number, number]
    mod: [number, number]
}

interface ChampionInfo {
    winRank: number
    tier: number
    win: number
    pick: number
    skillOrder: string[]
    summonerSkillOrder: string[]
    runeList: RuneList
    initItemList: number[][]
    coreItemList: number[]
    mythicItemList: number[][]
    startItemList: [string[], number, number][]
    bootList: number[][]
    name: string
    title: string
    english: string
    item1stList: number[][]
    item2ndList: number[][]
    item3rdList: number[][]
    item4thList: number[][]
    item5thList: number[][]
    pickItemList: number[][]
    winItemList: number[][]
    spellList: {
        [Key: string]: string
    }
    gold: string
    coupon: string
    isWeekFree: boolean
    heat: number
    change?: Change
    championId: number
}

interface ModeChampionInfo {
    [ChampionId: string]: ChampionInfo
}

interface SaveInfo<T> {
    time: string
    data: T
}

interface KeywordList {
    [ChampionId: string]: {
        name: string
        title: string
        english: string
        keyword: string[]
    }
}