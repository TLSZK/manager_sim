import { Team } from '../types';

interface RecapInput {
    team: Team;
    position: number;
    uclResult?: string;
    wasInUCL: boolean;
}

interface ExpectedRange {
    min: number;
    max: number;
    tier: 'elite' | 'top' | 'strong' | 'mid' | 'lower-mid' | 'weak';
}

const expectedPositionFromStrength = (strength: number): ExpectedRange => {
    if (strength >= 88) return { min: 1, max: 2, tier: 'elite' };
    if (strength >= 82) return { min: 1, max: 4, tier: 'top' };
    if (strength >= 76) return { min: 4, max: 8, tier: 'strong' };
    if (strength >= 70) return { min: 7, max: 12, tier: 'mid' };
    if (strength >= 64) return { min: 11, max: 16, tier: 'lower-mid' };
    return { min: 15, max: 20, tier: 'weak' };
};

// Higher rank = deeper run.
const UCL_STAGE_RANK: Record<string, number> = {
    'Winner': 7,
    'Runner-up': 6,
    'Semi-finals': 5,
    'Quarter-finals': 4,
    'Round of 16': 3,
    'Playoffs': 2,
    'League Phase': 1,
    '': 0,
};

const expectedUclStageFromStrength = (strength: number): number => {
    if (strength >= 88) return 5;
    if (strength >= 82) return 4;
    if (strength >= 76) return 3;
    if (strength >= 70) return 2;
    return 1;
};

const ordinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const generateBoardMessage = ({ team, position, uclResult, wasInUCL }: RecapInput): string => {
    const { min, max, tier } = expectedPositionFromStrength(team.strength);
    const teamName = team.name;
    const isOver = position < min;
    const isUnder = position > max;
    const farOver = position <= min - 2;
    const farUnder = position >= max + 3;

    let liga: string;
    if (position === 1) {
        if (tier === 'elite' || tier === 'top') {
            liga = `Champions of La Liga! ${teamName} delivered exactly what this club expects — silverware and a title to defend next year.`;
        } else if (tier === 'strong') {
            liga = `Champions of La Liga! A magnificent title win for ${teamName} — beyond what anyone dared to dream of at the start of the season.`;
        } else {
            liga = `An astonishing title win! Nobody outside ${teamName} saw this coming, and the city will remember this miracle for decades.`;
        }
    } else if (farOver) {
        liga = `Finishing ${ordinal(position)} is a stunning overachievement for a squad of our level. The board is overjoyed and the fans are singing your name.`;
    } else if (isOver) {
        liga = `${ordinal(position)} place is above what we projected for ${teamName}. A genuinely impressive campaign — well done.`;
    } else if (farUnder) {
        if (tier === 'elite' || tier === 'top') {
            liga = `${ordinal(position)} is unacceptable. A squad of this calibre cannot finish this far down the table — patience is wearing very thin in the boardroom.`;
        } else if (tier === 'weak' || tier === 'lower-mid') {
            liga = `${ordinal(position)} is a serious regression and the relegation conversation is no longer hypothetical. Things must change.`;
        } else {
            liga = `${ordinal(position)} represents a major underperformance. Difficult questions are being asked at every level of the club.`;
        }
    } else if (isUnder) {
        liga = `${ordinal(position)} place leaves a sour taste. We expected more from this group, and the supporters know it.`;
    } else {
        if (tier === 'elite' || tier === 'top') {
            liga = `${ordinal(position)} place — a respectable finish, but a club of this stature is measured in trophies, not table positions.`;
        } else {
            liga = `${ordinal(position)} place — broadly in line with expectations for this squad. A steady, if unspectacular, league campaign.`;
        }
    }

    if (!wasInUCL) return liga;

    const actualRank = UCL_STAGE_RANK[uclResult ?? ''] ?? 0;
    const expectedRank = expectedUclStageFromStrength(team.strength);

    let ucl: string;
    if (uclResult === 'Winner') {
        ucl = ` And to crown it all — Champions of Europe! The trophy returns home and your name is etched into ${teamName}'s history forever.`;
    } else if (uclResult === 'Runner-up') {
        if (tier === 'elite' || tier === 'top') {
            ucl = ` Reaching the Champions League final is fitting for a club of our stature, though the defeat will sting for a long time.`;
        } else {
            ucl = ` A Champions League final?! Nobody expected this fairytale run — heartbreak in the showpiece, but a campaign to be enormously proud of.`;
        }
    } else if (actualRank >= expectedRank + 2) {
        ucl = ` In Europe, reaching the ${uclResult} was well above expectations — a magical continental run that will live long in the memory.`;
    } else if (actualRank === expectedRank + 1) {
        ucl = ` The Champions League run to the ${uclResult} was a pleasant surprise and a step in the right direction for ${teamName} in Europe.`;
    } else if (actualRank === expectedRank) {
        ucl = ` The Champions League ${uclResult} exit was a fair reflection of where this squad currently stands in Europe.`;
    } else if (actualRank === 0) {
        ucl = ` The European campaign was a major disappointment — failing to register a meaningful run in the Champions League is unacceptable.`;
    } else {
        ucl = ` The Champions League ended at the ${uclResult}, below where this squad should be operating on the continent.`;
    }

    return liga + ucl;
};
