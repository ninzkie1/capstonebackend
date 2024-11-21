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
            $table->unsignedBigInteger('user_id')->nullable(); // Nullable until the performer is approved
            $table->string('name');
            $table->string('lastname');
            $table->string('email')->unique(); // Email of the applicant
            $table->string('talent_name'); // Performer’s talent name
            $table->string('location'); // Performer’s location
            $table->text('description')->nullable(); // Optional description
            $table->string('id_picture')->nullable(); // Path to ID picture
            $table->string('holding_id_picture')->nullable(); // Path to holding ID picture
            $table->string('status')->default('PENDING'); // 'PENDING', 'APPROVED', or 'REJECTED'
            $table->timestamps(); // created_at and updated_at

            // Foreign key constraint for user_id
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
