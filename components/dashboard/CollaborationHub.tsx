"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { Spinner } from '@heroui/spinner';
import { Tooltip } from '@heroui/tooltip';
import { Tabs, Tab } from '@heroui/tabs';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Switch } from '@heroui/switch';
import { Avatar, AvatarGroup } from '@heroui/avatar';
import { Progress } from '@heroui/progress';
// Textarea is not available in HeroUI, using Input with multiline
import Link from 'next/link';
import Image from 'next/image';

import {
  UserGroupIcon,
  UserPlusIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  CogIcon,
  PlayIcon,
  DocumentTextIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  LockClosedIcon,
  GlobeAltIcon,
  AcademicCapIcon,
} from '@/components/icons';

interface CollaborationInvite {
  id: string;
  projectId: string;
  projectTitle: string;
  projectThumbnail?: string;
  inviterName: string;
  inviterAvatar?: string;
  inviteeEmail: string;
  role: 'editor' | 'viewer' | 'admin';
  permissions: string[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  createdAt: string;
  expiresAt: string;
}

interface CollaborationSession {
  id: string;
  projectId: string;
  projectTitle: string;
  projectThumbnail?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'editor' | 'viewer' | 'admin';
    status: 'online' | 'offline' | 'away';
    joinedAt: string;
  }>;
  settings: {
    maxParticipants: number;
    allowGuests: boolean;
    requireApproval: boolean;
    shareCode?: string;
  };
  status: 'active' | 'paused' | 'ended';
  createdAt: string;
  lastActivity: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive: string;
  projectsCount: number;
  contributionsCount: number;
}

const COLLABORATION_ROLES = [
  { 
    key: 'admin', 
    label: 'Admin', 
    color: 'danger',
    permissions: ['edit', 'delete', 'invite', 'manage_settings', 'manage_permissions'],
    description: 'Full access to project management and settings'
  },
  { 
    key: 'editor', 
    label: 'Editor', 
    color: 'primary',
    permissions: ['edit', 'comment', 'view'],
    description: 'Can edit project content and participate in discussions'
  },
  { 
    key: 'viewer', 
    label: 'Viewer', 
    color: 'default',
    permissions: ['view', 'comment'],
    description: 'Can view project and leave comments'
  },
];

const SESSION_STATUSES = [
  { key: 'active', label: 'Active', color: 'success' },
  { key: 'paused', label: 'Paused', color: 'warning' },
  { key: 'ended', label: 'Ended', color: 'default' },
];

interface CollaborationHubProps {
  className?: string;
}

