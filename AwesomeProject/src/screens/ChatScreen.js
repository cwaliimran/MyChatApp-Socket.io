import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  ActivityIndicator,
} from 'react-native';
import socket from '../socket';
import apiClient, {setAuthToken} from '../apiClient';
import styles from '../ChatScreen.styles'; // Import styles
import {useRoute} from '@react-navigation/native'; // Import useRoute
import {nanoid} from '../../node_modules/nanoid/async/index.d';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const route = useRoute();
  const receiverId = route.params.receiverId; // Get receiverId from route parameters
  const userId = '66ed2af40e4ed0fadb60ab18'; // Replace with your actual userId
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NmVkMmFmNDBlNGVkMGZhZGI2MGFiMTgiLCJpYXQiOjE3MjcwNzYwMDd9.UZB_78CWgpMZZ8bvD80L3cFTxCzMslGxZUsrFW8LNzU'; // Replace with your actual token
  const conversationId = receiverId; // Use receiverId as the conversationId

  useEffect(() => {
    setAuthToken(token);
    socket.io.opts.query = {userId};

    if (!socket.connected) {
      console.log('Connecting socket for user:', userId);
      socket.connect();
    } else {
      console.log('Socket already connected');
    }

    loadMessages(page); // Load initial messages

    // Listen for incoming messages
    socket.on('receiveMessage', newMessage => {
      console.log('Received new message:', newMessage);
      const num = Math.floor(Math.random() * 1000000);
      

      const nMessage = {
        _id: num,
        messageContent: newMessage?.messageContent?.messageContent || "Hello",
        messageType: newMessage?.messageContent?.messageType || "text",
        senderId: newMessage?.senderId,
        receiverId: newMessage?.receiverId,
        isRead: false,
      };
      console.log('nMessage', nMessage);
      setMessages(prevMessages => [nMessage, ...prevMessages]);
    });

    return () => {
      console.log('Disconnecting socket');
      socket.off('receiveMessage');
      socket.disconnect(); // Clean up socket connection
    };
  }, [token, userId, page]);

  const loadMessages = async pageNumber => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await apiClient.get(
        `conversation/${conversationId}/messages?page=${pageNumber}&limit=10`,
      );
      const newMessages = response.data.data;
      if (newMessages.length === 0) {
        setHasMore(false); // No more messages to load
      } else {
        setMessages(prevMessages => [...prevMessages, ...newMessages]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (message.trim()) {
      const payload = {
        senderId: userId,
        receiverId: receiverId,
        messageType: 'text',
        messageContent: message,
        mediaUrl: null,
      };

      try {
        const response = await apiClient.post(
          `conversation/${receiverId}/message`,
          payload,
        );
        const savedMessage = response.data.data;

        console.log('data', {
          senderId: userId,
          receiverId: receiverId,
          message: {
            messageType: 'text',
            messageContent: savedMessage.messageContent,
          },
        });

        socket.emit('sendMessage', {
          senderId: userId,
          receiverId: receiverId,
          message: {
            messageType: 'text',
            messageContent: savedMessage.messageContent,
          },
        });

        // Add the new message to the state
        setMessages(prevMessages => [savedMessage, ...prevMessages]);
        setMessage(''); // Clear the input field
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1); // Increment the page for pagination
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item =>
          item._id || `${item.senderId}_${item.messageContent}`
        }
        renderItem={({item}) => {
          const isSentByUser = item.senderId === userId;
          return (
            <View
              style={[
                styles.messageContainer,
                isSentByUser ? styles.sentMessage : styles.receivedMessage,
              ]}>
              <Text style={{color: isSentByUser ? 'white' : 'black'}}>
                {item.messageContent}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
        inverted // Show messages with the newest at the bottom
        onEndReached={handleLoadMore} // Load more messages when the user scrolls up
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && <ActivityIndicator size="small" color="#000" />
        }
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message"
          style={styles.input}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

export default ChatScreen;
