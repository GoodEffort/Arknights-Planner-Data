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

const jsonLink = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/en_US/gamedata/excel/building_data.json";
const cn_jsonLink = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/building_data.json";

const getBuildingdata = async () => {
    const [response, cn_response] = await Promise.all([
        fetch(jsonLink),
        fetch(cn_jsonLink)
    ]);

    const [data, cn_data]: Building_Table[] = await Promise.all([response.json(), cn_response.json()]);

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
        costs.push({ id: "4001", count: goldCost, type: "gold" });
        Recipes[itemId] = { count, costs };
    }

    for (const key in manufactFormulas) {
        const { itemId, costs, count } = manufactFormulas[key];
        Recipes[itemId] = { count, costs };
    }

    // catalyst
    Recipes["32001"] = {
        count: 1,
        costs: [{
            id: "4006",
            count: 90,
            type: ""
        }]
    };

    return Recipes;
};

export default getBuildingdata;