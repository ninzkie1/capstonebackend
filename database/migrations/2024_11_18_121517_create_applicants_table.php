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
        Schema::create('applicants', function (Blueprint $table) {
            $table->id(); // Primary key
            $table->unsignedBigInteger('performer_id'); // Reference to performer
            $table->unsignedBigInteger('client_id'); // Reference to client
            $table->unsignedBigInteger('talent_id'); // Reference to event
            $table->string('talent_name');
            $table->text('message')->nullable(); // Optional message from the performer to the client
            $table->string('status')->default('PENDING');
            $table->timestamps(); // created_at and updated_at

            // Setting up foreign key constraints
            $table->foreign('performer_id')->references('id')->on('performer_portfolios')->onDelete('cascade');
            $table->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('talent_id')->references('id')->on('talent')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicants');
    }
};
