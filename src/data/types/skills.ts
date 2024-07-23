type SkillTable = {
    [key: string]: {
        skillId: keyof SkillTable;
        levels: [
            {
                name: string;
                // and more, but I don't want to type it all out
            }
        ]
    }
}

export type { SkillTable };