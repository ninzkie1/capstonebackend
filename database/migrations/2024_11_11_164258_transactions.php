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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Foreign key for user
            $table->unsignedBigInteger('performer_id');
            $table->unsignedBigInteger('booking_id'); //foreign key sa booking
            $table->string('transaction_type'); // Deposit, Withdraw, Subscription, P2P
            $table->decimal('amount', 10, 2);
            $table->decimal('balance_before', 10, 2)->nullable();
            $table->decimal('balance_after', 10, 2)->nullable();
            $table->string('reference_number')->nullable();
            $table->string('receipt_path')->nullable();
            $table->string('status')->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('performer_id')->references('id')->on('performer_portfolios')->onDelete('cascade');
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('transactions');
    }
};
