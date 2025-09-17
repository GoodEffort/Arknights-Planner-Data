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
    const filepath = __dirname + "/../production-files/arknights-data.json";
    if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath).toString());
        if (data.commitHashes.yostar === commitHashes.yostar && data.commitHashes.cn === commitHashes.cn) {
            return data;
        }
    }
    return undefined;
}

function createFolders() {

    const folders = ["operators", "items", "skills", "modules", "other"];

    const jsonDataPath = `${__dirname}/../jsondata/`;
    const prodDataPath = `${__dirname}/../production-files/`;
    const pngpath = `${__dirname}/../images/`;

    if (!fs.existsSync(jsonDataPath)) {
        fs.mkdirSync(jsonDataPath);
    }

    if (!fs.existsSync(prodDataPath)) {
        fs.mkdirSync(prodDataPath);
    }

    if (!fs.existsSync(`${prodDataPath}/images/`)) {
        fs.mkdirSync(`${prodDataPath}/images/`);
    }

    if (!fs.existsSync(pngpath)) {
        fs.mkdirSync(pngpath);
    }

    for (const folder of folders) {
        let subPNGPath = `${pngpath}/${folder}`;
        let subWebpPath = `${prodDataPath}/images/${folder}`;
        if (!fs.existsSync(subPNGPath)) {
            fs.mkdirSync(subPNGPath);
        }

        if (!fs.existsSync(subWebpPath)) {
            fs.mkdirSync(subWebpPath);
        }
    }
}

async function buildJSON(commitHashes: { yostar: string, cn: string }, skillData: { [key: string]: { id: string; iconId: string; name: string; } }): Promise<JSONData> {
    const charData = await getChardata();
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
    const filepath = __dirname + "/../";

    fs.writeFileSync(filepath + "jsondata/arknights-data-pretty.json", JSON.stringify(data, null, 2));
    fs.writeFileSync(filepath + "production-files/arknights-data.json", JSON.stringify(data));
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

async function getSkillImages(skillData: {
    [k: string]: string[];
}) {
    const filepath = `${__dirname}/../images/skills/`;

    for (const [id, icon] of Object.entries(skillData)) {
        const filename = `${filepath}${id}.png`;
        // console.log(icon);
        // console.log(filename);
        if (fs.existsSync(filename)) {
            console.log(`Skipping ${filename}`);
        }
        else {

            for (const source of icon) {
                console.log(`Downloading ${source}`);
                try {
                    const response = await fetch(source);
                    if (response.ok && response.body) {
                        console.log(`Writing ${filename}`);
                        const readable = await toReadable(response.body);
                        readable.pipe(fs.createWriteStream(filename));
                        break;
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    }
}

async function getOperatorPicture(operatorIds: string[]) {
    // one of these should work... hopefully
    const sources = [
        "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/charavatars/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets2/refs/heads/cn/assets/dyn/arts/charavatars/",
        "https://raw.githubusercontent.com/yuanyan3060/ArknightsGameResource/refs/heads/main/avatar/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/charportraits/"
    ];

    const filename = `${__dirname}/../images/operators/`;

    await getImages(sources, filename, operatorIds);
}

async function getItemPicture(itemIds: string[]) {
    // one of these should work... hopefully
    const sources = [
        "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/items/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/items/icons/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets2/refs/heads/cn/assets/dyn/arts/items/icons/"
    ];

    const filename = `${__dirname}/../images/items/`;

    await getImages(sources, filename, itemIds);
}

async function getModulePicture(moduleIds: string[]) {
    const sources = [
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/ui/uniequipimg/",
        "https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets2/refs/heads/cn/assets/dyn/arts/ui/uniequipimg/"
    ];

    const filename = `${__dirname}/../images/modules/`;

    await getImages(sources, filename, moduleIds);
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
            const url = `${source}${id}.png`;

            const response = await fetch(url);
            if (response.ok && response.body) {
                const readable = await toReadable(response.body);
                readable.pipe(fs.createWriteStream(filename));
                break;
            }
            else {
                try {
                    const url = `${source}${id.toLowerCase()}.png`;

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
            //console.log(`Skipping ${filename}`);
        }
        else {
            results.push(WriteImage(sources, id, filename));
        }
    }

    await Promise.all(results);
}

async function convertImagesToWebp(quality = 80) {
    await imagemin([`${__dirname}/../images/operators/*.png`], {
        destination: `${__dirname}/../production-files/images/operators/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });

    await imagemin([`${__dirname}/../images/items/*.png`], {
        destination: `${__dirname}/../production-files/images/items/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });

    await imagemin([`${__dirname}/../images/skills/*.png`], {
        destination: `${__dirname}/../production-files/images/skills/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });

    await imagemin([`${__dirname}/../images/modules/*.png`], {
        destination: `${__dirname}/../production-files/images/modules/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });

    await imagemin([`${__dirname}/../images/other/*.png`], {
        destination: `${__dirname}/../production-files/images/other/`,
        plugins: [
            imageminWebp({ quality })
        ]
    });
}

async function getJSONData(skillData: { [key: string]: { id: string; iconId: string; name: string; } }) {
    const commitHashes = await getCommitHashes();

    // check if data exists and is up to date
    let data = readJson(commitHashes);

    // if data does not exist or is out of date, rebuild it
    if (data === undefined) {
        console.log("Out of date, rebuilding data");
        data = await buildJSON(commitHashes, skillData);
        writeJson(data);
    }
    else {
        console.log("Data is up to date");
    }

    return data;
}

async function main() {
    createFolders();

    const skillData = await getSkilldata();

    const data = await getJSONData(skillData);
    const skillKeys = Object.keys(skillData);
    const operatorSkillKeys = Object.values(data.operators).map(o => o.skills).flat().map(s => s.id);
    const nonOperatorSkills = skillKeys.filter(s => !operatorSkillKeys.includes(s));

    for (const key of nonOperatorSkills) {
        delete skillData[key];
    }

    const skillIcons = Object.fromEntries(Object.entries(skillData).map(([key, value]) => [key, value.icon]));

    console.log("Downloading images");

    await getSkillImages(skillIcons);

    await getOperatorPicture(Object.keys(data.operators));

    const itemIcons = Object.values(data.items).map(i => i.iconId);

    await getItemPicture(itemIcons);
    const moduleIcons = Object.values(data.operators).map(o => o.modules.map(x => x.icon)).flat();
    await getModulePicture(moduleIcons);
    await getOtherPictures();

    console.log("Converting images to webp");

    await convertImagesToWebp();

    console.log("Copying files");

    fs.cp(`${__dirname}/../index.html`, `${__dirname}/../production-files/index.html`, (err) => {
        if (err) {
            console.error(err);
        }
    });

    fs.cp(`${__dirname}/../jsondata/arknights-data-pretty.json`, `${__dirname}/../production-files/arknights-data-pretty.json`, (err) => {
        if (err) {
            console.error(err);
        }
    });

    console.log("Done");
}

await main();
