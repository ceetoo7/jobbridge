// Average fair wage per skill per district (NPR)
const FAIR_WAGE_TABLE = {
    Kathmandu: {
        Plumber: 1200,
        Electrician: 1100,
        Carpenter: 1000,
        Painter: 900,
        Mason: 950,
        Driver: 1000,
        Mechanic: 1100,
        Tailor: 800,
        "Domestic Worker": 700,
        Cook: 750,
        Caregiver: 900,
        Babysitter: 700,
        Farmer: 800,
        "Livestock Helper": 750,
        "Shop Assistant": 700,
        Cleaner: 650,
        "Security Guard": 800,
        "Delivery Worker": 750,
        "Construction Laborer": 850,
    },
    Lalitpur: {
        Plumber: 1150,
        Electrician: 1050,
        Carpenter: 950,
        Painter: 850,
        Mason: 900,
        Driver: 950,
        Mechanic: 1050,
        Tailor: 750,
        "Domestic Worker": 650,
        Cook: 700,
        Caregiver: 850,
        Babysitter: 650,
        Farmer: 750,
        "Livestock Helper": 700,
        "Shop Assistant": 650,
        Cleaner: 600,
        "Security Guard": 750,
        "Delivery Worker": 700,
        "Construction Laborer": 800,
    },
    Bhaktapur: {
        Plumber: 1100,
        Electrician: 1000,
        Carpenter: 900,
        Painter: 800,
        Mason: 850,
        Driver: 900,
        Mechanic: 1000,
        Tailor: 700,
        "Domestic Worker": 600,
        Cook: 650,
        Caregiver: 800,
        Babysitter: 600,
        Farmer: 700,
        "Livestock Helper": 650,
        "Shop Assistant": 600,
        Cleaner: 550,
        "Security Guard": 700,
        "Delivery Worker": 650,
        "Construction Laborer": 750,
    },
};

// Returns the fair wage based on district (extract from multi-level location) and skill
export function getFairWage(location, skill) {
    if (!location || !skill) return null;
    const district = location.split(" - ")[0]; // get main district
    return FAIR_WAGE_TABLE[district]?.[skill] || null;
}

// Returns true if offered wage is exploitative (<80% of fair wage)
export function isExploitative(offered, fair) {
    if (!offered || !fair) return false;
    return offered < fair * 0.8;
}
