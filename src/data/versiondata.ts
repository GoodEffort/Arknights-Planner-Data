const yostarLink = "https://api.github.com/repos/Kengxxiao/ArknightsGameData_YoStar/commits/main";
const cnLink = "https://api.github.com/repos/Kengxxiao/ArknightsGameData/commits/master";

const headers = {
    "Accept": "application/vnd.github.VERSION.sha"
}

const getCommitHash = async (link: string) => {
    const response = await fetch(link, { headers });
    return await response.text();
}

const getCommitHashes = async () => {
    const [yostar, cn] = await Promise.all([getCommitHash(yostarLink), getCommitHash(cnLink)]);
    return { yostar, cn };
}

export default getCommitHashes;