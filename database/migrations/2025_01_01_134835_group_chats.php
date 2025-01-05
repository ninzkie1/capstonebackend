<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('group_chats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->string('name')->nullable(); // Optional: Group chat name
            $table->timestamps();
            $table->foreign('booking_id')->references('id')->on('bookings');
        });
    }

    public function down()
    {
        Schema::dropIfExists('group_chats');
    }
};
