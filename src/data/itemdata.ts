import type { Item, Item_Table } from "./types/item";

const jsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/excel/item_table.json";
const cn_jsonLink = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/cn/gamedata/excel/item_table.json";

const getItemdata = async () => {
    const [response, cn_response] = await Promise.all([
        fetch(jsonLink),
        fetch(cn_jsonLink)
    ]);

    const [data, cn_data]: Item_Table[] = await Promise.all([response.json(), cn_response.json()]);

    const itemFilter = (i: Item) =>
        i.itemId === "4001" || // LMD
        i.itemId === "4006" || // purchase certificate
        (
            i.itemType === "MATERIAL" ||
            i.itemType === "CARD_EXP"
        ) &&
        i.classifyType === "MATERIAL" &&
        !i.name.match(/.+\sToken/);
    

    const validateData = (data: Item_Table) => {
        if (!data) {
            throw new Error("Invalid Item data");
        }

        if (!data.items) {
            throw new Error("Invalid Item data: items is missing");
        }

        if (!data.expItems) {
            throw new Error("Invalid Item data: expItems is missing");
        }

        for (const item of Object.values(data.items).filter(itemFilter)) {
            if (!item.itemId) {
                throw new Error("Invalid Item data: itemId is missing " + item.itemId + " " + item.name);
            }

            if (!item.name) {
                throw new Error("Invalid Item data: name is missing");
            }

            if (!item.description && item.description !== "") {
                throw new Error("Invalid Item data: description is missing " + item.itemId + " " + item.name);
            }

            if (!item.itemType) {
                throw new Error("Invalid Item data: itemType is missing");
            }

            if (!item.classifyType) {
                throw new Error("Invalid Item data: classifyType is missing");
            }

            if (!item.rarity) {
                throw new Error("Invalid Item data: rarity is missing");
            }

            if (!item.iconId) {
                throw new Error("Invalid Item data: iconId is missing");
            }

            if (!item.sortId) {
                throw new Error("Invalid Item data: sortId is missing");
            }
        }
    };

    validateData(data);
    validateData(cn_data);

    const combinedData = Object.assign(cn_data, data);

    const itemsArray = Object.values(combinedData.items).filter(itemFilter);

    const items: { [key: string]: Item } = {};
    for (const item of itemsArray) {
        items[item.itemId] = item;
    }

    return {
        expItems: combinedData.expItems,
        items
    };
};

export default getItemdata;
