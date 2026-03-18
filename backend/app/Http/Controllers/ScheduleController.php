<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ScheduleController extends Controller
{
    public function generateSchedule($teams, $seasonStart = '2026-08-15')
    {
        $schedule = [];
        $startDate = Carbon::parse($seasonStart);
        $currentDate = $startDate->copy();

        // Generate League (Weekends)
        $leagueRounds = $this->createRoundRobin($teams);
        foreach ($leagueRounds as $roundIndex => $matches) {
            // Move to next Saturday
            while (!$currentDate->isSaturday()) {
                $currentDate->addDay();
            }
            
            foreach ($matches as $match) {
                $schedule[] = [
                    'date' => $currentDate->toDateString(),
                    'type' => 'LIGA',
                    'homeTeamId' => $match['home'],
                    'awayTeamId' => $match['away']
                ];
            }
            $currentDate->addDays(7); // Next weekend
        }

        // Interleave UCL (Mid-week: Tuesdays/Wednesdays)
        $uclDates = [];
        $uclStart = $startDate->copy()->addWeeks(2); // UCL starts later
        
        // Filter teams that are marked for UCL
        $uclTeams = array_filter($teams, fn($t) => isset($t['isUCL']) && $t['isUCL']);
        
        if (!empty($uclTeams)) {
            $uclRounds = $this->createRoundRobin($uclTeams);
            
            foreach ($uclRounds as $roundIndex => $matches) {
                // Move to next Tuesday/Wednesday for UCL
                while (!$uclStart->isTuesday() && !$uclStart->isWednesday()) {
                    $uclStart->addDay();
                }
                
                $matchDate = $uclStart->toDateString();
                $uclDates[] = $matchDate;
                
                foreach ($matches as $match) {
                    $schedule[] = [
                        'date' => $matchDate,
                        'type' => 'UCL',
                        'homeTeamId' => $match['home'],
                        'awayTeamId' => $match['away']
                    ];
                }
                $uclStart->addWeeks(2); // UCL every 2 weeks
            }
        }

        // Sort the entire schedule chronologically
        usort($schedule, fn($a, $b) => strtotime($a['date']) - strtotime($b['date']));
        
        return $schedule;
    }
    
    private function createRoundRobin($teams)
    {
        // Extract IDs for mapping
        $teamIds = array_map(fn($t) => is_array($t) ? ($t['id'] ?? null) : $t->id, $teams);
        $teamIds = array_filter($teamIds);
        
        if (count($teamIds) % 2 !== 0) {
            array_push($teamIds, 'BYE');
        }

        $numTeams = count($teamIds);
        $rounds = [];
        $numRounds = $numTeams - 1;
        $halfSize = $numTeams / 2;

        $tempTeams = $teamIds;
        array_shift($tempTeams); // Keep the first team fixed

        // Generate First Half of Season
        for ($round = 0; $round < $numRounds; $round++) {
            $roundMatches = [];
            $teamIdx = $round % ($numTeams - 1);

            if ($tempTeams[$teamIdx] !== 'BYE' && $teamIds[0] !== 'BYE') {
                if ($round % 2 === 0) {
                    $roundMatches[] = ['home' => $teamIds[0], 'away' => $tempTeams[$teamIdx]];
                } else {
                    $roundMatches[] = ['home' => $tempTeams[$teamIdx], 'away' => $teamIds[0]];
                }
            }

            for ($i = 1; $i < $halfSize; $i++) {
                $firstTeam = ($round + $i) % ($numTeams - 1);
                $secondTeam = ($round + $numTeams - 1 - $i) % ($numTeams - 1);

                if ($tempTeams[$firstTeam] !== 'BYE' && $tempTeams[$secondTeam] !== 'BYE') {
                    if ($i % 2 === 0) {
                        $roundMatches[] = ['home' => $tempTeams[$firstTeam], 'away' => $tempTeams[$secondTeam]];
                    } else {
                        $roundMatches[] = ['home' => $tempTeams[$secondTeam], 'away' => $tempTeams[$firstTeam]];
                    }
                }
            }
            $rounds[] = $roundMatches;
        }

        // Generate Second Half of Season (Reverse Fixtures)
        $reverseRounds = [];
        foreach ($rounds as $round) {
            $reverseRound = [];
            foreach ($round as $match) {
                $reverseRound[] = ['home' => $match['away'], 'away' => $match['home']];
            }
            $reverseRounds[] = $reverseRound;
        }

        return array_merge($rounds, $reverseRounds);
    }
}