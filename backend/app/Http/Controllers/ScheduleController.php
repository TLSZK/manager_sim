<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ScheduleController extends Controller
{
    public function generateSchedule($teams)
    {
        $schedule = [];
        $startDate = Carbon::create(2026, 8, 15); // Example season start
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
        // Standard Round Robin implementation stub assuming it returns pairs
        // Needs to be fully implemented based on your app's requirements
        return []; 
    }
}