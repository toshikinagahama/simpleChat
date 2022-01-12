import { atom } from 'recoil';

//count
export const countState = atom({
  key: 'count',
  default: 0,
});

//user
export const userState = atom({
  key: 'user',
  default: {
    id: '1',
    name: '',
    rooms: [{ name: 'aaa' }],
  },
});

//message
export const messagesState = atom({
  key: 'messages',
  default: [
    {
      id: '1',
      message: '',
      user_id: -1,
      room_id: -1,
    },
  ],
});

//isFirstFetchMessages
export const isFirstFetchMessagesState = atom({
  key: 'isFirstFetchMessages',
  default: false,
});
