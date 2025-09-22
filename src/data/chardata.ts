import { RawOperatorData, Character_Table, CharacterPatch } from "./types/operator"
import convertObjectToArray from "../convert-object-to-array";

const characterJsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/excel/character_table.json";
const characterPatchJsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/excel/char_patch_table.json";
const cn_characterJsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/cn/gamedata/excel/character_table.json";
const cn_characterPatchJsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/cn/gamedata/excel/char_patch_table.json";

const getChardata = async () => {
    const [
        response,
        cn_response,
        patch_response,
        cn_patch_response
    ] = await Promise.all([
        fetch(characterJsonLink),
        fetch(cn_characterJsonLink),
        fetch(characterPatchJsonLink),
        fetch(cn_characterPatchJsonLink)
    ]);

    const [
        charData,
        cn_charData,
        patchData,
        cn_patchData
    ]: [
        Character_Table,
        Character_Table,
        CharacterPatch,
        CharacterPatch,
    ] = await Promise.all([
        response.json(),
        cn_response.json(),
        patch_response.json(),
        cn_patch_response.json()
    ]);

    const validateData = (data: Character_Table) => {
        if (!data) {
            throw new Error("Invalid Character data");
        }

        for (const operatorId in data) {
            const operator = data[operatorId];

            if (!operator.appellation && operator.appellation !== "") {
                throw new Error("Invalid Character data: appellation is missing");
            }

            if (!operator.name) {
                throw new Error("Invalid Character data: name is missing");
            }

            if (!operator.profession) {
                throw new Error("Invalid Character data: profession is missing");
            }

            if (!operator.rarity) {
                throw new Error("Invalid Character data: rarity is missing");
            }

            if (!Array.isArray(operator.phases)) {
                const newPhases = convertObjectToArray<typeof operator.phases[0]>(operator.phases as any);
                if (!Array.isArray(newPhases)) {
                    throw new Error("Invalid Character data: phases is missing");
                }
                operator.phases = newPhases;
            }

            if (!Array.isArray(operator.skills)) {
                const newSkills = convertObjectToArray<typeof operator.skills[0]>(operator.skills as any);
                if (!Array.isArray(newSkills)) {
                    throw new Error("Invalid Character data: skills is missing");
                }
                operator.skills = newSkills;
            }

            if (!Array.isArray(operator.allSkillLvlup)) {
                const newAllSkillLvlup = convertObjectToArray<typeof operator.allSkillLvlup[0]>(operator.allSkillLvlup as any);
                if (!Array.isArray(newAllSkillLvlup)) {
                    throw new Error("Invalid Character data: allSkillLvlup is missing");
                }
                operator.allSkillLvlup = newAllSkillLvlup;
            }

            for (const phase of operator.phases) {
                if (isNaN(phase.maxLevel)) {
                    throw new Error("Invalid Character data: maxLevel is missing");
                }
            }
        }
    }

    validateData(charData);
    validateData(cn_charData);

    const validatePatchData = (data: CharacterPatch) => {
        if (!data) {
            throw new Error("Invalid CharacterPatch data");
        }

        if (!data.patchChars) {
            throw new Error("Invalid CharacterPatch data: patchChars is missing");
        }

        // character patch data schema shouldn't change if the character data schema doesn't change
    }

    validatePatchData(patchData);
    validatePatchData(cn_patchData);

    // get English name from the appellation field
    for (const key in cn_charData) {
        let character = cn_charData[key];
        character.name = character.appellation;
    }

    const combinedData = Object.assign(cn_charData, charData);

    // get Amiya's other forms
    // this is a loop in case they ever add more characters with multiple forms, probably not needed
    for (const [key, { tmplIds }] of Object.entries(cn_patchData.infos)) {
        const formIds = tmplIds.filter(id => id !== key);

        for (const patchKey of formIds) {
            let profession = cn_patchData.patchChars[patchKey].profession;
            if (profession === "WARRIOR") {
                profession = "Guard";
            } else if (profession === "MEDIC") {
                profession = "Medic"
            }
            const newChar = { 
                ...JSON.parse(JSON.stringify(combinedData[key])),
                ...cn_patchData.patchChars[patchKey],
                name: `${combinedData[key].name} - ${profession}`,
            };

            combinedData[patchKey] = newChar;
        }
    }

    // this should combine the new Chinese data with the existing English data allowing to see characters only available in China   
    const chardata: RawOperatorData[] = Object.entries({ ...combinedData })
        .map(([id, char]) => {
            return {
                id,
                ...char,
                cnOnly: !charData[id] && !patchData.patchChars[id],
                name: char.name[0] == "'" ? char.name.slice(1, char.name.length - 1) : char.name,
            }
        })
        .filter(char => !char.isNotObtainable && char.id.match(/char_[0-9]+_[a-zA-Z0-9]+/));

    return chardata;
};

export default getChardata;
