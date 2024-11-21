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
        // Base validation rules for all users
        $rules = [
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

        // Additional rules for performers only
        if ($this->input('role') === 'performer') {
            $rules['id_picture'] = 'required|image|mimes:jpeg,png,jpg,gif|max:6048';
            $rules['holding_id_picture'] = 'required|image|mimes:jpeg,png,jpg,gif|max:6048';
        }

        return $rules;
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
            'password.min' => 'Please make the password longer than 8 characters',
            'password.letters' => 'Password must contain at least one letter',
            'password.mixed_case' => 'Password must contain both uppercase and lowercase characters',
            'password.numbers' => 'Password must contain at least one number',
            'password.symbols' => 'Password must contain at least one special character (@, #, !, $, etc.)',
            'role.required' => 'A role is required',
            'role.in' => 'The role must be either client, performer, or admin',
            'id_picture.required' => 'An ID picture is required for performers',
            'holding_id_picture.required' => 'A holding ID picture is required for performers',
        ];
    }
}
