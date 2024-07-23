import getChardata from "./data/chardata";
import getSkilldata from "./data/skills";
import getModuledata from "./data/moduledata";
import { mapItem, mapOperator } from "./mapper";
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import { Item, Operator } from "./data/types/outputdata";
import getBuildingdata from "./data/buildingdata";
import getItemdata from "./data/itemdata";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

async function buildJSON() {
    const charData = await getChardata();
    const skillData = await getSkilldata();
    const moduleData = await getModuledata();

    const { items, expItems } = await getItemdata();
    const recipeData = await getBuildingdata();

    const operators = charData.map((op) => mapOperator(op, skillData, moduleData)).sort((a, b) => a.id.localeCompare(b.id));
    const opDict: { [key: string]: Operator } = {};

    for (const op of operators) {
        opDict[op.id] = op;
    }

    type OperatorNoId = Omit<Operator, "id">;

    const opDictCopy = Object.entries(opDict).reduce((acc, [key, value]) => {
        const { id, ...rest } = value;
        acc[key] = rest as OperatorNoId;
        return acc;
    }, {} as { [key: string]: OperatorNoId });

    const mappedItemsDict: { [key: string]: Item } = {};

    for (const key in items) {
        const item = items[key];
        const mappedItem = mapItem(item, recipeData);
        mappedItemsDict[key] = mappedItem;
    }

    return { operators: opDictCopy, items: mappedItemsDict, expItems };
}

function writeJson(data: any) {
    const filepath = __dirname + "/../jsondata/";

    fs.writeFileSync(filepath + "arknights-data-pretty.json", JSON.stringify(data, null, 2));
    fs.writeFileSync(filepath + "arknights-data.json", JSON.stringify(data));
}

async function toReadable(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader();
    const rs = new Readable();
    rs._read = async () => {
        const result = await reader.read();
        if (result.done) {
            rs.push(null);
        }
        else {
            rs.push(Buffer.from(result.value));
        }
    }
    return rs;
}

async function getOperatorPicture(operatorIds: string[]) {
    // one of these should work... hopefully
    const sources = [
        "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/charavatars/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/charportraits/"
    ];

    const filename = `${__dirname}/../images/operators/`;

    await getImages(sources, filename, operatorIds);
}

async function getItemPicture(itemIds: string[]) {
    // one of these should work... hopefully
    const sources = [
        "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/items/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/item/"
    ];

    const filename = `${__dirname}/../images/items/`;

    await getImages(sources, filename, itemIds);
}

async function getImages(sources: string[], filepathstart: string, ids: string[]) {
    for (const id of ids) {
        const filename = `${filepathstart}/${id}.png`;
        if (fs.existsSync(filename) === false) {
            let counter = 0;
            for (const source of sources) {
                try {
                    const url = `${source}${id}${counter === 2 ? "_2" : ""}.png`;

                    const response = await fetch(url);
                    if (response.ok && response.body) {
                        const readable = await toReadable(response.body);
                        readable.pipe(fs.createWriteStream(filename));
                        break;
                    }
                }
                catch (e) {

                    console.error(e);
                }
                counter++;
            }

            if (counter === 3) {
                console.error(`Could not find image for ${id}`);
            }
        }
        else {
            console.log(`File ${id}.png already exists`);
        }
    }
}

async function main() {
    const data = await buildJSON();
    writeJson(data);
    await getOperatorPicture(Object.keys(data.operators));

    const itemIcons = Object.values(data.items).map(i => i.iconId);

    await getItemPicture(itemIcons);
}


await main();