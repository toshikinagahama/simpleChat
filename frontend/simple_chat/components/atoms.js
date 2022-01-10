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

export const socketState = atom({
  key: 'socket',
  default: null,
});
