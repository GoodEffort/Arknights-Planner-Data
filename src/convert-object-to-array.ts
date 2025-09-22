const convertObjectToArray = <T>(obj: { [key: string]: T }): T[] => {
    if (typeof obj !== "object" || obj === null) {
        throw new Error("Input is not a valid object");
    }

    if (Array.isArray(obj)) {
        return obj;
    }

    if (!allKeysAreNumbers(obj)) {
        throw new Error("Object keys are not all numbers");
    }

    const result: T[] = [];
    const keys = Object.keys(obj).map(k => Number(k)).sort((a, b) => a - b);

    for (const key of keys) {
        result.push(obj[key]);
    }

    return result;
}

const allKeysAreNumbers = (obj: any): boolean => {
    return typeof obj === "object" && obj !== null && Object.keys(obj).every(k => !isNaN(Number(k)));
};

export default convertObjectToArray;