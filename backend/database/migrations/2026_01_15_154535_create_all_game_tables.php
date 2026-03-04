<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 2. MANAGERS
        Schema::create('managers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Change foreignUuid to foreignId to match default Laravel user IDs
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        // 3. MANAGER HISTORIES
        Schema::create('manager_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('manager_id')->constrained('managers')->onDelete('cascade');

            $table->string('teamName');
            $table->string('teamId');
            $table->string('seasonYear');
            $table->integer('position');
            $table->integer('points');
            $table->boolean('wonTrophy');

            $table->timestamps();
        });

        // 4. TEAMS
        Schema::create('teams', function (Blueprint $table) {
            $table->string('id')->primary(); // 'bar', 'rma'
            $table->string('name');
            $table->string('shortName');
            $table->string('logoUrl');
            $table->string('primaryColor');
            $table->string('secondaryColor');
            $table->integer('strength');
            $table->integer('tier');
            $table->boolean('isUCL')->default(false);
            $table->json('stats')->nullable();
            $table->json('uclStats')->nullable();
            $table->timestamps();
        });

        // 5. PLAYERS
        Schema::create('players', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('team_id');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->string('name');
            $table->integer('number');
            $table->string('position');
            $table->integer('rating');
            $table->boolean('offField')->default(false);
            $table->timestamps();
        });

        // 6. SAVED GAMES
        Schema::create('saved_games', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('manager_id')->constrained('managers')->onDelete('cascade'); // Fixed to foreignUuid
            $table->integer('currentWeek');
            $table->string('userTeamId')->nullable();
            $table->longText('schedule');
            $table->longText('teams_snapshot');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('saved_games');
        Schema::dropIfExists('players');
        Schema::dropIfExists('teams');
        Schema::dropIfExists('manager_histories');
        Schema::dropIfExists('managers');
    }
};
