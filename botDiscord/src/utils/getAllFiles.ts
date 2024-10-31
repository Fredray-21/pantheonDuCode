import fs from 'fs';
import path from 'path';

export function getAllFiles(dir: string, filter: (file: string) => boolean): string[] {
    let results: string[] = [];

    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(file, filter));
        } else {
            if (filter(file)) {
                results.push(file);
            }
        }
    });
    return results;
}
