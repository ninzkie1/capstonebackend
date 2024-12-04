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
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id'); // Reference to the client's post
            $table->unsignedBigInteger('performer_id'); // Reference to the performer's ID
            $table->string('message')->default('DISABLED');
            $table->string('status')->default('PENDING'); // Status of the application (PENDING, ACCEPTED, REJECTED)
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
            $table->foreign('performer_id')->references('id')->on('performer_portfolios')->onDelete('cascade'); // Assuming performers are stored in users table
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
