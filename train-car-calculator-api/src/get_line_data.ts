import LRT1 from '../data/LRT1.json';
import LRT2 from '../data/LRT2.json';
import MRT3 from '../data/MRT3.json';

const trainDataMap: Record<string, any> = {
    "LRT1": LRT1,
    "LRT2": LRT2,
    "MRT3": MRT3
};

function getLineData(line: string) {
    return trainDataMap[line][0]
}

export { getLineData }