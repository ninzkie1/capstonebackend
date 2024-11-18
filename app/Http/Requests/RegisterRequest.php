<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
{
    return [
        'name' => 'required|string|max:255',
        'lastname' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => [
            'required',
            Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols(),
        ],
        'role' => 'required|string|in:client,performer,admin', 
    ];
}

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'name.required' => 'A name is required',
            'lastname.required' => 'A lastname is required',
            'email.required' => 'An email address is required',
            'email.email' => 'A valid email address is required',
            'email.unique' => 'This email address is already registered',
            'password.required' => 'A password is required',
            'password.min' => 'Please make the password long than 8 letters',
            'password.letters' => 'Password must contain at least one letter',
            'password.mixed_case' => 'Password must contain both uppercase and lowercase characters',
            'password.numbers' => 'Password must contain number',
            'password.symbols' => 'Password must contain @ # ! $',
            'role.required' => 'A role is required',
            'role.in' => 'The role must be either client, performer',
        ];
    }
}
