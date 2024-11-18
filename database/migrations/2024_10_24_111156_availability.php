<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('availability', function (Blueprint $table) {
            $table->id(); // Primary Key
            $table->unsignedBigInteger('performer_id'); // Foreign Key for performer
            $table->date('date'); // Date for which the performer is unavailable
            $table->time('start_time')->nullable(); // Optional start time of unavailability
            $table->time('end_time')->nullable(); // Optional end time of unavailability
            $table->string('availability_type')->default('Full Day'); // Full Day or Partial Day
            $table->timestamps(); 
            $table->foreign('performer_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['performer_id', 'date', 'start_time', 'end_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('availability');
    }
};
