// src/socket.js
import io from 'socket.io-client';

const socket = io('http://192.168.100.48:4002/'); // Replace with your backend URL

export default socket;
