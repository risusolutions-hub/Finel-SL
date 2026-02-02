import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Users, MessageCircle, User, AtSign, Phone, MoreVertical, Check, CheckCheck, Plus } from 'lucide-react';
import api from '../../api';

export default function TeamMessagingView({ currentUser, setModal, user }) {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  import React from 'react';

  // Team messaging removed. Provide stub to avoid import errors.
  export default function TeamMessagingView() {
    return null;
  }
  useEffect(() => {
