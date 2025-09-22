import convertObjectToArray from "../convert-object-to-array";

type RawRecipeData = {
    itemId: string;
    count: number;
    goldCost: number;
    costs: {
        id: string;
        count: number;
        type: string;
    }[];
};

type Building_Table = {
    workshopFormulas: {
        [key: string]: RawRecipeData
    };
    manufactFormulas: {
        [key: string]: RawRecipeData
    };
};

const jsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/excel/building_data.json";
const cn_jsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/cn/gamedata/excel/building_data.json";

const getBuildingdata = async () => {
    const [response, cn_response] = await Promise.all([
        fetch(jsonLink),
        fetch(cn_jsonLink)
    ]);

    const [data, cn_data]: Building_Table[] = await Promise.all([response.json(), cn_response.json()]);

    // in case the schema changes
    const validateData = (data: Building_Table) => {
        if (!data) {
            throw new Error("Invalid Workshop data");
        }

        if (!data.workshopFormulas) {
            throw new Error("Invalid Workshop data: workshopFormulas is missing");
        }

        if (!data.manufactFormulas) {
            throw new Error("Invalid Workshop data: manufactFormulas is missing");
        }

        for (const key in data.workshopFormulas) {
            const formula = data.workshopFormulas[key];

            if (!formula.itemId) {
                throw new Error("Invalid Workshop data: itemId is missing");
            }

            if (!Array.isArray(formula.costs)) {
                const newCosts = convertObjectToArray<typeof formula.costs[0]>(formula.costs as any);
                if (!Array.isArray(newCosts)) {
                    throw new Error("Invalid Workshop data: costs is missing");
                }
                formula.costs = newCosts;
            }

            if (isNaN(formula.count)) {
                throw new Error("Invalid Workshop data: count is missing");
            }

            if (isNaN(formula.goldCost)) {
                throw new Error("Invalid Workshop data: goldCost is missing");
            }
        }

        for (const key in data.manufactFormulas) {
            const formula = data.manufactFormulas[key];

            if (!formula.itemId) {
                throw new Error("Invalid Workshop data: itemId is missing");
            }

            if (!Array.isArray(formula.costs)) {
                const newCosts = convertObjectToArray<typeof formula.costs[0]>(formula.costs as any);
                if (!Array.isArray(newCosts)) {
                    throw new Error("Invalid Workshop data: costs is missing");
                }
                formula.costs = newCosts;
            }

            if (isNaN(formula.count)) {
                throw new Error("Invalid Workshop data: count is missing");
            }
        }
    }

    validateData(data);
    validateData(cn_data);

    const combinedData = Object.assign(cn_data, data);

    const { workshopFormulas, manufactFormulas } = combinedData;

    const Recipes: {
        [key: string]: {
            count: number;
            costs: {
                id: string;
                count: number;
                type: string;
            }[]
        }
    } = {};

    for (const key in workshopFormulas) {
        const { itemId, costs, goldCost, count } = workshopFormulas[key];
        if (goldCost > 0) {
            costs.push({ id: "4001", count: goldCost, type: "gold" });
        }
        Recipes[itemId] = { count, costs };
    }

    for (const key in manufactFormulas) {
        const { itemId, costs, count } = manufactFormulas[key];
        Recipes[itemId] = { count, costs };
    }

    // Red certificates
    // catalyst
    Recipes["32001"] = {
        count: 1,
        costs: [{
            id: "4006",
            count: 90,
            type: ""
        }]
    };

    // module data block
    Recipes["mod_unlock_token"] = {
        count: 1,
        costs: [{
            id: "4006",
            count: 120,
            type: ""
        }]
    };

    return Recipes;
};

export default getBuildingdata;