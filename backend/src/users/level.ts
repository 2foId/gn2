export const XP_BASE = 100;
export const XP_EXP = 1.5;
export const CURRENCY_BASE = 50;

export function xpUntukNaikKeLevel(level: number) {
    return Math.round(XP_BASE * Math.pow(level, XP_EXP));
}

export function hitungLevel(xpTotal: number) {
    let level = 1;
    let xpTersisa = Math.max(0, xpTotal);
    let xpDibutuhkan = xpUntukNaikKeLevel(level);

    while (xpTersisa >= xpDibutuhkan) {
        xpTersisa -= xpDibutuhkan;
        level += 1;
        xpDibutuhkan = xpUntukNaikKeLevel(level);
    }

    return {
        level,
        xpTotal: Math.max(0, xpTotal),
        xpSaatIni: xpTersisa,
        xpDibutuhkan,
        persen: Math.min(100, Math.floor((xpTersisa / xpDibutuhkan) * 100)),
    };
}

export function currencyUntukLevelBaru(level: number) {
    return CURRENCY_BASE * level * level;
}

export function totalCurrencyUntukXp(xpTotal: number) {
    const { level } = hitungLevel(xpTotal);
    let currency = 0;
    for (let reachedLevel = 2; reachedLevel <= level; reachedLevel += 1) {
        currency += currencyUntukLevelBaru(reachedLevel);
    }
    return currency;
}