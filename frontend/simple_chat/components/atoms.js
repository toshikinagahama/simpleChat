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
    name: '',
  },
});

export const socketState = atom({
  key: 'socket',
  default: null,
});
