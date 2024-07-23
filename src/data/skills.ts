import { SkillTable } from "./types/skills";

const jsonLink = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/en_US/gamedata/excel/skill_table.json";
const cn_jsonLink = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/skill_table.json";

const getSkilldata = async () => {
    const [response, cn_response] = await Promise.all([fetch(jsonLink), fetch(cn_jsonLink)]);
    const [data, cn_data]: [SkillTable, SkillTable] = await Promise.all([response.json(), cn_response.json()]);

    const combinedData = Object.assign(cn_data, data);

    const skills: { [key: string]: string } = {};
    for (const key in combinedData) {
        skills[key] = combinedData[key].levels[0].name;
    }

    return skills;
};

export default getSkilldata;