export default function CollaborationHub({ className = '' }: CollaborationHubProps) {
  // State management
  const [activeTab, setActiveTab] = useState('invites');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [invites, setInvites] = useState<CollaborationInvite[]>([]);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Filters
  const [inviteFilter, setInviteFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'my_sessions'>('all');
  
  // Modals
  const { isOpen: isInviteModalOpen, onOpen: onInviteModalOpen, onClose: onInviteModalClose } = useDisclosure();
  const { isOpen: isSessionModalOpen, onOpen: onSessionModalOpen, onClose: onSessionModalClose } = useDisclosure();
  const { isOpen: isSettingsModalOpen, onOpen: onSettingsModalOpen, onClose: onSettingsModalClose } = useDisclosure();
  
  // Form data
  const [inviteForm, setInviteForm] = useState({
    projectId: '',
    emails: '',
    role: 'editor' as 'editor' | 'viewer' | 'admin',
    message: '',
    permissions: [] as string[],
  });
  
  const [sessionForm, setSessionForm] = useState({
    projectId: '',
    maxParticipants: 5,
    allowGuests: false,
    requireApproval: true,
    isPublic: false,
  });

  // Mock data for development
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API calls - replace with real API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      setInvites([
        {
          id: '1',
          projectId: 'proj1',
          projectTitle: 'Space Shooter Deluxe',
          inviterName: 'Alice Johnson',
          inviteeEmail: 'bob@example.com',
          role: 'editor',
          permissions: ['edit', 'comment', 'view'],
          status: 'pending',
          message: 'Would you like to help me improve the enemy AI?',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          projectId: 'proj2',
          projectTitle: 'Pixel Adventure Quest',
          inviterName: 'Charlie Wilson',
          inviteeEmail: 'you@example.com',
          role: 'viewer',
          permissions: ['view', 'comment'],
          status: 'accepted',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      setSessions([
        {
          id: '1',
          projectId: 'proj1',
          projectTitle: 'Space Shooter Deluxe',
          hostId: 'user1',
          hostName: 'Alice Johnson',
          participants: [
            {
              id: 'user1',
              name: 'Alice Johnson',
              role: 'admin',
              status: 'online',
              joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            {
              id: 'user2',
              name: 'Bob Smith',
              role: 'editor',
              status: 'online',
              joinedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            },
          ],
          settings: {
            maxParticipants: 5,
            allowGuests: false,
            requireApproval: true,
            shareCode: 'SPACE123',
          },
          status: 'active',
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
      ]);

      setTeamMembers([
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'admin',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          projectsCount: 5,
          contributionsCount: 47,
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          role: 'editor',
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          projectsCount: 2,
          contributionsCount: 23,
        },
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaboration data');
      console.error('Collaboration hub error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvites = useMemo(() => {
    return invites.filter(invite => {
      if (inviteFilter === 'all') return true;
      return invite.status === inviteFilter;
    });
  }, [invites, inviteFilter]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (sessionFilter === 'all') return true;
      if (sessionFilter === 'active') return session.status === 'active';
      if (sessionFilter === 'my_sessions') return session.hostId === 'current_user'; // Replace with actual user ID
      return true;
    });
  }, [sessions, sessionFilter]);

  const handleInviteAction = async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setInvites(prev => prev.map(invite => 
        invite.id === inviteId 
          ? { ...invite, status: action === 'accept' ? 'accepted' : 'declined' }
          : invite
      ));
    } catch (err) {
      console.error('Invite action error:', err);
    }
  };

  const handleSendInvite = async () => {
    try {
      // Validate form
      if (!inviteForm.projectId || !inviteForm.emails) {
        throw new Error('Project and email addresses are required');
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add new invite to list
      const emails = inviteForm.emails.split(',').map(e => e.trim());
      const newInvites = emails.map((email, index) => ({
        id: `new-${Date.now()}-${index}`,
        projectId: inviteForm.projectId,
        projectTitle: 'Selected Project', // Would come from API
        inviterName: 'You',
        inviteeEmail: email,
        role: inviteForm.role,
        permissions: COLLABORATION_ROLES.find(r => r.key === inviteForm.role)?.permissions || [],
        status: 'pending' as const,
        message: inviteForm.message,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      setInvites(prev => [...newInvites, ...prev]);
      
      // Reset form
      setInviteForm({
        projectId: '',
        emails: '',
        role: 'editor',
        message: '',
        permissions: [],
      });
      
      onInviteModalClose();
    } catch (err) {
      console.error('Send invite error:', err);
    }
  };

  const handleStartSession = async () => {
    try {
      if (!sessionForm.projectId) {
        throw new Error('Project is required');
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSession: CollaborationSession = {
        id: `session-${Date.now()}`,
        projectId: sessionForm.projectId,
        projectTitle: 'Selected Project',
        hostId: 'current_user',
        hostName: 'You',
        participants: [{
          id: 'current_user',
          name: 'You',
          role: 'admin',
          status: 'online',
          joinedAt: new Date().toISOString(),
        }],
        settings: {
          maxParticipants: sessionForm.maxParticipants,
          allowGuests: sessionForm.allowGuests,
          requireApproval: sessionForm.requireApproval,
          shareCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      setSessions(prev => [newSession, ...prev]);
      
      setSessionForm({
        projectId: '',
        maxParticipants: 5,
        allowGuests: false,
        requireApproval: true,
        isPublic: false,
      });
      
      onSessionModalClose();
    } catch (err) {
      console.error('Start session error:', err);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const InviteCard = ({ invite }: { invite: CollaborationInvite }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
        <CardBody className="p-4">
          <div className="flex items-center space-x-4">
            {/* Project thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex-shrink-0">
              {invite.projectThumbnail ? (
                <Image
                  src={invite.projectThumbnail}
                  alt={invite.projectTitle}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <UserGroupIcon className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>

            {/* Invite details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-white truncate">
                  {invite.projectTitle}
                </h3>
                <Chip
                  size="sm"
                  color={
                    invite.status === 'pending' ? 'warning' :
                    invite.status === 'accepted' ? 'success' :
                    invite.status === 'declined' ? 'danger' : 'default'
                  }
                  variant="flat"
                >
                  {invite.status}
                </Chip>
              </div>
              
              <p className="text-gray-400 text-sm mb-2">
                Invited by <strong>{invite.inviterName}</strong> as <strong>{invite.role}</strong>
              </p>
              
              {invite.message && (
                <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                  "{invite.message}"
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{formatRelativeTime(invite.createdAt)}</span>
                <span>Expires {formatRelativeTime(invite.expiresAt)}</span>
              </div>
            </div>

            {/* Actions */}
            {invite.status === 'pending' && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  color="success"
                  onClick={() => handleInviteAction(invite.id, 'accept')}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="bordered"
                  onClick={() => handleInviteAction(invite.id, 'decline')}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );

  const SessionCard = ({ session }: { session: CollaborationSession }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
        <CardBody className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                {session.projectThumbnail ? (
                  <Image
                    src={session.projectThumbnail}
                    alt={session.projectTitle}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <UserGroupIcon className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {session.projectTitle}
                </h3>
                <p className="text-gray-400 text-sm">
                  Hosted by {session.hostName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Chip
                size="sm"
                color={
                  session.status === 'active' ? 'success' :
                  session.status === 'paused' ? 'warning' : 'default'
                }
                variant="flat"
              >
                {session.status}
              </Chip>
              {session.settings.shareCode && (
                <Tooltip content={`Share Code: ${session.settings.shareCode}`}>
                  <Chip size="sm" variant="bordered" className="font-mono">
                    {session.settings.shareCode}
                  </Chip>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AvatarGroup max={4} size="sm">
                {session.participants.map((participant) => (
                  <Avatar
                    key={participant.id}
                    src={participant.avatar}
                    name={participant.name}
                    className={`${
                      participant.status === 'online' ? 'ring-2 ring-green-500' :
                      participant.status === 'away' ? 'ring-2 ring-yellow-500' :
                      'ring-1 ring-gray-500'
                    }`}
                  />
                ))}
              </AvatarGroup>
              <span className="text-sm text-gray-400">
                {session.participants.length}/{session.settings.maxParticipants} participants
              </span>
            </div>
            
            <div className="text-xs text-gray-500">
              Last activity {formatRelativeTime(session.lastActivity)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              {session.settings.allowGuests && (
                <Chip size="sm" variant="flat">
                  <GlobeAltIcon className="w-3 h-3 mr-1" />
                  Public
                </Chip>
              )}
              {session.settings.requireApproval && (
                <Chip size="sm" variant="flat">
                  <LockClosedIcon className="w-3 h-3 mr-1" />
                  Approval Required
                </Chip>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {session.status === 'active' && (
                <Button
                  size="sm"
                  color="primary"
                  startContent={<PlayIcon className="w-3 h-3" />}
                >
                  Join Session
                </Button>
              )}
              <Button
                size="sm"
                variant="bordered"
                isIconOnly
              >
                <ShareIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );

  return (
    <>
      {/* Modals */}
      <Modal isOpen={isInviteModalOpen} onClose={onInviteModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>Send Collaboration Invite</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Select Project"
                placeholder="Choose a project to share"
                selectedKeys={[inviteForm.projectId]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setInviteForm(prev => ({ ...prev, projectId: selected }));
                }}
              >
                <SelectItem key="proj1">Space Shooter Deluxe</SelectItem>
                <SelectItem key="proj2">Pixel Adventure Quest</SelectItem>
                <SelectItem key="proj3">Puzzle Master</SelectItem>
              </Select>

              <Input
                label="Email Addresses"
                placeholder="user1@example.com, user2@example.com"
                value={inviteForm.emails}
                onChange={(e) => setInviteForm(prev => ({ ...prev, emails: e.target.value }))}
                description="Separate multiple emails with commas"
              />

              <Select
                label="Role"
                selectedKeys={[inviteForm.role]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as 'editor' | 'viewer' | 'admin';
                  setInviteForm(prev => ({ ...prev, role: selected }));
                }}
              >
                {COLLABORATION_ROLES.map((role) => (
                  <SelectItem key={role.key} description={role.description}>
                    {role.label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                type="text"
                label="Personal Message (Optional)"
                placeholder="Add a personal message to your invitation..."
                value={inviteForm.message}
                onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onClick={onInviteModalClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onClick={handleSendInvite}
              isDisabled={!inviteForm.projectId || !inviteForm.emails}
            >
              Send Invite
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSessionModalOpen} onClose={onSessionModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>Start Collaboration Session</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Select Project"
                placeholder="Choose a project for collaboration"
                selectedKeys={[sessionForm.projectId]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSessionForm(prev => ({ ...prev, projectId: selected }));
                }}
              >
                <SelectItem key="proj1">Space Shooter Deluxe</SelectItem>
                <SelectItem key="proj2">Pixel Adventure Quest</SelectItem>
                <SelectItem key="proj3">Puzzle Master</SelectItem>
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Max Participants"
                  value={sessionForm.maxParticipants.toString()}
                  onChange={(e) => setSessionForm(prev => ({ 
                    ...prev, 
                    maxParticipants: Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                  }))}
                  min="1"
                  max="10"
                />

                <div className="space-y-3">
                  <Switch
                    isSelected={sessionForm.allowGuests}
                    onValueChange={(checked) => setSessionForm(prev => ({ ...prev, allowGuests: checked }))}
                  >
                    Allow Guest Access
                  </Switch>
                  
                  <Switch
                    isSelected={sessionForm.requireApproval}
                    onValueChange={(checked) => setSessionForm(prev => ({ ...prev, requireApproval: checked }))}
                  >
                    Require Join Approval
                  </Switch>
                  
                  <Switch
                    isSelected={sessionForm.isPublic}
                    onValueChange={(checked) => setSessionForm(prev => ({ ...prev, isPublic: checked }))}
                  >
                    Make Session Public
                  </Switch>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onClick={onSessionModalClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onClick={handleStartSession}
              isDisabled={!sessionForm.projectId}
            >
              Start Session
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Collaboration Hub</h2>
            <p className="text-gray-400">
              Manage your team collaborations, invites, and active sessions
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              color="success"
              startContent={<UserPlusIcon className="w-4 h-4" />}
              onClick={onInviteModalOpen}
            >
              Send Invite
            </Button>
            <Button
              color="primary"
              startContent={<PlayIcon className="w-4 h-4" />}
              onClick={onSessionModalOpen}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              Start Session
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20">
            <CardBody className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{invites.filter(i => i.status === 'pending').length}</div>
              <div className="text-sm text-gray-400">Pending Invites</div>
            </CardBody>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20">
            <CardBody className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{sessions.filter(s => s.status === 'active').length}</div>
              <div className="text-sm text-gray-400">Active Sessions</div>
            </CardBody>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20">
            <CardBody className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{teamMembers.length}</div>
              <div className="text-sm text-gray-400">Team Members</div>
            </CardBody>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20">
            <CardBody className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {teamMembers.reduce((sum, member) => sum + member.contributionsCount, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Contributions</div>
            </CardBody>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={setActiveTab as any}
          variant="bordered"
          color="primary"
          classNames={{
            tabList: "bg-gray-900/50 backdrop-blur-xl border-purple-500/20",
            tab: "text-gray-400 hover:text-white",
            cursor: "bg-purple-500",
          }}
        >
          <Tab 
            key="invites" 
            title={
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4" />
                <span>Invites</span>
                {invites.filter(i => i.status === 'pending').length > 0 && (
                  <Badge color="warning" size="sm">
                    {invites.filter(i => i.status === 'pending').length}
                  </Badge>
                )}
              </div>
            }
          />
          <Tab 
            key="sessions" 
            title={
              <div className="flex items-center space-x-2">
                <PlayIcon className="w-4 h-4" />
                <span>Sessions</span>
                {sessions.filter(s => s.status === 'active').length > 0 && (
                  <Badge color="success" size="sm">
                    {sessions.filter(s => s.status === 'active').length}
                  </Badge>
                )}
              </div>
            }
          />
          <Tab 
            key="team" 
            title={
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-4 h-4" />
                <span>Team</span>
              </div>
            }
          />
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'invites' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Select
                      placeholder="Filter invites"
                      className="w-48"
                      selectedKeys={[inviteFilter]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as typeof inviteFilter;
                        setInviteFilter(selected);
                      }}
                    >
                      <SelectItem key="all">All Invites</SelectItem>
                      <SelectItem key="pending">Pending</SelectItem>
                      <SelectItem key="accepted">Accepted</SelectItem>
                      <SelectItem key="declined">Declined</SelectItem>
                    </Select>
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    {filteredInvites.length} invite{filteredInvites.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardBody className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  ) : filteredInvites.length > 0 ? (
                    filteredInvites.map((invite) => (
                      <InviteCard key={invite.id} invite={invite} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <EnvelopeIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No invites found</h3>
                      <p className="text-gray-400 mb-6">
                        {inviteFilter === 'all' 
                          ? "You don't have any collaboration invites yet"
                          : `No ${inviteFilter} invites found`
                        }
                      </p>
                      <Button
                        color="primary"
                        onClick={onInviteModalOpen}
                        startContent={<UserPlusIcon className="w-4 h-4" />}
                      >
                        Send Your First Invite
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Select
                      placeholder="Filter sessions"
                      className="w-48"
                      selectedKeys={[sessionFilter]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as typeof sessionFilter;
                        setSessionFilter(selected);
                      }}
                    >
                      <SelectItem key="all">All Sessions</SelectItem>
                      <SelectItem key="active">Active Only</SelectItem>
                      <SelectItem key="my_sessions">My Sessions</SelectItem>
                    </Select>
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardBody className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  ) : filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <PlayIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No active sessions</h3>
                      <p className="text-gray-400 mb-6">
                        Start a collaboration session to work together in real-time
                      </p>
                      <Button
                        color="primary"
                        onClick={onSessionModalOpen}
                        startContent={<PlayIcon className="w-4 h-4" />}
                        className="bg-gradient-to-r from-purple-500 to-purple-600"
                      >
                        Start Your First Session
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Team Members</h3>
                  <p className="text-sm text-gray-400">
                    {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member) => (
                    <Card key={member.id} className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                      <CardBody className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar
                            src={member.avatar}
                            name={member.name}
                            size="lg"
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{member.name}</h4>
                            <p className="text-gray-400 text-sm">{member.email}</p>
                            <Chip
                              size="sm"
                              color={
                                member.role === 'owner' ? 'danger' :
                                member.role === 'admin' ? 'warning' :
                                member.role === 'editor' ? 'primary' : 'default'
                              }
                              variant="flat"
                            >
                              {member.role}
                            </Chip>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-purple-400">{member.projectsCount}</div>
                            <div className="text-xs text-gray-400">Projects</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-400">{member.contributionsCount}</div>
                            <div className="text-xs text-gray-400">Contributions</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Joined {formatRelativeTime(member.joinedAt)}</span>
                            <span>Active {formatRelativeTime(member.lastActive)}</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {teamMembers.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No team members yet</h3>
                    <p className="text-gray-400 mb-6">
                      Invite collaborators to build your team
                    </p>
                    <Button
                      color="primary"
                      onClick={onInviteModalOpen}
                      startContent={<UserPlusIcon className="w-4 h-4" />}
                    >
                      Invite Team Members
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}