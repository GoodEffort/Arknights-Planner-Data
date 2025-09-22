import type { UniEquip_Table, Module } from "./types/operator";

const jsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/excel/uniequip_table.json";
const cn_jsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/cn/gamedata/excel/uniequip_table.json";

const getModuledata = async () => {
    const [response, cn_response] = await Promise.all([fetch(jsonLink), fetch(cn_jsonLink)]);
    const [data, cn_data]: UniEquip_Table[] = await Promise.all([response.json(), cn_response.json()]);

    const combinedEquipDict = { ...cn_data.equipDict, ...data.equipDict };

    const ModuleDict: { [key: string]: (Module & { cnOnly: boolean })[] } = {};

    for (const characterKey in cn_data.charEquip) {
        const moduleKeys = cn_data.charEquip[characterKey];
        ModuleDict[characterKey] = [];
        for (const moduleKey of moduleKeys) {
            const module: Module & { cnOnly: boolean; } = { cnOnly: false, ...combinedEquipDict[moduleKey] };
            if (module.type !== "INITIAL") {
                module.cnOnly = !data.equipDict[moduleKey];
                ModuleDict[characterKey].push(module);
            }
        }
    }

    return ModuleDict;
};

export default getModuledata;