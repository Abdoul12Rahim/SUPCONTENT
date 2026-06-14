import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#7c3aed', 
  primaryLight: 'rgba(124,58,237,0.15)',
  primaryBorder: 'rgba(124,58,237,0.25)', 
  bgDark: '#0d0d14',
  surface: '#13131f', 
  surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)', 
  textLight: '#f1f5f9',
  textMuted: '#64748b', 
  accentGreen: '#10b981', 
  danger: '#ef4444',
};

const GIFS = [
  { id: 'g1', url: 'https://media.giphy.com/media/307abKhOpu0NwenH30/giphy.gif', label: 'GG' },
  { id: 'g2', url: 'https://media.giphy.com/media/I0MYt5jPR6QX5pnqM/giphy.gif', label: 'LOL' },
  { id: 'g3', url: 'https://media.giphy.com/media/26ufdipQqU2IhNA4g/giphy.gif', label: 'Win' },
  { id: 'g4', url: 'https://media.giphy.com/media/3oz8xlsloV7zOmt81G/giphy.gif', label: 'Hype' },
];

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { conversationId, name, avatar, userId, isSelf } = route.params;

  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showGifs, setShowGifs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const msgListRef = useRef(null);

  // 1. On déclare la fonction AVANT le useEffect
const loadMessages = async (convId, showLoader = true) => {
    if (!convId) return;
    if (convId === 'self') {
      try {
        if (showLoader) setIsLoading(true);
        const savedNotes = await AsyncStorage.getItem(`notes_${user._id}`);
        if (savedNotes) {
          setChatMessages(JSON.parse(savedNotes));
        }
        setTimeout(() => {
          msgListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } catch (e) {
        console.log('Erreur chargement notes:', e);
      } finally {
        if (showLoader) setIsLoading(false);
      }
      return; 
    }
    try {
      if (showLoader) setIsLoading(true);
      const res = await messageAPI.getMessages(convId);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : raw?.messages || raw?.data || [];
      setChatMessages(list);
      
      setTimeout(() => {
        msgListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (e) {
      console.log('Erreur loadMessages:', e.message);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // 2. Maintenant on appelle la fonction en toute sécurité
  useEffect(() => {
    loadMessages(conversationId);
    const interval = setInterval(() => {
      loadMessages(conversationId, false);
    }, 3000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conversationId]);

const sendMessage = async (type = 'text', content = null) => {
    const msgContent = content || inputText.trim();
    if (!msgContent) return;
    
    setIsSending(true);

    // 1. On sauvegarde la nouvelle note sur le disque dur
    if (conversationId === 'self' || !conversationId) {
      const fallbackMsg = {
        _id: Date.now().toString(),
        sender: { _id: user._id, username: user.username, avatar: user.avatar },
        content: msgContent,
        type,
        createdAt: new Date().toISOString(),
      };
      
      // On met à jour l'écran
      const newMessages = [...chatMessages, fallbackMsg];
      setChatMessages(newMessages);
      
      // On sauvegarde DÉFINITIVEMENT dans le téléphone
      try {
        await AsyncStorage.setItem(`notes_${user._id}`, JSON.stringify(newMessages));
      } catch (e) {
        console.log('Erreur sauvegarde notes:', e);
      }

      setInputText('');
      setShowGifs(false);
      setIsSending(false);
      
      setTimeout(() => {
        msgListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return; 
    }
    try {
      const res = await messageAPI.sendMessage(conversationId, {
        content: msgContent,
        type,
      });
      const newMsg = res.data;
      setChatMessages(prev => [...prev, newMsg]);
      setInputText('');
      setShowGifs(false);
      
      setTimeout(() => {
        msgListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      console.log('Erreur sendMessage:', e.message);
    } finally {
      setIsSending(false);
    }
  };

  const getMsgTime = (msg) => {
    if (!msg.createdAt) return msg.time || '';
    return new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (msg) => {
    return msg.sender?._id === user._id || msg.senderId === 'me';
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

return (
    
<KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bgDark }}   
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0} 
    >
      {/* Header fixé */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <MaterialIcons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          onPress={() => !isSelf && navigation.navigate('Profile', { userId })}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.chatAvatar} />
          ) : (
            <View style={[styles.chatAvatar, styles.chatAvatarPlaceholder]}>
              <MaterialIcons name={isSelf ? 'bookmark' : 'person'} size={18} color={COLORS.primary} />
            </View>
          )}
          <View>
            <Text style={styles.chatName}>{name}</Text>
            {isSelf && (
              <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>Tes notes privées</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <MaterialIcons name="more-vert" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={msgListRef}
        data={chatMessages}
        keyExtractor={(item, i) => item._id?.toString() || i.toString()}
        // 3. On ajoute un peu plus de paddingBottom à la liste pour s'assurer que le dernier message n'est pas collé au clavier
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        onContentSizeChange={() => msgListRef.current?.scrollToEnd({ animated: false })}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <MaterialIcons name={isSelf ? 'bookmark-border' : 'chat-bubble-outline'} size={48} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 16 }}>
              {isSelf ? 'Tes notes' : 'Nouvelle conversation'}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
              {isSelf ? 'Note tes idées, liens, et rappels ici. Tout est privé.' : 'Envoie le premier message !'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = isMyMessage(item);
          const sender = item.sender || {};
          return (
            <View style={[styles.msgRow, mine && styles.msgRowMe]}>
              {!mine && (
                <TouchableOpacity onPress={() => sender._id && navigation.navigate('Profile', { userId: sender._id })}>
                  {sender.avatar ? (
                    <Image source={{ uri: sender.avatar }} style={styles.msgAvatar} />
                  ) : (
                    <View style={[styles.msgAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialIcons name="person" size={14} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <View style={{ maxWidth: '75%' }}>
                <View style={[styles.msgBubble, mine ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                  {item.type === 'gif' || item.content?.startsWith('https://media.giphy.com') ? (
                    <Image source={{ uri: item.content }} style={{ width: 180, height: 120, borderRadius: 12 }} resizeMode="cover" />
                  ) : item.type === 'voice' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialIcons name="mic" size={18} color={mine ? 'white' : COLORS.primary} />
                      <Text style={{ color: mine ? 'white' : COLORS.textLight, fontSize: 13, fontStyle: 'italic' }}>Message vocal</Text>
                      <MaterialIcons name="play-arrow" size={20} color={mine ? 'white' : COLORS.primary} />
                    </View>
                  ) : (
                    <Text style={{ color: mine ? 'white' : COLORS.textLight, fontSize: 14, lineHeight: 20 }}>
                      {item.content}
                    </Text>
                  )}
                </View>
                <Text style={[styles.msgTime, mine && { textAlign: 'right' }]}>{getMsgTime(item)}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* GIF picker */}
      {showGifs && (
        <View style={styles.gifPicker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GIFS.map(gif => (
              <TouchableOpacity key={gif.id} onPress={() => sendMessage('gif', gif.url)} style={styles.gifThumb}>
                <Image source={{ uri: gif.url }} style={{ width: 80, height: 60, borderRadius: 8 }} />
                <Text style={styles.gifLabel}>{gif.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: 12 }]}>
        <TouchableOpacity onPress={() => setShowGifs(!showGifs)} style={styles.inputAction}>
          <Text style={{ fontSize: 22 }}>👾</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => sendMessage('voice', 'vocal')} style={styles.inputAction}>
          <MaterialIcons name="mic" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.chatInput}
          placeholder={isSelf ? 'Note quelque chose...' : 'Message...'}
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        
        <TouchableOpacity
          onPress={() => sendMessage('text')}
          style={[styles.sendBtn, { opacity: (inputText.trim() && !isSending) ? 1 : 0.4 }]}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialIcons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  chatAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  chatAvatarPlaceholder: { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: 'center', alignItems: 'center' },
  chatName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  navBtn: { padding: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  msgTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, marginHorizontal: 4 },
  gifPicker: { backgroundColor: COLORS.surface, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  gifThumb: { alignItems: 'center', marginRight: 10 },
  gifLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  inputAction: { padding: 6, marginRight: 4 },
  chatInput: { flex: 1, backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, maxHeight: 100 },
  sendBtn: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});