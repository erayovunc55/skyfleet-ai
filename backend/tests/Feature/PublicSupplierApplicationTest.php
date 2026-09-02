<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicSupplierApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_supplier_application_is_created_pending_and_inactive(): void
    {
        Storage::fake('public');

        $response = $this->post('/api/public/supplier-applications', [
            'company_name' => 'Global Ride Partner',
            'legal_name' => 'Global Ride Partner Limited',
            'contact_name' => 'Test Partner',
            'company_email' => 'partner@example.com',
            'company_phone' => '+905551112233',
            'whatsapp' => '+905551112233',
            'website' => 'https://example.com',
            'country_code' => 'TR',
            'country_name' => 'Türkiye',
            'city' => 'İstanbul',
            'service_regions' => 'İstanbul Airport, Sabiha Gökçen Airport',
            'fleet_size' => 12,
            'vehicle_types' => 'Sedan, Minivan, Minibus',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Istanbul',
            'portal_password' => 'Secure1234',
            'portal_password_confirmation' => 'Secure1234',
            'terms_accepted' => '1',
            'company_registration_file' => UploadedFile::fake()
                ->create('company.pdf', 100, 'application/pdf'),
            'tax_document_file' => UploadedFile::fake()
                ->create('tax.pdf', 100, 'application/pdf'),
            'insurance_file' => UploadedFile::fake()
                ->create('insurance.pdf', 100, 'application/pdf'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.status', Supplier::STATUS_PENDING)
            ->assertJsonPath('data.portal_active', false);

        $supplier = Supplier::query()
            ->where('email', 'partner@example.com')
            ->firstOrFail();

        $this->assertFalse($supplier->is_active);
        $this->assertSame(3, $supplier->documents()->count());

        $portalUser = User::query()
            ->where('email', 'partner@example.com')
            ->firstOrFail();

        $this->assertSame('supplier', $portalUser->role);
        $this->assertFalse($portalUser->is_active);
        $this->assertSame($supplier->id, $portalUser->supplier_id);
    }
}
