import { Team, Match } from '../types';
import { FORMATIONS, getPenalizedRating, getCompetitionWeeks } from '../constants';

export const getTeamStrength = (team: Team): number => {
    if (!team.roster || team.roster.length === 0) return team.strength;
    const onFieldPlayers = team.roster.filter(p => !p.offField);
    if (onFieldPlayers.length === 0) return team.strength;
    
    const formation = FORMATIONS[team.formation || '4-3-3'];
    return onFieldPlayers.reduce((sum, p, index) => {
        const slotPos = formation[index]?.position || 'MID';
        return sum + getPenalizedRating(p.rating, p.position, slotPos);
    }, 0) / onFieldPlayers.length;
};

export const calculateMatchResult = (match: Match, homeStr: number, awayStr: number): Match => {
    let hStr = homeStr;
    let aStr = awayStr;
    
    if (match.stage !== 'Final') {
        hStr *= 1.03; 
    }
    
    const strRatio = hStr / aStr;
    let homeXG = 1.45 * Math.pow(strRatio, 4.5);
    let awayXG = 1.15 * Math.pow(1 / strRatio, 4.5);

    if (match.stage === 'Final') {
        homeXG *= 0.8;
        awayXG *= 0.8;
    }

    homeXG = Math.max(0.05, homeXG);
    awayXG = Math.max(0.05, awayXG);

    const getPoissonRandom = (lambda: number) => {
        if (lambda > 30) return Math.round(lambda); 
        let L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
            k++;
            p *= Math.random();
        } while (p > L && k < 40); 
        return k - 1;
    };

    const homeGoals = getPoissonRandom(homeXG);
    const awayGoals = getPoissonRandom(awayXG);
    
    return { ...match, homeScore: homeGoals, awayScore: awayGoals, played: true };
};

export const getPenaltyResult = (): { home: number, away: number } => { 
    const possibleScores = [[5, 4], [5, 3], [4, 3], [4, 2], [3, 1], [3, 2], [6, 5]]; 
    const score = possibleScores[Math.floor(Math.random() * possibleScores.length)]; 
    const homeWins = Math.random() > 0.5; 
    return homeWins ? { home: score[0], away: score[1] } : { home: score[1], away: score[0] }; 
};

export const applyMatchResultsToTeams = (currentTeams: Team[], completedMatches: Match[]): Team[] => {
    const nextTeams = [...currentTeams];

    const updateStatObj = (stats: any, hS: number, aS: number) => {
        stats.played += 1; 
        stats.gf += hS; 
        stats.ga += aS; 
        stats.gd = stats.gf - stats.ga;
        if (hS > aS) { 
            stats.won++; 
            stats.points += 3; 
        } else if (hS < aS) { 
            stats.lost++; 
        } else { 
            stats.drawn++; 
            stats.points += 1; 
        }
    };

    completedMatches.forEach(match => {
        if (!match.played || match.homeScore === null || match.awayScore === null) return;
        
        const homeIdx = nextTeams.findIndex(t => t.id === match.homeTeamId);
        const awayIdx = nextTeams.findIndex(t => t.id === match.awayTeamId);
        
        if (homeIdx === -1 || awayIdx === -1) return;
        
        const home = { ...nextTeams[homeIdx] };
        const away = { ...nextTeams[awayIdx] };
        
        if (match.competition === 'La Liga') {
            home.stats = { ...home.stats, form: [...home.stats.form] }; 
            away.stats = { ...away.stats, form: [...away.stats.form] };
            
            updateStatObj(home.stats, match.homeScore, match.awayScore);
            
            const hRes = match.homeScore > match.awayScore ? 'W' : match.homeScore === match.awayScore ? 'D' : 'L';
            const aRes = match.homeScore < match.awayScore ? 'W' : match.homeScore === match.awayScore ? 'D' : 'L';
            
            home.stats.form = [hRes as any, ...home.stats.form].slice(0, 5); 
            away.stats.form = [aRes as any, ...away.stats.form].slice(0, 5);
            
            updateStatObj(away.stats, match.awayScore, match.homeScore);
        } else if (match.competition === 'Champions League' && match.stage === 'League Phase') {
            if (home.uclStats) { 
                home.uclStats = { ...home.uclStats }; 
                updateStatObj(home.uclStats, match.homeScore, match.awayScore); 
            }
            if (away.uclStats) { 
                away.uclStats = { ...away.uclStats }; 
                updateStatObj(away.uclStats, match.awayScore, match.homeScore); 
            }
        }
        
        nextTeams[homeIdx] = home; 
        nextTeams[awayIdx] = away;
    });

    return nextTeams;
};

