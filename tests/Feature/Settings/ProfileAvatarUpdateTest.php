<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class ProfileAvatarUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_a_user_can_upload_a_profile_picture(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('profile.avatar.update'), [
                'avatar' => UploadedFile::fake()->image('me.jpg'),
            ])
            ->assertOk()
            ->assertJsonPath('saved', true);

        $path = $user
            ->refresh()
            ->getRawOriginal('avatar');

        $this->assertStringStartsWith(User::AVATAR_UPLOAD_DIRECTORY . '/', $path);
        $this->assertTrue($user->hasUploadedAvatar());
        $this->assertSame("/storage/{$path}", $user->avatar);
        $response->assertJsonPath('avatar', "/storage/{$path}");
        Storage::disk('public')->assertExists($path);
    }

    public function test_uploading_a_new_picture_deletes_the_previous_upload(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('profile.avatar.update'), [
                'avatar' => UploadedFile::fake()->image('first.jpg'),
            ])
            ->assertOk();

        $first = $user
            ->refresh()
            ->getRawOriginal('avatar');

        $this->actingAs($user)
            ->post(route('profile.avatar.update'), [
                'avatar' => UploadedFile::fake()->image('second.png'),
            ])
            ->assertOk();

        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($user->refresh()->getRawOriginal('avatar'));
    }

    public function test_the_default_and_google_avatars_are_served_as_stored(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->hasUploadedAvatar());

        $user
            ->forceFill(['avatar' => 'https://lh3.googleusercontent.com/a/avatar'])
            ->save();

        $this->assertSame('https://lh3.googleusercontent.com/a/avatar', $user->refresh()->avatar);
        $this->assertFalse($user->hasUploadedAvatar());
    }

    public function test_the_upload_must_be_a_small_enough_image(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('profile.avatar.update'), [
                'avatar' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');

        $this->actingAs($user)
            ->postJson(route('profile.avatar.update'), [
                'avatar' => UploadedFile::fake()
                    ->image('huge.jpg')
                    ->size(User::MAX_AVATAR_KB + 1),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');

        $this->assertFalse($user->refresh()->hasUploadedAvatar());
    }

    public function test_guests_cannot_upload_a_profile_picture(): void
    {
        $this->postJson(route('profile.avatar.update'), [
            'avatar' => UploadedFile::fake()->image('me.jpg'),
        ])
            ->assertUnauthorized();
    }

    public function test_google_sign_in_keeps_an_uploaded_picture(): void
    {
        $user = User::factory()->create([
            'google_id' => 'google-1',
        ]);

        $this->actingAs($user)
            ->post(route('profile.avatar.update'), [
                'avatar' => UploadedFile::fake()->image('me.jpg'),
            ])
            ->assertOk();

        $uploaded = $user
            ->refresh()
            ->getRawOriginal('avatar');

        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-1');
        $googleUser->shouldReceive('getEmail')->andReturn($user->email);
        $googleUser->shouldReceive('getName')->andReturn($user->name);
        $googleUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/new-avatar');

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $this->get(route('login.google.callback', ['website' => 'google']))
            ->assertRedirectContains('/socialite-callback?token=');

        $this->assertSame($uploaded, $user->refresh()->getRawOriginal('avatar'));
    }
}
