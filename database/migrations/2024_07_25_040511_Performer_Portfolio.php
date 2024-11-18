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
        Schema::create('performer_portfolios', function (Blueprint $table) {
            $table->id(); // Primary Key
            $table->unsignedBigInteger('performer_id'); // Foren Key performer
            $table->string('event_name')->nullable();
            $table->string('theme_name')->nullable();
            $table->string('talent_name')->nullable();
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->string('image_profile')->nullable();
            $table->integer('rate')->nullable();//price of booking
            $table->decimal('average_rating', 3, 2)->nullable();
            $table->string('phone')->nullable();
            $table->integer('experience')->nullable(); // Experience in years
            $table->string('genres')->nullable(); // Genre or type of talent
            $table->string('performer_type')->nullable(); // Awards or recognitions
            $table->string('availability_status')->nullable(); // Current availability status (Available, Busy, etc.)

            $table->timestamps(); // created_at and updated_at timestamps

            // Foreign Key Constraints
            $table->foreign('performer_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performer_portfolios');
    }
};
