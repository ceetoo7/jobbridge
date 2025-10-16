// server/utils/fairWage.js
const FAIR_WAGE_TABLE = {
    Kathmandu: {
        Painter: 800,
        Plumber: 900,
        'Construction Helper': 700,
        Driver: 1000,
        'Domestic Worker': 600
    },
    Lalitpur: {
        Painter: 750,
        Plumber: 850,
        'Construction Helper': 650,
        Driver: 950,
        'Domestic Worker': 550
    },
    Bhaktapur: {
        Painter: 700,
        Plumber: 800,
        'Construction Helper': 600,
        Driver: 900,
        'Domestic Worker': 500
    }
};

export function getFairWage(location, skill) {
    return FAIR_WAGE_TABLE[location]?.[skill] || null;
}

export function isExploitative(offered, fair) {
    return offered < fair * 0.8;
}