export const resolveUCLKnockouts = (currentSchedule: Match[], teamsState: Team[], currentSeasonYear: string): Match[] => {
    let updatedSchedule = [...currentSchedule];
    
    const isPhaseComplete = (stage: string) => { 
        const matches = updatedSchedule.filter(m => m.stage === stage); 
        return matches.length > 0 && matches.every(m => m.played); 
    };
    
    const hasNextStageGenerated = (stage: string) => updatedSchedule.some(m => m.stage === stage);

    if (isPhaseComplete('League Phase') && !hasNextStageGenerated('Playoffs')) {
        const uclTeams = teamsState
            .filter(t => t.isUCL && t.id !== 'TBD')
            .sort((a, b) => { 
                if (b.uclStats!.points !== a.uclStats!.points) return b.uclStats!.points - a.uclStats!.points; 
                if (b.uclStats!.gd !== a.uclStats!.gd) return b.uclStats!.gd - a.uclStats!.gd; 
                return b.uclStats!.gf - a.uclStats!.gf; 
            });
            
        const topSeeds = uclTeams.slice(0, 8);
        const { uclBase, days } = getCompetitionWeeks(currentSeasonYear);
        const KNOCKOUT_WEEKS = uclBase.slice(8, 17);
        
        const getUclDate = (baseWeekIndex: number) => {
            const bw = KNOCKOUT_WEEKS[baseWeekIndex];
            const offset = [-1, 0][Math.floor(Math.random() * 2)];
            const actualWeek = Math.max(1, Math.min(days.length, bw + offset));
            return { 
                week: actualWeek, 
                date: new Date(`${days.find(d => d.week === actualWeek)?.date || days[0].date}T12:00:00Z`) 
            };
        };

        const wPO1 = getUclDate(0), wPO2 = getUclDate(1);
        const wR16_1 = getUclDate(2), wR16_2 = getUclDate(3);
        const wQF1 = getUclDate(4), wQF2 = getUclDate(5);
        const wSF1 = getUclDate(6), wSF2 = getUclDate(7);
        const wF = getUclDate(8);

        const playoffsMatches: Match[] = [];
        const r16Matches: Match[] = [];
        const qfMatches: Match[] = [];
        const sfMatches: Match[] = [];

        for (let i = 0; i < 8; i++) {
            const seedHigh = uclTeams[8 + i];
            const seedLow = uclTeams[23 - i];
            
            if (seedHigh && seedLow) {
                playoffsMatches.push({ 
                    id: `UCL-PO-L1-${i}`, week: wPO1.week, homeTeamId: seedLow.id, awayTeamId: seedHigh.id, date: wPO1.date, 
                    homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Playoffs', isLeg2: false 
                });
                playoffsMatches.push({ 
                    id: `UCL-PO-L2-${i}`, week: wPO2.week, homeTeamId: seedHigh.id, awayTeamId: seedLow.id, date: wPO2.date, 
                    homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Playoffs', isLeg2: true 
                });
            }
        }
        
        [...topSeeds].sort(() => Math.random() - 0.5).forEach((seed, idx) => {
            const placeholderText = `Winner: ${uclTeams[8 + idx]?.shortName} / ${uclTeams[23 - idx]?.shortName}`;
            r16Matches.push({ 
                id: `UCL-R16-L1-${idx}`, week: wR16_1.week, homeTeamId: 'TBD', awayTeamId: seed.id, date: wR16_1.date, 
                homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Round of 16', isLeg2: false, placeholder: placeholderText 
            });
            r16Matches.push({ 
                id: `UCL-R16-L2-${idx}`, week: wR16_2.week, homeTeamId: seed.id, awayTeamId: 'TBD', date: wR16_2.date, 
                homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Round of 16', isLeg2: true, placeholder: placeholderText 
            });
        });
        
        for (let i = 0; i < 4; i++) { 
            qfMatches.push({ 
                id: `UCL-QF-L1-${i}`, week: wQF1.week, homeTeamId: 'TBD', awayTeamId: 'TBD', date: wQF1.date, 
                homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Quarter-finals', isLeg2: false 
            }); 
            qfMatches.push({ 
                id: `UCL-QF-L2-${i}`, week: wQF2.week, homeTeamId: 'TBD', awayTeamId: 'TBD', date: wQF2.date, 
                homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Quarter-finals', isLeg2: true 
            }); 
        }
        
        for (let i = 0; i < 2; i++) { 
            sfMatches.push({ 
                id: `UCL-SF-L1-${i}`, week: wSF1.week, homeTeamId: 'TBD', awayTeamId: 'TBD', date: wSF1.date, 
                homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Semi-finals', isLeg2: false 
            }); 
            sfMatches.push({ 
                id: `UCL-SF-L2-${i}`, week: wSF2.week, homeTeamId: 'TBD', awayTeamId: 'TBD', date: wSF2.date, 
                homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Semi-finals', isLeg2: true 
            }); 
        }

        updatedSchedule.push(
            ...playoffsMatches, 
            ...r16Matches, 
            ...qfMatches, 
            ...sfMatches, 
            { id: `UCL-FINAL`, week: wF.week, homeTeamId: 'TBD', awayTeamId: 'TBD', date: wF.date, homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Final', isLeg2: false }
        );
    }

    const processStageWinners = (currentStage: string) => {
        if (!isPhaseComplete(currentStage)) return null;
        
        const stageMatches = updatedSchedule.filter(m => m.stage === currentStage);
        const winners: string[] = [];
        const pairs: Record<string, Match[]> = {};
        
        stageMatches.forEach(m => { 
            const idx = m.id.split('-').pop(); 
            if (idx) { 
                pairs[idx] = pairs[idx] || []; 
                pairs[idx].push(m); 
            } 
        });

        Object.keys(pairs).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
            if (currentStage === 'Final') {
                const m = pairs[key][0];
                if (m.homeScore === m.awayScore && m.homePenalties === undefined) { 
                    const pens = getPenaltyResult(); 
                    const idx = updatedSchedule.findIndex(match => match.id === m.id); 
                    updatedSchedule[idx] = { ...updatedSchedule[idx], homePenalties: pens.home, awayPenalties: pens.away }; 
                }
                return;
            }
            
            const l1 = pairs[key].find(m => !m.isLeg2);
            const l2 = pairs[key].find(m => m.isLeg2);
            
            if (l1 && l2 && l1.played && l2.played) {
                const aggHome = l2.homeScore! + l1.awayScore!;
                const aggAway = l2.awayScore! + l1.homeScore!;
                let winnerId = aggHome > aggAway ? l2.homeTeamId : l2.awayTeamId;
                
                if (aggHome === aggAway) {
                    let hp = l2.homePenalties;
                    let ap = l2.awayPenalties;
                    
                    if (hp === undefined || ap === undefined) { 
                        const pens = getPenaltyResult(); 
                        hp = pens.home; 
                        ap = pens.away; 
                        const idx = updatedSchedule.findIndex(match => match.id === l2.id); 
                        updatedSchedule[idx] = { ...updatedSchedule[idx], homePenalties: hp, awayPenalties: ap }; 
                    }
                    winnerId = hp! > ap! ? l2.homeTeamId : l2.awayTeamId;
                }
                winners.push(winnerId);
            }
        });
        return winners;
    };

    const mapWinners = (stageComp: string, targetStage: string, pairFactor: number) => {
        if (isPhaseComplete(stageComp) && updatedSchedule.some(m => m.stage === targetStage && (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD'))) {
            const winners = processStageWinners(stageComp);
            if (winners) {
                updatedSchedule = updatedSchedule.map(m => {
                    if (m.stage === targetStage) {
                        const idx = parseInt(m.id.split('-').pop() || '');
                        if (pairFactor === 0) { 
                            const winnerId = winners[idx]; 
                            if (winnerId) {
                                return !m.isLeg2 ? { ...m, homeTeamId: winnerId, placeholder: undefined } : { ...m, awayTeamId: winnerId, placeholder: undefined }; 
                            }
                        } else { 
                            const t1 = winners[idx * 2];
                            const t2 = winners[idx * 2 + 1]; 
                            if (t1 && t2) {
                                return { ...m, homeTeamId: m.isLeg2 ? t2 : t1, awayTeamId: m.isLeg2 ? t1 : t2 }; 
                            }
                        }
                    }
                    return m;
                });
            }
        }
    };

    mapWinners('Playoffs', 'Round of 16', 0); 
    mapWinners('Round of 16', 'Quarter-finals', 1);
    mapWinners('Quarter-finals', 'Semi-finals', 1);

    if (isPhaseComplete('Semi-finals') && updatedSchedule.some(m => m.stage === 'Final' && m.homeTeamId === 'TBD')) {
        const winners = processStageWinners('Semi-finals');
        if (winners && winners.length === 2) {
            updatedSchedule = updatedSchedule.map(m => m.stage === 'Final' ? { ...m, homeTeamId: winners[0], awayTeamId: winners[1] } : m);
        }
    }
    
    if (isPhaseComplete('Final')) {
        processStageWinners('Final');
    }
    return updatedSchedule;
};