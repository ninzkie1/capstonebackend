<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('booking_performer', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('booking_id');
        $table->unsignedBigInteger('performer_id');
        $table->enum('status', ['Pending', 'Accepted', 'Declined'])->default('Pending');
        $table->timestamps();

        $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
        $table->foreign('performer_id')->references('id')->on('performer_portfolios')->onDelete('cascade');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_performer');
    }
};
