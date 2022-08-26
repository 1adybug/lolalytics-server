import fs from "fs"
import {} from "express"
import axios, { AxiosError } from "axios"
import { modeList, modeOtherChange } from "./constant"
import dayjs from "dayjs"

interface AxiosConfig {
    url: string
    headers?: {
        [Header: string]: string
    }
    method?: "GET" | "POST"
    proxy?: {
        host: string
        port: number
    }
}

export async function $<T = any>(config: string | AxiosConfig): Promise<T> {
    if (typeof config === "string") {
        const res = await axios(config)
        return res.data
    }
    const res = await axios(config)
    return res.data
}

export function log(...itemList: any[]) {
    for (const item of itemList) {
        console.log(item instanceof AxiosError ? `Axios 网络请求错误：${item.code}` : item)
        console.log("")
    }
}

export async function updateModeChange() {
    const modeChangeList: ModeChangeList = {}
    for (const { name, wikiName } of modeList) {
        let prevSaveInfo: SaveInfo<ModeChange> | undefined
        try {
            prevSaveInfo = JSON.parse(fs.readFileSync(`./data/${name}_change.json`, "utf-8"))
            if (prevSaveInfo!.time === dayjs().format("YYYY-MM-DD")) {
                modeChangeList[name] = prevSaveInfo!.data
                log(`${name} 模式检测到最新纪录`)
                continue
            }
        } catch (error) {}

        log(`开始获取 ${name} 模式英雄改动`)
        modeChangeList[name] = {}
        try {
            var wikiString = await $<string>({
                url: `https://leagueoflegends.fandom.com/wiki/${wikiName}`,
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
                    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "accept-encoding": "gzip, deflate, br",
                    "accept-language": "zh-CN,zh;q=0.9"
                }
            })
        } catch (error) {
            log(`请求 ${name} 模式在 Wiki 上的页面出错`)
            if (prevSaveInfo) {
                modeChangeList[name] = prevSaveInfo.data
            }
            continue
        }
        const changeStringList = wikiString.match(/<tr>\n<td data-sort-value[\d\D]+?<\/tr>/g)!
        const championList = Object.keys(modeOtherChange[name])
        changeStringList.forEach(change => {
            try {
                let championName = change
                    .match(/".+?"/)![0]
                    .slice(1, -1)
                    .replace(/( |&#39|\.|;)/g, "")
                if (championName === "Nunu&ampWillump") championName = "Nunu"
                if (championName === "Wukong") championName = "MonkeyKing"
                if (championName === "RenataGlasc") championName = "Nilah"
                const [damageDealtString, damageReceivedString] = change.match(/<td>.*?<\/td>/g)!.map(value => value.slice(4, -5))
                const damageDealt = damageDealtString ? parseFloat(damageDealtString) : 0
                const damageReceived = damageReceivedString ? parseFloat(damageReceivedString) : 0
                const shieldingMatch = change.match(/Shielding done (increased|reduced) by \d+?%/)
                const healingMatch = change.match(/Healing done (increased|reduced) by \d+?%/)
                const shieldingDone = shieldingMatch ? (shieldingMatch[0].includes("increased") ? Number(shieldingMatch[0].slice(28, -1)) : -Number(shieldingMatch[0].slice(26, -1))) : 0
                const healingDone = healingMatch ? (healingMatch[0].includes("increased") ? Number(healingMatch[0].slice(26, -1)) : -Number(healingMatch[0].slice(24, -1))) : 0
                const index = championList.findIndex(value => value.toLowerCase() === championName.toLowerCase())
                let otherChangeList: string[] = []
                if (index >= 0) {
                    championName = championList[index]
                    championList.splice(index, 1)
                    otherChangeList = modeOtherChange[name][championName]
                }
                modeChangeList[name][championName] = { damageDealt, damageReceived, shieldingDone, healingDone, otherChangeList }
            } catch (error: any) {
                log("解析英雄变化时出现错误：", change)
                log(error.toString())
            }
        })
        if (championList.length > 1) {
            log("以下英雄的名称出现问题：", JSON.stringify(championList))
        }
        const saveInfo: SaveInfo<ModeChange> = {
            time: dayjs().format("YYYY-MM-DD"),
            data: modeChangeList[name]
        }
        // log(saveInfo)
        fs.writeFileSync(`./data/${name}_change.json`, JSON.stringify(saveInfo))
        // log("保存成功")
    }

    log("获取所有模式英雄改动成功")

    return modeChangeList
}

interface ModeConfig {
    version: string
    mode: Mode
    modeChange: ModeChange
    summonerSkillList: SummonerSkillList
    championList: ChampionList
}

export function getVersionName(version: string) {
    return version === "7" ? "最近一周" : `${version} 版本`
}

export const modeExistList: {
    [Mode: string]: boolean
} = {
    aram: true,
    urf: true,
    ultbook: true,
    nexus: true,
    oneforall: true
}

export async function updateModeInfo({ version, mode: { name, code }, modeChange, summonerSkillList, championList }: ModeConfig) {
    if (!modeExistList[name]) return

    try {
        const saveInfo: SaveInfo<ModeChampionInfo> = JSON.parse(fs.readFileSync(`./data/${name}_${version === "7" ? "week" : "version"}.json`, "utf-8"))
        if (saveInfo.time === dayjs().format("YYYY-MM-DD")) {
            log(`${name} 模式检测到已经存在最新纪录，已经读取`)
            return
        }
    } catch (error) {}

    const versionName = getVersionName(version)

    log(`未检测到最新纪录，开始查询 LOLAlytics 上 ${versionName} 的 ${name} 模式数据`)

    try {
        var data = await $<LolAlyticsData>({
            url: `https://axe.lolalytics.com/tierlist/1/?lane=middle&patch=${version}&tier=platinum_plus&queue=${code}&region=all`,
            proxy: {
                host: "127.0.0.1",
                port: 7890
            }
        })
        if (!data.cid) {
            modeExistList[name] = false
            log(`${versionName} 没有 ${name} 模式`)
            return
        }
    } catch (error) {
        log(`获取 LOLAlytics 上 ${versionName} ${name} 模式的数据失败，错误如下：`)
        log(error)
        return
    }
    const { cid, pick } = data

    const modeChangeChampionNameList = Object.keys(modeChange)

    log(`开始获取 ${versionName} 的 ${name} 模式所有英雄数据`)

    const modeChampionInfo: ModeChampionInfo = {}

    for (const championId in cid) {
        try {
            const data = await $({
                url: `https://axe.lolalytics.com/mega/?ep=champion&p=d&v=1&patch=${version}&cid=${championId}&lane=middle&tier=platinum_plus&queue=${code}&region=all`,
                proxy: {
                    host: "127.0.0.1",
                    port: 7890
                }
            })
            const { summary, mythicItem, spells, startSet, boots, item1, item2, item3, item4, item5, popularItem, winningItem } = data

            // 加点推荐
            const skillOrder = summary.skillpriority.win.id.toString().split("") as string[]

            // 召唤师技能推荐
            const summonerSkillOrder = summary.sum.win.id
                .toString()
                .split("_")
                .map((value: string) => (summonerSkillList[value] ? summonerSkillList[value].icon : "null")) as string[]

            // 符文推荐
            const runeList = summary.runes.win.set as RuneList

            // 出门装推荐
            const originInitItemList = summary.items.win.start.set as number[]
            const initItemList = Array.from(new Set(originInitItemList)).map(value => [value, originInitItemList.filter(item => item === value).length])

            // 三件套推荐
            const coreItemList = summary.items.win.core.set as number[]

            // 神话装排行
            const mythicItemList = (mythicItem as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 召唤师技能排行
            // const spell = spells.sort((a, b) => b[3] - a[3]).slice(0, 7).map(value => [value[0].toString().split("_"), value[1], value[2]])

            // 出门装排行
            const startItemList = (startSet as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => [value[0].toString().split("_"), value[1], value[2]]) as [string[], number, number][]

            // 鞋子排行
            const bootList = (boots as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 第一个大件排行
            const item1stList = (item1 as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 第二个大件排行
            const item2ndList = (item2 as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 第三个大件排行
            const item3rdList = (item3 as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 第四个大件排行
            const item4thList = (item4 as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 第五个大件排行
            const item5thList = (item5 as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 流行大件排行
            const pickItemList = (popularItem as number[][])
                .sort((a, b) => b[3] - a[3])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 大件胜率排行
            const winItemList = (winningItem as number[][])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 7)
                .map(value => value.slice(0, 3))

            // 取出英雄基本数据
            const { name, title, english, gold, coupon, isWeekFree, spellList } = championList[championId]

            const index = modeChangeChampionNameList.findIndex(name => name.toLowerCase() === english.toLowerCase())

            let change: Change | undefined = undefined

            if (index >= 0) {
                change = modeChange[modeChangeChampionNameList[index]]
                modeChangeChampionNameList.splice(index, 1)
            }

            const heat = 0

            const winRank = cid[championId][0]

            const tier = cid[championId][2]

            const win = cid[championId][3]

            const pick = cid[championId][4]

            const championInfo: ChampionInfo = { winRank, tier, win, pick, skillOrder, summonerSkillOrder, runeList, initItemList, coreItemList, mythicItemList, startItemList, bootList, name, title, english, item1stList, item2ndList, item3rdList, item4thList, item5thList, pickItemList, winItemList, spellList, gold, coupon, isWeekFree, heat, change, championId: Number(championId) }
            modeChampionInfo[championId] = championInfo
        } catch (error) {
            log(`获取 lolalytics 上 ${version} 版本 ${name} 模式下 ID 为 ${championId} 的 ${championList[championId].name} 数据失败`)
            log(error)
            return
        }
    }

    if (modeChangeChampionNameList.length > 0) {
        log("以下英雄的名称出现问题：", JSON.stringify(modeChangeChampionNameList))
    }

    const championCount = Object.keys(cid).length

    for (const championId in cid) {
        modeChampionInfo[championId].heat = Number(((modeChampionInfo[championId].pick / pick / (10 / championCount)) * 1000).toFixed(1))
    }

    const saveInfo: SaveInfo<ModeChampionInfo> = {
        time: dayjs().format("YYYY-MM-DD"),
        data: modeChampionInfo
    }

    fs.writeFileSync(`./data/${name}_${version === "7" ? "week" : "version"}.json`, JSON.stringify(saveInfo))

    log(`已经完成 ${versionName} 的 ${name} 模式数据更新`)
}
