import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { userState, socketState } from '../components/atoms';
import { useRecoilState } from 'recoil';
import Image from 'next/image';
import Auth from '../components/auth';
import MyNav from '../components/nav';

export default function User(pageProps) {
  const router = useRouter();
  const [user, setUser] = useRecoilState(userState);
  const [socket, setSocket] = useRecoilState(socketState);
  const [message, setMessage] = useState('');
  const [isShowMenuContent, setIsShowMenuContent] = useState(true);
  const [rooms, setRooms] = useState([
    {
      id: 'test1',
      name: 'test1',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      num_unread: 3,
      last_update: new Date(),
      last_message: 'やあ！',
    },
    {
      id: 'test2',
      name: 'test2',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      num_unread: 0,
      last_update: new Date(),
      last_message: 'やあ！',
    },
    {
      id: 'test3',
      name: 'test3',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      num_unread: 1,
      last_update: new Date(),
      last_message: 'やあ！',
    },
    {
      id: 'test4',
      name: 'test4',
      icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
      num_unread: 3,
      last_update: new Date(),
      last_message: 'やあ！',
    },
  ]);
  useEffect(async () => {
    if (window.innerWidth >= 672) {
      setIsShowMenuContent(true);
    } else {
      setIsShowMenuContent(false);
    }
    const token = localStorage.getItem('token');

    const res = await fetch('http://localhost:1323/restricted/get_users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_ids: [1, 3],
      }),
    }).catch(() => null);
    if (res != null) {
      const json_data = await res.json().catch(() => null);
      console.log(json_data);
      // if (json_data['result'] != null) {
      //   setComponent(children);
      // } else {
      //   router.replace('/');
      // }
    }

    const res2 = await fetch('http://localhost:1323/restricted/get_rooms', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null);
    if (res2 != null) {
      console.log(res2);
      const json_data = await res.json().catch(() => null);
      console.log(json_data);
      // if (json_data['result'] != null) {
      //   setComponent(children);
      // } else {
      //   router.replace('/');
      // }
    }
  }, []);

  return (
    <Auth>
      <div className="flex flex-col items-center justify-center min-h-screen w-screen">
        <Head>
          <title>部屋一覧</title>
        </Head>
        <MyNav title="あなたの部屋" />

        <main className="flex flex-col items-center justify-start w-full flex-1 container bg-zinc-100">
          {rooms.map((room) => {
            return (
              <Link href={'/room/' + room.id} key={room.id}>
                <a className="w-full">
                  <div className="w-full border-b-2 border-zinc-300 py-4 flex">
                    <div className="">
                      <div className="w-16 h-16 shadow-lg rounded-full p-2 mx-2">
                        <img src={room.icon} alt={''} width={80} height={80} />
                      </div>
                    </div>
                    <div className="flex-grow text-left px-4 py-2 flex flex-col justify-center">
                      <p className="text-sm mb-1">{room.name}</p>
                      <p className="text-gray-400 text-sm mt-1">{room.last_message}</p>
                    </div>
                    <div className="px-4 py-2 flex flex-col justify-between">
                      <p className="text-sm mb-1">
                        {`${('0' + room.last_update.getHours()).slice(-2)}:${(
                          '0' + room.last_update.getMinutes()
                        ).slice(-2)}`}
                      </p>
                      {room.num_unread != 0 && (
                        <div className="rounded-full w-8 h-8 bg-green-500" key={room.id}>
                          <div className="flex flex-col w-full h-full justify-center">
                            <p className="text-sm text-white text-center">{room.num_unread}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </Link>
            );
          })}
        </main>
      </div>
    </Auth>
  );
}
