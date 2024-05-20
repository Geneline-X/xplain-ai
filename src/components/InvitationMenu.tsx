"use client"
import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface InvitationMenuProps {
    //onSendInvite: (email: string) => void;
}

const InvitationMenu: React.FC<InvitationMenuProps> = () => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [showInviteMenu, setShowInviteMenu] = useState(false);

    const handleSendInvite = () => {
        if (inviteEmail.trim() === '') {
            // Validate if the email field is empty
            alert('Please enter a valid email address.');
            return;
        }
        
        // Call the onSendInvite callback with the entered email
        //onSendInvite(inviteEmail);
        // Clear the email input
        setInviteEmail('');
        // Close the menu after sending invite
        setShowInviteMenu(false);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>Invite</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='bg-white' align='end'>
                <div className="p-4">
                    <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email"
                        className="border border-gray-300 px-3 py-2 mb-2 w-40"
                    />
                    
                    <Button onClick={handleSendInvite} className="bg-blue-400 text-white px-4 py-2 rounded-md">
                        Send Invite
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default InvitationMenu;
