import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Image, MapPin, Flag, Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { MessageList } from '../components/chat/MessageList';
import { ConversationList } from '../components/chat/ConversationList';
import { ReportModal } from '../components/moderation/ReportModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Message, Conversation } from '../types';

export function Messages() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!user) {
      setError('Veuillez vous connecter pour accéder à vos messages');
      setLoading(false);
      return;
    }
  }, [user]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        console.log('Fetching conversations for user:', user.id);
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            product:product_id(title),
            buyer:buyer_id(full_name),
            seller:seller_id(full_name)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          throw conversationsError;
        }

        console.log('Conversations fetched:', conversationsData);

        // Then fetch the last message for each conversation
        const conversationsWithMessages = await Promise.all(
          (conversationsData || []).map(async (conversation) => {
            const { data: messageData, error: messageError } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (messageError && messageError.code !== 'PGRST116') {
              console.error('Error fetching last message:', messageError);
            }

            return {
              ...conversation,
              last_message: messageData
            };
          })
        );

        setConversations(conversationsWithMessages);
      } catch (error) {
        console.error('Error in fetchConversations:', error);
        setError('Erreur lors du chargement des conversations');
      }
    };

    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchMessages = async () => {
      try {
        console.log('Fetching messages for conversation:', conversationId);
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(full_name),
            receiver:receiver_id(full_name)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          throw error;
        }

        console.log('Messages fetched:', data);
        setMessages(data || []);
      } catch (error) {
        console.error('Error in fetchMessages:', error);
        setError('Erreur lors du chargement des messages');
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to new messages
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    fetchMessages();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !conversationId || isBlocked || !user) return;

    // Rate limiting
    if (rateLimit >= 10) {
      toast.error('Veuillez patienter avant d\'envoyer d\'autres messages');
      return;
    }

    try {
      let imageUrl = '';
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${conversationId}/${fileName}`;

        console.log('Uploading image:', filePath);
        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) throw new Error('Conversation not found');

      const messageData = {
        conversation_id: conversationId,
        content: newMessage.trim(),
        image_url: imageUrl || null,
        sender_id: user.id,
        receiver_id: conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id
      };

      console.log('Sending message:', messageData);
      const { error } = await supabase.from('messages').insert(messageData);

      if (error) throw error;

      setNewMessage('');
      setSelectedImage(null);
      setRateLimit((prev) => prev + 1);
      setTimeout(() => setRateLimit((prev) => Math.max(0, prev - 1)), 60000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Type de fichier invalide. Veuillez télécharger une image JPEG, PNG ou WebP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux. Taille maximum : 5MB.');
      return;
    }

    setSelectedImage(file);
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationMessage = `📍 Location: https://www.google.com/maps?q=${latitude},${longitude}`;
        setNewMessage(locationMessage);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Impossible d\'obtenir votre position');
      }
    );
  };

  const handleBlockUser = async () => {
    if (!user) return;

    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const blockedUserId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;

      console.log('Blocking user:', blockedUserId);
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_user_id: blockedUserId
        });

      if (error) throw error;

      setIsBlocked(true);
      toast.success('Utilisateur bloqué avec succès');
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Erreur lors du blocage de l\'utilisateur');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Veuillez vous connecter pour accéder à vos messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <ConversationList
          conversations={conversations}
          selectedId={conversationId}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {conversationId ? (
          <>
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <h3 className="font-medium">
                {conversations.find(c => c.id === conversationId)?.product?.title}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportModal(true)}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Signaler
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBlockUser}
                  disabled={isBlocked}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {isBlocked ? 'Bloqué' : 'Bloquer'}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <MessageList messages={messages} />
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t bg-white flex items-center space-x-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isBlocked}
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBlocked}
              >
                <Image className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleShareLocation}
                disabled={isBlocked}
              >
                <MapPin className="h-4 w-4" />
              </Button>

              <Button type="submit" disabled={(!newMessage.trim() && !selectedImage) || isBlocked}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Sélectionnez une conversation pour commencer à discuter
          </div>
        )}
      </div>

      {showReportModal && conversationId && (
        <ReportModal
          contentType="user"
          contentId={conversations.find(c => c.id === conversationId)?.seller_id || ''}
          reportedId={conversations.find(c => c.id === conversationId)?.seller_id || ''}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}