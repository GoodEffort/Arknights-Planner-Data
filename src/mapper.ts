import type { Module as RawModuleData, RawLevelUpCostData, RawOperatorData, RawPhaseData, RawSkillData } from "./data/types/operator";
import type { LevelUpCost, Promotion, Operator, Skill, Module, Item, Recipe } from "./data/types/outputdata";
import type { Item as RawItemData} from "./data/types/item";

type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type RawSkillLevelUp = ArrayElement<RawOperatorData["allSkillLvlup"]>;

const mapLevelUpCost = ({ id, count }: RawLevelUpCostData): LevelUpCost => {
    return {
        id,
        count
    }
};

const mapSkillLevelUp = ({ lvlUpCost }: RawSkillLevelUp): LevelUpCost[] => {
    return lvlUpCost?.map(mapLevelUpCost) ?? [];
};

const mapPromotion = ({ maxLevel, evolveCost }: RawPhaseData): Promotion => {
    return {
        maxLevel,
        evolveCost: evolveCost?.map(mapLevelUpCost) ?? []
    }
};

const mapSkills = ({ skillId, levelUpCostCond }: RawSkillData, skillDict: { [key: string]: { id: string; iconId: string; name: string; } }): Skill => {
    const levelUpCosts = levelUpCostCond.map(({ levelUpCost }) => levelUpCost || []);
    return {
        id: skillDict[skillId].id,
        icon: skillDict[skillId].iconId,
        name: skillDict[skillId].name,
        masteryCosts: levelUpCosts.map(c => c.map(mapLevelUpCost) ?? [])
    }
};

const mapModules = (modules: (RawModuleData & { cnOnly: boolean })[]): Module[] => {
    return modules.map(({ uniEquipId, typeName1, typeName2, uniEquipIcon, uniEquipDesc, itemCost, uniEquipName, cnOnly }): Module => {
        if (typeName2 === null) {
            throw new Error("typeName2 is null: " + uniEquipId);
        }

        return {
            cnOnly,
            typeName1,
            type: typeName2,
            icon: uniEquipIcon,
            description: uniEquipDesc,
            name: uniEquipName,
            cost: [itemCost["1"].map(mapLevelUpCost), itemCost["2"].map(mapLevelUpCost), itemCost["3"].map(mapLevelUpCost)]
        }
    });
};

const mapProfession = (profession: string): string => {
    switch (profession) {
        case "PIONEER":
            return "Vanguard";
        case "WARRIOR":
            return "Guard";
        case "SNIPER":
            return "Sniper";
        case "CASTER":
            return "Caster";
        case "MEDIC":
            return "Medic";
        case "SUPPORT":
            return "Supporter";
        case "SPECIAL":
            return "Specialist";
        case "TANK":
            return "Defender";
        default:
            return "";
    }
};

const mapOperator = ({ id, name, rarity, profession, phases, skills, allSkillLvlup, cnOnly }: RawOperatorData, skillDict: { [key: string]: { id: string; iconId: string; name: string; } }, moduleDict: { [key: string]: (RawModuleData & { cnOnly: boolean})[] }): Operator => {
    return {
        id,
        cnOnly,
        name,
        profession: mapProfession(profession),
        rarity,
        skillLevelUpCosts: allSkillLvlup.map(mapSkillLevelUp),
        promotions: phases.map(mapPromotion),
        skills: skills.map((skill) => mapSkills(skill, skillDict)),
        modules: moduleDict[id] ? mapModules(moduleDict[id]): []
    }
};

const mapItem = ({ itemId, name, description, rarity, iconId, sortId, classifyType, itemType, stageDropList }: RawItemData, recipeDict: { [key: string]: Recipe }): Item => {

    const newItem: Item = {
        itemId,
        name,
        description,
        rarity,
        iconId,
        sortId,
        classifyType,
        itemType,
        stageDropList
    };

    if (recipeDict[itemId]?.costs.length ?? 0 > 0) {
        newItem.recipe = recipeDict[itemId];
    }

    return newItem;
}

export { mapOperator, mapItem };