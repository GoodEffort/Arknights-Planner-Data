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

const mapSkills = ({ skillId, levelUpCostCond }: RawSkillData, skillDict: { [key: string]: string }): Skill => {
    const levelUpCosts = levelUpCostCond.map(({ levelUpCost }) => levelUpCost || []);
    return {
        id: skillId,
        name: skillDict[skillId],
        masteryCosts: levelUpCosts.map(c => c.map(mapLevelUpCost) ?? [])
    }
};

const mapModules = (modules: RawModuleData[]): Module[] => {
    return modules.map(({ uniEquipId, typeName2, uniEquipIcon, uniEquipDesc, itemCost, uniEquipName }: RawModuleData): Module => {
        if (typeName2 === null) {
            throw new Error("typeName2 is null: " + uniEquipId);
        }

        return {
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
            throw new Error("Unknown profession: " + profession);
    }
};

const mapOperator = ({ id, name, rarity, profession, phases, skills, allSkillLvlup }: RawOperatorData, skillDict: { [key: string]: string }, moduleDict: { [key: string]: RawModuleData[] }): Operator => {
    return {
        id,
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