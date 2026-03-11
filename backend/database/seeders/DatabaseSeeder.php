<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $demoUserId = env('DEMO_USER_ID', '6b4a7cb6-5cec-4f68-a698-63706d4d3278');

        Company::query()->upsert([
            [
                'id' => '6e0f4f1a-9d21-4d70-8fca-113f89d2b901',
                'name' => 'Tech Nusantara',
                'logo_url' => '',
                'description' => 'Perusahaan teknologi yang fokus pada pengembangan produk digital untuk UMKM.',
                'location' => 'Jakarta',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => '9dbca0a3-fd4d-4f59-8b83-aef4f66f80bb',
                'name' => 'Fintek Maju',
                'logo_url' => '',
                'description' => 'Startup fintech dengan layanan pembayaran dan pembiayaan digital.',
                'location' => 'Bandung',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['id'], ['name', 'logo_url', 'description', 'location', 'updated_at']);

        Profile::query()->updateOrCreate([
            'id' => $demoUserId,
        ], [
            'full_name' => 'Lutfi Dani',
            'education' => 'S1 Teknik Informatika',
            'age' => 24,
            'years_experience' => 3,
            'location' => 'Jakarta',
            'phone' => '081234567890',
            'bio' => 'Frontend engineer yang sedang fokus belajar fullstack React + Laravel.',
            'avatar_url' => '',
            'is_premium' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $adminUser = User::query()->updateOrCreate([
            'email' => 'admin@karirku.test',
        ], [
            'name' => 'Admin KarirKu',
            'password' => Hash::make('admin12345'),
            'role' => 'admin',
            'profile_id' => null,
            'email_verified_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $hrdUser = User::query()->updateOrCreate([
            'email' => 'hrd@karirku.test',
        ], [
            'name' => 'HRD KarirKu',
            'password' => Hash::make('hrd12345'),
            'role' => 'hrd',
            'profile_id' => null,
            'email_verified_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        User::query()->updateOrCreate([
            'email' => 'user@karirku.test',
        ], [
            'name' => 'Lutfi Dani',
            'password' => Hash::make('user12345'),
            'role' => 'user',
            'profile_id' => $demoUserId,
            'email_verified_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        JobPost::query()->upsert([
            [
                'id' => '3ad2ca16-b4d7-4e8e-8f9f-07ec8e1d5b11',
                'company_id' => '6e0f4f1a-9d21-4d70-8fca-113f89d2b901',
                'created_by_user_id' => $hrdUser->id,
                'title' => 'Frontend React Developer',
                'description' => 'Membangun antarmuka web modern menggunakan React dan TypeScript.',
                'location' => 'Jakarta',
                'salary_min' => 9000000,
                'salary_max' => 14000000,
                'job_type' => 'Full-time',
                'min_age' => 21,
                'max_age' => 35,
                'min_experience_years' => 2,
                'requirements' => json_encode(['React', 'TypeScript', 'Tailwind CSS']),
                'benefits' => json_encode(['Asuransi', 'Bonus Kinerja', 'Hybrid Working']),
                'is_featured' => true,
                'approval_status' => 'approved',
                'approval_note' => 'Lowongan sesuai kebutuhan dan siap tayang.',
                'reviewed_by_user_id' => $adminUser->id,
                'reviewed_at' => $now->copy()->subHours(12),
                'expires_at' => $now->copy()->addDays(30),
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now,
            ],
            [
                'id' => 'aeaf2fe6-f533-4e42-a778-9828e52e23a4',
                'company_id' => '6e0f4f1a-9d21-4d70-8fca-113f89d2b901',
                'created_by_user_id' => $hrdUser->id,
                'title' => 'Backend Laravel Engineer',
                'description' => 'Merancang dan mengembangkan REST API berbasis Laravel untuk aplikasi skala menengah.',
                'location' => 'Remote',
                'salary_min' => 10000000,
                'salary_max' => 16000000,
                'job_type' => 'Full-time',
                'min_age' => 23,
                'max_age' => 40,
                'min_experience_years' => 3,
                'requirements' => json_encode(['PHP 8+', 'Laravel', 'MySQL']),
                'benefits' => json_encode(['Remote', 'Laptop', 'BPJS']),
                'is_featured' => true,
                'approval_status' => 'approved',
                'approval_note' => 'Disetujui untuk publikasi.',
                'reviewed_by_user_id' => $adminUser->id,
                'reviewed_at' => $now->copy()->subHours(6),
                'expires_at' => $now->copy()->addDays(25),
                'created_at' => $now->copy()->subDays(1),
                'updated_at' => $now,
            ],
            [
                'id' => '2f4d077d-08f7-474d-bf54-766d0c2df203',
                'company_id' => '9dbca0a3-fd4d-4f59-8b83-aef4f66f80bb',
                'created_by_user_id' => $hrdUser->id,
                'title' => 'UI/UX Designer',
                'description' => 'Mendesain pengalaman pengguna aplikasi mobile dan web finansial.',
                'location' => 'Bandung',
                'salary_min' => 7000000,
                'salary_max' => 11000000,
                'job_type' => 'Full-time',
                'min_age' => 20,
                'max_age' => 32,
                'min_experience_years' => 1,
                'requirements' => json_encode(['Figma', 'Design System', 'User Research']),
                'benefits' => json_encode(['Makan Siang', 'Transport', 'Asuransi']),
                'is_featured' => false,
                'approval_status' => 'pending',
                'approval_note' => null,
                'reviewed_by_user_id' => null,
                'reviewed_at' => null,
                'expires_at' => $now->copy()->addDays(20),
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now,
            ],
            [
                'id' => 'f6f55609-dd68-4f9d-9ec8-92171b6d2e55',
                'company_id' => '9dbca0a3-fd4d-4f59-8b83-aef4f66f80bb',
                'created_by_user_id' => $hrdUser->id,
                'title' => 'QA Engineer',
                'description' => 'Menjalankan pengujian manual dan otomatis untuk produk web dan mobile.',
                'location' => 'Yogyakarta',
                'salary_min' => 6500000,
                'salary_max' => 10000000,
                'job_type' => 'Contract',
                'min_age' => 20,
                'max_age' => 35,
                'min_experience_years' => 1,
                'requirements' => json_encode(['Testing', 'Postman', 'Cypress']),
                'benefits' => json_encode(['Pelatihan', 'THR']),
                'is_featured' => false,
                'approval_status' => 'rejected',
                'approval_note' => 'Kualifikasi belum sesuai kebutuhan tim saat ini.',
                'reviewed_by_user_id' => $adminUser->id,
                'reviewed_at' => $now->copy()->subHours(18),
                'expires_at' => $now->copy()->addDays(28),
                'created_at' => $now->copy()->subDays(4),
                'updated_at' => $now,
            ],
        ], ['id'], [
            'company_id',
            'created_by_user_id',
            'title',
            'description',
            'location',
            'salary_min',
            'salary_max',
            'job_type',
            'requirements',
            'benefits',
            'is_featured',
            'approval_status',
            'approval_note',
            'reviewed_by_user_id',
            'reviewed_at',
            'expires_at',
            'updated_at',
        ]);

        JobApplication::query()->upsert([
            [
                'id' => '9f16a7f7-5f42-4cf6-9b9a-c8d7f753c701',
                'user_id' => $demoUserId,
                'job_post_id' => '3ad2ca16-b4d7-4e8e-8f9f-07ec8e1d5b11',
                'status' => 'pending',
                'cover_letter' => '',
                'applied_at' => $now->copy()->subDays(1),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'a33760c5-c437-4809-a995-c8f321a275ed',
                'user_id' => $demoUserId,
                'job_post_id' => 'aeaf2fe6-f533-4e42-a778-9828e52e23a4',
                'status' => 'reviewing',
                'cover_letter' => '',
                'applied_at' => $now->copy()->subDays(3),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['user_id', 'job_post_id'], ['status', 'cover_letter', 'applied_at', 'updated_at']);
    }
}
