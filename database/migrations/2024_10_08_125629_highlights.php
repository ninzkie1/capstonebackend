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
        Schema::create('highlights', function (Blueprint $table) {
            $table->id(); // Primary Key
            $table->unsignedBigInteger('portfolio_id'); // Foreign Key for portfolio
            $table->string('highlight_video'); // Field for storing video URLs or file paths
            $table->timestamps(); // created_at and updated_at timestamps

            // Foreign Key Constraints
            $table->foreign('portfolio_id')->references('id')->on('performer_portfolios')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('highlights');
    }
};
