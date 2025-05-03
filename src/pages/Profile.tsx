import React from 'react';
import { Settings, Bell, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Profile() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div>
              <h2 className="text-lg font-semibold">Guest User</h2>
              <p className="text-sm text-gray-500">Please sign in to access your profile</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button variant="outline" className="justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" className="justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">My Listings</h3>
            <div className="text-center text-gray-500 py-8">
              No listings yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}