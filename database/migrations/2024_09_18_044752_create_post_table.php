<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('client_name');
            $table->string('event_name')->nullable();;
            $table->string('theme_name')->nullable();;
            $table->date('date')->nullable();;  // Added date field for event date
            $table->time('start_time')->nullable();;  // Start time of the event
            $table->time('end_time')->nullable();;  // End time of the event
            $table->integer('performer_needed')->nullable();
            $table->integer('audience')->nullable();  // Number of audience expected
            $table->string('municipality_name')->nullable();;
            $table->string('barangay_name')->nullable();;
            $table->text('description')->nullable();;
            $table->json('talents')->nullable();;  // JSON field for talents
            $table->timestamps();  // Created at and updated at timestamps

            // Foreign key relationship to users table
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('posts');
    }
};
