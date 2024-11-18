<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUnavailableDatesTable extends Migration
{
    public function up()
    {
        Schema::create('unavailable_dates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('performer_id');
            $table->date('unavailable_date')->nullable(); // Allow it to be nullable
            $table->timestamps();
            
            // Adding foreign key constraint if performer_id references performers table
            $table->foreign('performer_id')->references('id')->on('performer_portfolios')->onDelete('cascade');
        });
    }
    
    public function down()
    {
        Schema::dropIfExists('unavailable_dates');
    }
}
