import React from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  StatusChip,
  Spinner,
  Loading,
  Skeleton,
  SkeletonCard,
} from '../components/ui';

export const DesignSystem: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-bold mb-4">ChainDrive Design System</h1>
          <p className="text-lg text-ink-light">
            A distinctive light theme with official document aesthetics
          </p>
        </header>

        {/* Colors */}
        <section className="mb-12">
          <h2 className="mb-6">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-24 bg-paper border-2 border-ink/20 rounded-lg mb-2" />
              <p className="font-mono text-sm">paper</p>
              <p className="text-xs text-ink-light">#FAF8F5</p>
            </div>
            <div>
              <div className="h-24 bg-ink rounded-lg mb-2" />
              <p className="font-mono text-sm">ink</p>
              <p className="text-xs text-ink-light">#1A2332</p>
            </div>
            <div>
              <div className="h-24 bg-teal rounded-lg mb-2" />
              <p className="font-mono text-sm">teal</p>
              <p className="text-xs text-ink-light">#0D9488</p>
            </div>
            <div>
              <div className="h-24 bg-success rounded-lg mb-2" />
              <p className="font-mono text-sm">success</p>
              <p className="text-xs text-ink-light">#10B981</p>
            </div>
            <div>
              <div className="h-24 bg-warning rounded-lg mb-2" />
              <p className="font-mono text-sm">warning</p>
              <p className="text-xs text-ink-light">#F59E0B</p>
            </div>
            <div>
              <div className="h-24 bg-danger rounded-lg mb-2" />
              <p className="font-mono text-sm">danger</p>
              <p className="text-xs text-ink-light">#EF4444</p>
            </div>
            <div>
              <div className="h-24 bg-info rounded-lg mb-2" />
              <p className="font-mono text-sm">info</p>
              <p className="text-xs text-ink-light">#3B82F6</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="mb-6">Typography</h2>
          <Card>
            <div className="space-y-4">
              <div>
                <h1>Heading 1 - Lora</h1>
                <p className="text-sm text-ink-light">Font: Lora, Size: 2.25rem, Weight: 700</p>
              </div>
              <div>
                <h2>Heading 2 - Lora</h2>
                <p className="text-sm text-ink-light">Font: Lora, Size: 1.875rem, Weight: 600</p>
              </div>
              <div>
                <h3>Heading 3 - Lora</h3>
                <p className="text-sm text-ink-light">Font: Lora, Size: 1.5rem, Weight: 600</p>
              </div>
              <div>
                <p className="text-base">Body text - Inter</p>
                <p className="text-sm text-ink-light">Font: Inter, Size: 1rem, Weight: 400</p>
              </div>
              <div>
                <code className="bg-ink/5 px-2 py-1 rounded">0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</code>
                <p className="text-sm text-ink-light mt-2">Font: JetBrains Mono, Size: 0.875rem</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="mb-6">Buttons</h2>
          <Card>
            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-sm font-medium text-ink-light">Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-medium text-ink-light">Sizes</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-medium text-ink-light">States</h4>
                <div className="flex flex-wrap gap-3">
                  <Button isLoading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Form Controls */}
        <section className="mb-12">
          <h2 className="mb-6">Form Controls</h2>
          <Card>
            <div className="space-y-6 max-w-md">
              <Input
                label="Email Address"
                type="email"
                placeholder="driver@example.com"
                helperText="We'll never share your email"
              />
              <Input
                label="License Number"
                type="text"
                placeholder="DL1234567890"
                error="Invalid license number format"
              />
              <Select
                label="Role"
                options={[
                  { value: 'driver', label: 'Driver' },
                  { value: 'officer', label: 'Officer' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
              <Textarea
                label="Description"
                placeholder="Enter violation description..."
                helperText="Minimum 50 characters"
              />
            </div>
          </Card>
        </section>

        {/* Badges & Status */}
        <section className="mb-12">
          <h2 className="mb-6">Badges & Status</h2>
          <Card>
            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-sm font-medium text-ink-light">Badge Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-medium text-ink-light">Status Chips</h4>
                <div className="flex flex-wrap gap-3">
                  <StatusChip status="active" />
                  <StatusChip status="pending" />
                  <StatusChip status="suspended" />
                  <StatusChip status="revoked" />
                  <StatusChip status="paid" />
                  <StatusChip status="disputed" />
                  <StatusChip status="approved" />
                  <StatusChip status="rejected" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="mb-6">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-ink-light">
                  This is a card component with header and content sections.
                  It uses the paper background with subtle shadows.
                </p>
              </CardContent>
            </Card>
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Large Padding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-ink-light">
                  Cards can have different padding sizes: none, sm, md, lg.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-12">
          <h2 className="mb-6">Loading States</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spinners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Loading Component</CardTitle>
              </CardHeader>
              <CardContent>
                <Loading text="Fetching data..." />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Skeleton */}
        <section className="mb-12">
          <h2 className="mb-6">Skeleton Loaders</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <SkeletonCard />
            <Card>
              <Skeleton variant="circular" width="3rem" height="3rem" className="mb-4" />
              <Skeleton variant="text" width="70%" height="1.5rem" className="mb-2" />
              <Skeleton variant="text" width="90%" height="1rem" className="mb-2" />
              <Skeleton variant="text" width="60%" height="1rem" />
            </Card>
          </div>
        </section>

        {/* Code Display */}
        <section className="mb-12">
          <h2 className="mb-6">Code Display</h2>
          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-ink-light mb-2">Transaction Hash</p>
                <code className="block bg-ink/5 p-3 rounded-lg font-mono text-sm break-all">
                  0x4a5b3c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b
                </code>
              </div>
              <div>
                <p className="text-sm text-ink-light mb-2">Wallet Address</p>
                <code className="block bg-ink/5 p-3 rounded-lg font-mono text-sm">
                  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
                </code>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};
