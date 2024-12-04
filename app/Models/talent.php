<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Talent extends Model
{
    use HasFactory;

    protected $table = 'talent'; 
    protected $fillable = ['talent_name', 'performer_id'];

    public function performerPortfolio()
    {
        return $this->belongsTo(PerformerPortfolio::class, 'performer_id');
    }
}
