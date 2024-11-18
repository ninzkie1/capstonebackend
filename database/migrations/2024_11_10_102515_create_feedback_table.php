<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id(); // Primary Key
            $table->unsignedBigInteger('performer_id'); // FK performer
            $table->unsignedBigInteger('user_id'); // FK user who rated the performer
            $table->decimal('rating', 3, 1); // The actual rating, e.g. 4.5
            $table->text('review')->nullable(); // Optional review text
            $table->timestamps(); // created_at and updated_at timestamps

            // Foreign Key Constraints
            $table->foreign('performer_id')->references('id')->on('performer_portfolios')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
