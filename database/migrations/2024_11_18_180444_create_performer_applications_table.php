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
        Schema::create('performer_applications', function (Blueprint $table) {
            $table->id(); // Primary key
            $table->unsignedBigInteger('user_id'); // Reference to user (applicant)
            $table->string('name');
            $table->string('lastname');
            $table->string('email')->unique();
            $table->string('password'); // Will be encrypted later
            $table->string('talent_name');
            $table->string('location');
            $table->text('description')->nullable(); // Optional description for the application
            $table->string('status')->default('PENDING'); // Status of the application ('PENDING', 'APPROVED', 'REJECTED')
            $table->timestamps(); // created_at and updated_at

            // Setting up foreign key constraint
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performer_applications');
    }
};
