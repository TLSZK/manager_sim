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
    while ($uclStart->isBefore($currentDate)) {
        while (!$uclStart->isTuesday() && !$uclStart->isWednesday()) {
            $uclStart->addDay();
        }
        $uclDates[] = $uclStart->toDateString();
        $uclStart->addWeeks(2); // UCL every 2 weeks
    }
    
    // Inject UCL matches into $schedule where date matches $uclDates
    // ...

    usort($schedule, fn($a, $b) => strtotime($a['date']) - strtotime($b['date']));
    return $schedule;
}
}
