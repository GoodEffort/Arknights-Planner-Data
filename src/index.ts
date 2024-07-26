import getChardata from "./data/chardata";
import getSkilldata from "./data/skills";
import getModuledata from "./data/moduledata";
import { mapItem, mapOperator } from "./mapper";
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import { Item, JSONData, Operator } from "./data/types/outputdata";
import getBuildingdata from "./data/buildingdata";
import getItemdata from "./data/itemdata";
import { Readable } from "stream";
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import getCommitHashes from "./data/versiondata";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

function readJson(commitHashes: { yostar: string, cn: string }): JSONData | undefined {
    const filepath = __dirname + "/../jsondata/arknights-data.json";
    if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath).toString());
        if (data.commitHashes.yostar === commitHashes.yostar && data.commitHashes.cn === commitHashes.cn) {
            return data;
        }
    }
    return undefined;
}

function createFolders() {
    const folders = ["operators", "items", "other"];
    const webp = "webp";

    const jsonDataPath = `${__dirname}/../jsondata/`;
    if (!fs.existsSync(jsonDataPath)) {
        fs.mkdirSync(jsonDataPath);
    }

    const basepath = `${__dirname}/../images/`;
    if (!fs.existsSync(basepath)) {
        fs.mkdirSync(basepath);
    }

    for (const folder of folders) {
        const filepath = `${__dirname}/../images/${folder}`;
        if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath);
        }
        if (!fs.existsSync(`${filepath}/${webp}`)) {
            fs.mkdirSync(`${filepath}/${webp}`);
        }
    }
}

async function buildJSON(commitHashes: { yostar: string, cn: string }): Promise<JSONData> {
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

    for (const key in expItems) {
        mappedItemsDict[key].gainExp = expItems[key].gainExp;
    }

    return { commitHashes, operators: opDictCopy, items: mappedItemsDict };
}

function writeJson(data: JSONData) {
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
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/items/icons/"
    ];

    const filename = `${__dirname}/../images/items/`;

    await getImages(sources, filename, itemIds);
}

async function getOtherPictures() {
    const filename = `${__dirname}/../images/other/`;

    const notfound = "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/ui/sandboxv2/%5Buc%5Dcommon/battle/sandbox_construct_character_menu/";
    
    await getImages([notfound], filename, ["missing"]);
}

async function WriteImage(sources: string[], id: string, filename: string) {
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

    if (counter === sources.length) {
        console.error(`Could not find image for ${id}`);
    }

    return counter < sources.length;
}

async function getImages(sources: string[], filepathstart: string, ids: string[]) {
    const results = [];

    for (const id of ids) {
        const filename = `${filepathstart}${id}.png`;
        if (fs.existsSync(filename)) {
            console.log(`Skipping ${filename}`);
        }
        else {
            results.push(WriteImage(sources, id, filename));
        }
    }

    await Promise.all(results);
}

async function convertImagesToWebp(quality = 80) {
    await imagemin([`${__dirname}/../images/operators/*.png`], {
        destination: `${__dirname}/../images/operators/webp/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });

    await imagemin([`${__dirname}/../images/items/*.png`], {
        destination: `${__dirname}/../images/items/webp/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });

    await imagemin([`${__dirname}/../images/other/*.png`], {
        destination: `${__dirname}/../images/other/webp/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });
}

async function getJSONData() {
    const commitHashes = await getCommitHashes();

    // check if data exists and is up to date
    let data = readJson(commitHashes);

    // if data does not exist or is out of date, rebuild it
    if (data === undefined) {
        console.log("Out of date, rebuilding data");
        data = await buildJSON(commitHashes);
        writeJson(data);
    }
    else {
        console.log("Data is up to date");
    }
    
    return data;
}

async function main() {
    createFolders();

    const data = await getJSONData();

    await getOperatorPicture(Object.keys(data.operators));

    const itemIcons = Object.values(data.items).map(i => i.iconId);

    await getItemPicture(itemIcons);
    await getOtherPictures();

    await convertImagesToWebp();
}


await main();