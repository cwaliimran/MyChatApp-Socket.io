import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient, { setAuthToken } from '../apiClient';
import styles from '../ChatScreen.styles'; // Assuming you want to use similar styles

const ChatsScreen = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation();
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NmVkMmFmNDBlNGVkMGZhZGI2MGFiMTgiLCJpYXQiOjE3MjcwODEyNTd9.gbuquUSTYpwm5d0nweRNMBVm1z8SnMJ5BvigY1KQV0w'; // Replace with your token

  useEffect(() => {
    setAuthToken(token);
    loadChats(page);
  }, [page]);

  const loadChats = async (pageNumber) => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`conversation/chats?page=${pageNumber}&limit=10`);
      const newChats = response.data.data;

      if (newChats.length === 0) {
        setHasMore(false); // No more chats to load
      } else {
        setChats((prevChats) => [...prevChats, ...newChats]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (receiverId) => {
    navigation.navigate('ChatScreen', { receiverId });
  };

  const renderChatItem = ({ item }) => {
    const otherUser = item.otherUser.basicInfo;
    return (
      <TouchableOpacity onPress={() => handleChatPress(otherUser._id)} style={styles.chatItem}>
        <Image source={{ uri: otherUser.profileIcon }} style={styles.profileIcon} />
        <View>
          <Text style={styles.chatName}>{otherUser.name}</Text>
          <Text>{item.message.messageContent}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.message._id}
        renderItem={renderChatItem}
        onEndReached={() => loadChats(page + 1)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && <ActivityIndicator size="small" color="#000" />}
      />
    </View>
  );
};

export default ChatsScreen;
