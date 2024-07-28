import { SkillTable } from "./types/skills";

const jsonLink = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/en_US/gamedata/excel/skill_table.json";
const cn_jsonLink = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/skill_table.json";

const iconLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/skills/skill_icon_";

const getSkilldata = async () => {
    const [response, cn_response] = await Promise.all([fetch(jsonLink), fetch(cn_jsonLink)]);
    const [data, cn_data]: [SkillTable, SkillTable] = await Promise.all([response.json(), cn_response.json()]);

    const combinedData = Object.assign(cn_data, data);
    const skills = Object.fromEntries(Object.entries(combinedData)
        .map(
            ([id, { iconId, levels }]) => 
                [
                    id, 
                    {
                        id: id,
                        iconId: iconId == null ? id : iconId,
                        icon: iconId == null ?
                            iconLink + id + '.png' : 
                            iconLink + iconId + '/skill_icon_' + iconId + '.png/skill_icon_' + iconId + '.png',
                        name: levels[0].name
                    }
                ]));

    return skills;
};


export default getSkilldata;