import fs from "fs"
import { $, updateModeChange, log, updateModeInfo, modeExistList } from "./utils"
import { message, modeList } from "./constant"
import dayjs from "dayjs"
import axios from "axios"

export async function app() {
    log(`开始时间：${dayjs().format("YYYY-MM-DD hh:mm:ss")}`)

    let summonerSkillList, version, heroList

    try {
        const data = await $<SummonerSkillResult>("https://game.gtimg.cn/images/lol/act/img/js/summonerskillList/summonerskill_list.js")
        summonerSkillList = data.summonerskill as SummonerSkillList
    } catch (error) {
        log("获取召唤师技能失败")
        return
    }

    try {
        const data = await $<HeroList>("https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js")
        version = data.version
        heroList = data.hero
    } catch (error) {
        log("获取国服版本失败")
        return
    }

    const keywordList = JSON.parse(fs.readFileSync("./data/keyword_list.json", "utf-8")) as KeywordList

    heroList.forEach(item => {
        keywordList[item.heroId] = {
            name: item.title,
            title: item.name,
            english: item.alias,
            keyword: Array.from(new Set([...(keywordList[item.heroId] ? keywordList[item.heroId].keyword : []).map(keyword => keyword.toLowerCase()), ...item.keywords.toLowerCase().split(",")])).filter(item => !!item)
        }
    })

    fs.writeFileSync("./data/keyword_list.json", JSON.stringify(keywordList))

    log(`当前的国服版本是 ${version}`)

    log("开始获取国服所有英雄数据")

    const championList: ChampionList = {}

    for (const hero of heroList) {
        try {
            const { hero: champion, spells } = await $<HeroAllInfo>(`https://game.gtimg.cn/images/lol/act/img/js/hero/${hero.heroId}.js`)

            championList[champion.heroId] = {
                name: champion.title,
                title: champion.name,
                english: champion.alias,
                gold: champion.goldPrice,
                coupon: champion.couponPrice,
                isWeekFree: champion.isWeekFree === "1",
                spellList: {}
            }
            spells.forEach(value => {
                championList[champion.heroId].spellList[value.spellKey[0].toUpperCase()] = value.abilityIconPath
            })
        } catch (error) {
            log(`获取国服 ${hero.title} 数据失败`)
            return
        }
    }

    championList["888"].name = "烈娜塔"

    log("获取国服所有英雄数据成功")

    const modeChangeList = await updateModeChange()

    // 获取版本排名

    const queryVersionList = [version, "7"]

    for (const queryVersion of queryVersionList) {
        for (const mode of modeList) {
            await updateModeInfo({ version: queryVersion, mode, modeChange: modeChangeList[mode.name], summonerSkillList, championList })
        }
    }

    const existList = Object.keys(modeExistList).filter(key => modeExistList[key])

    for (const name of existList) {
        for (const queryVersion of queryVersionList) {
            try {
                const fileName = `${name}_${queryVersion === "7" ? "week" : "version"}`
                const filePath = `./data/${fileName}.json`
                const { data } = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SaveInfo<ModeChampionInfo>
                const res = await axios({
                    url: "https://0d8bc6b0-57d9-4427-af8f-8e27aedfe19e.bspapp.com/database",
                    data: {
                        mode: name,
                        fileName,
                        modeData: data,
                        closestMode: existList.filter(item => item !== "aram"),
                        version,
                        keywordList,
                        messageId: message.id,
                        messageTitle: message.title,
                        messageContent: message.content,
                        messageAvailable: message.available
                    },
                    method: "POST"
                })
                if (res.data.fileID) {
                    log(`${fileName} 上传成功`)
                } else {
                    log(`${fileName} 上传失败`)
                    log(res.data)
                }
            } catch (error) {
                // log(error)
            }
        }
    }

    log(`全部完成：${dayjs().format("YYYY-MM-DD hh:mm:ss")}`)
}

app()
